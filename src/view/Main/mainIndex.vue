<template>
    <main class="main" @contextmenu.prevent>
        <friendsList
            :signal="signal"
            :avatarRefresh="avatarRefresh"
            @handleActiveFriend="handleActiveFriend"
        />
        <section class="chat-window">
            <section class="text-top">
                <div class="avatar" v-if="activeFriend">
                    <span>{{ activeFriend.name }}</span>
                    <span v-if="signal === 0" class="reconnect">{{'正在重连中...'}}</span>
                    <span v-if="signal === 2" class="disconnect">{{'已经断线,请检测网络环境是否可用'}}</span>
                </div>
                <div class="default-avatar" v-else>
                    <div style="width: 100%; height: 40px">
                        <span v-if="signal === 0" class="reconnect">{{'正在重连中...'}}</span>
                        <span v-if="signal === 2" class="disconnect">{{'已经断线,请检测网络环境是否可用'}}</span>
                    </div>
                </div>
                <img src="../../assets/setting.png" alt="setting" @click="showSettingDialog" />
                <!-- <el-badge is-dot class="badge-item">
                    <el-icon :size="20" style="margin-left: 10px;"><ChatSquare @click="handleTips" /></el-icon>
                </el-badge> -->
                <tipsMessages />
            </section>
            <ChatWindow v-if="activeFriend.chat_table" :chatBox="chatBox"
                :avatarRefresh="avatarRefresh" :markdown="isUseMd" @scroll="handleScroll" @deleted="handleDeleted"
                @withdraw="handleWithdraw" @quote="handleQuote" @loaded="handleLoaded" />
            <section class="zero-friend" v-else>还未选择聊天好友</section>
            <section style="position: relative">
                <comentQuote v-if="showQuote" :show-input-quote="true" :comment="comment" @close="handleQuoteClose" />
                <SendFoot v-if="activeFriend.chat_table" :upload-disable="!!activeFriend" :quote="comment" />
            </section>
        </section>
    </main>
    <AppSetting
        ref="appSetting"
        @avaterChange="handleAvatarChange"
        @nickNameChange="handleNickNameChange"
        @isUseMarkdown="handleIsUseMarkdown"
    />
    <!-- 测试模式用 -->
    <videoCallOfferer v-if="activeFriend && showOfferer" :friend="activeFriend" :socket="websocket || undefined" />
    <videoCallAnwserer v-if="showAnwserer" :friend="activeFriend" :socket="websocket || undefined"/>
    <!-- 铃声 -->
    <!-- <audio class="audio"
        src="../assets/audio/call.mp3"
        controls
        id="audioCall"
        hidden="true"
    >
    </audio> -->
</template>

<script setup lang="ts">
import {
    ref,
    onMounted,
    onBeforeUnmount,
    nextTick,
    watchEffect,
    watch,
    Ref,
} from 'vue'
import ChatWindow from '@/components/chatWindow/chatWindowIndex.vue'
import wsInit from '@/utils/ws'
import friendsList from '@/components/friendsList/friendsListIndex.vue'
import antiShake from '@/utils/antiShake'
import AppSetting from '@/components/appSetting/appSettingIndex.vue'
import SendFoot from '@/components/sendFoot/sendFootIndex.vue'
import to from 'await-to-js'
import { request, api } from '@/utils/api'
import comentQuote from '@/components/comentQuote/comentQuoteIndex.vue'
import videoCallOfferer from '@/components/VideoCallOfferer/videoCallOffererIndex.vue'
import videoCallAnwserer from '@/components/videoCallAnwserer/videoCallAnwsererIndex.vue'
import tipsMessages from '@/components/tipsMessages/tipsMessagesIndex.vue'
import { saveChatWindowPosition } from './Methods/savePosition'
import { deleteActionFriendPositionData, clearActionFriendPositionData } from './Methods/positionOperator'
import {
    dbReadRange,
    dbReadRangeNotOffset,
    dbReadRangeByArea,
    dbGetLastPrimaryKey
} from '@/utils/indexDB'

import {
    Box,
    Friend,
    WsConnectParams,
    IsSwitchFriend,
    Judge,
    Tips,
    Lock,
    Position
} from '@/interface/global'
import { DESC } from '@/interface/indexDB'
import { deleteLocalDataBaseData } from '@/utils/withdraw'
import { FootSendStore } from '@/components/sendFoot/store'
import { storeToRefs } from 'pinia'
import { MainStore } from './store'
import { ChatWindowStore } from '@/components/chatWindow/store'
import { FriendsListStore } from '@/components/friendsList/store'
import { getActionFriendPositionData } from './Methods/positionOperator'
import { VideoCallOfferer } from '@/components/VideoCallOfferer/store'
import { getUserInfo, updateUserInfo } from './Methods/userInfoOperator'

const { showOfferer, showAnwserer } = storeToRefs(VideoCallOfferer())


const friendsStore = FriendsListStore()
const { freshDeleteTextTip } = storeToRefs(friendsStore)
// 当前聊天框滚动的 scrollTop 值
let boxScrolltop: Ref<number> = ref(0)

// websocket 客户端
const {
    ws: websocket,
    reloadChatData:reconnectFresh,
    activeFriend,
    scrollSafeLength,
    chatBox,
    showQuote,
    comment,
    userInfo,
    signal,
    imgLoadList
}  = storeToRefs(MainStore())

const user_info = getUserInfo()
if (user_info) {
    userInfo.value = user_info
}


// 计时器
let refreshTokenTime: number | null | undefined = null

// const store = useStore()
const mainStore = MainStore()
const chatWindowStore = ChatWindowStore()
const { scrollData } = storeToRefs(chatWindowStore)

const footSendStore = FootSendStore()
const { isLastChatList, scrollUpLock, scrollDownLock } = storeToRefs(mainStore)

watch(() => reconnectFresh.value, (val:boolean) => {
    if (val) {
        if (activeFriend?.value?.user_id) {
            handleWsReconnect()
        }
    }
})

onMounted(async () => {
    const user_id = sessionStorage.getItem('user_id')
    const wsUrl = sessionStorage.getItem('wsBaseUrl')
    const url = `${wsUrl}?user_id=${user_id}`
    const wsParams: WsConnectParams = {url}
    wsInit(wsParams)
    getRefreshToken()
})

onBeforeUnmount(() => {
    // 卸载 websocket
    try {
        if (websocket.value) {
            (websocket.value as WebSocket).close()
        }
    } catch (err) {
        console.log('卸载 websocket 出错 -> ', err)
    }
    if (refreshTokenTime) {
        clearInterval(refreshTokenTime)
    }
    mainStore.setActiveFriend({
        name: '',
        user_id: '',
        phone_number: '',
        chat_table: '',
        active: false,
        searchActive: false
    })
})

// 刷新 refreshToken
function getRefreshToken() {
    const phone_number = userInfo.value.phone_number
    const user_id = userInfo.value.user_id
    refreshTokenTime = setInterval(async () => {
        const [err, res] = await to(
            request({
                url: api.refreshToken,
                method: 'post',
                data: {
                    phone_number,
                    user_id
                }
            })
        )
        if (!err) {
            // console.log('新 refreshToken -> ', res.data)
            sessionStorage.setItem('RefreshToken', res.data.refreshToken)
        }
    }, 1000 * 60 * 60)
}
// 滚动聊天框到底部
function scrollChatBoxToBottom() {
    const end_sp = scrollData.value.chatListDiv?.scrollHeight
    end_sp && scrollData.value.scrollBar.setScrollTop(end_sp)
    // 滚动到底部时，应该负责关掉回到最新按钮
    footSendStore.goToBottom = Judge.NO
}

function scrollChatBoxToSomePosition(start_sp: number) {
    const end_sp = scrollData.value.chatListDiv?.scrollHeight
    if (end_sp) {
        scrollData.value.scrollBar.setScrollTop(end_sp - start_sp)
    }
}

// 点击好友（切换好友）
async function handleActiveFriend(f: Friend) {
    // 切走之前,把数据保存到本地
    if (activeFriend.value.chat_table) {
        saveChatWindowPosition()
    }

    // 设置好友信息
    mainStore.setActiveFriend(f)
    // 不管有没有保存到磁盘,只要切换好友,就必须把获取记录的锁打开
    scrollUpLock.value = Lock.UnLock
    scrollDownLock.value = Lock.UnLock
    // 记录的结尾标识也需要重置
    isLastChatList.value = Judge.NO
    // 存在回到最新提示的也需要重置
    footSendStore.goToBottom = Judge.NO
    // 未显示内容需要重置
    footSendStore.pongSaveCacheData = []
    getChatFromServer(IsSwitchFriend.Yes, DESC.UP)
}

function handleChatData(data: Box[]): Box[] {
    return (
        data.map((i: Box) => {
            // const chatOb = JSON.parse(i.chat)
            if (userInfo.value.user_id === i.user_id) {
                i.user = 1
            } else {
                i.user = 0
            }

            return {
                // ...i,
                ...i
            }
        }) ?? []
    )
}

async function getChatFromServer(
    isSwitchFriend: IsSwitchFriend,
    rollingDeriction: DESC
) {
    if (isSwitchFriend === IsSwitchFriend.Yes) {
        firstTimeGetChatData()
    } else {
        normalGetChatData(rollingDeriction)
    }
}

// 首次点击获取数据
async function firstTimeGetChatData() {
    handlePositionAfterFirstTimeGetChatData()
}

// 平常滚动获取数据
async function normalGetChatData(rollingDeriction: DESC) {
    // 看下之前的 定位记录存不存在
    console.log(
        `向哪个方向处理 -> ${rollingDeriction === DESC.DOWN ? '向下' : '向上'}`
    )
    if (rollingDeriction === DESC.DOWN) {
        handlePositionAfterGetChatDataFromDown()
    } else {
        handlePositionAfterGetChatDataFromUp()
    }
}
// 获取数据后处理文件定位
async function handlePositionAfterGetChatDataFromUp() {
    // if (!scrollUpLock.value) return

    // 从服务器拉取聊天记录
    // 决定拉数据前，上锁，防止重复操作
    scrollUpLock.value = Lock.Locked

    const chat_table = activeFriend.value.chat_table
    const offset = chatBox.value[0].id
    // 没有定位信息，就不要拉数据了
    if (!offset) return
    const chatData: Box[] = []
    chatData.push(...(await dbReadRange(chat_table, offset as number, DESC.UP)))
    console.log('获取聊天记录 向上 -> ', chatData.length)

    const start_sp = scrollData.value.chatListDiv?.scrollHeight
    const resChatData = handleChatData(chatData || [])
    chatBox.value.unshift(...resChatData)
    nextTick(() => {
        // console.log('scrollData 3 -> ', scrollData)
        mediaDelayPosition(chatData, () => {
            if (start_sp) {
                scrollChatBoxToSomePosition(start_sp)
            }
        })
    })

    // 释放锁
    scrollUpLock.value = Lock.UnLock

    // 如果聊天记录已经全部获取完毕后，需要上锁，防止再次无效获取
    if (chatData?.length === 0) scrollUpLock.value = Lock.Locked
}

async function handlePositionAfterGetChatDataFromDown() {
    // if (!scrollDownLock) return

    // 从服务器拉取聊天记录
    // 决定拉数据前，上锁，防止重复操作
    scrollDownLock.value = Lock.Locked

    const chat_table = activeFriend.value.chat_table
    const offset = chatBox.value.length ? chatBox.value[chatBox.value.length - 1].id : 0
    // console.log('最后一个box数据 -> ', chatBox.value[chatBox.value.length - 1])
    const chatData: Box[] = []
    // chatData.push(...await dbReadRange(chat_table, position[chat_table].offset, isFromDown ? DESC.DOWN : DESC.UP))
    chatData.push(...(await dbReadRange(chat_table, offset as number, DESC.DOWN)))
    const lastId = await dbGetLastPrimaryKey(chat_table)
    console.log('获取聊天记录 向下 -> ', chatData.length)
    const tmpScrollTopValue = boxScrolltop.value
    const resChatData = handleChatData(chatData || [])
    chatBox.value.push(...resChatData)
    nextTick(() => {
        mediaDelayPosition(chatData, () => {
            scrollData.value.scrollBar.setScrollTop(tmpScrollTopValue)
            if (!chatData.length || lastId === chatData[chatData.length - 1]?.id) {
                console.log('donwn 到底了 ->', lastId)
                isLastChatList.value = Judge.YES
                scrollDownLock.value = Lock.Locked
                deleteActionFriendPositionData()
            }
        })
    })

    // 释放锁
    scrollDownLock.value = Lock.UnLock

    // 如果聊天记录已经全部获取完毕后，需要上锁，防止再次无效获取
    if (chatData?.length === 0) scrollDownLock.value = Lock.Locked
}

async function handlePositionAfterFirstTimeGetChatData() {
    const { chatData, lastId }: FirstTimeGetChatDataFromDataBase =
        await firstTimeGetChatDataFromDataBase()
    const position:Position = getActionFriendPositionData()
    if (position) {
        const dataIndex = chatBox.value.findIndex(
            item => item.id === position?.use
        )
        const children = scrollData.value.chatListDiv?.children
        if (dataIndex === -1 || !children) return
        const chatDivList: HTMLElement[] = [...children] as HTMLElement[]
        const div: HTMLElement = chatDivList[dataIndex]
        if (div) {
            mediaDelayPosition(chatData, () => {
                div.scrollIntoView()
                // 这里虽然有定位信息,但如果获取的聊天记录时最后一个记录的话,需要锁住滚动获取数据,并把位置信息删除
                if (lastId && chatData.length && lastId === chatData[chatData.length - 1].id) {
                    // console.log('到底了 -> ', lastId)
                    // 向下锁 锁死ß
                    scrollDownLock.value = Lock.Locked
                    isLastChatList.value = Judge.YES

                    if (!scrollData?.value?.el) return

                    const { scrollTop, clientHeight, scrollHeight } = scrollData.value.el
                    if (scrollTop + clientHeight < scrollHeight - 10) {
                        // 用于显示 "回到最新" Tip 按钮
                        footSendStore.goToBottom = Judge.YES
                    }
                } else {
                    footSendStore.goToBottom = Judge.YES
                }
            })
        }
    } else {
        // 随便设置值，后期需要优化
        mediaDelayPosition(chatData, () => {
            scrollChatBoxToBottom()
            isLastChatList.value = Judge.YES
        })
    }

    // 释放锁
    scrollUpLock.value = Lock.UnLock

    // 如果聊天记录已经全部获取完毕后，需要上锁，防止再次无效获取
    if (chatData?.length === 0) scrollUpLock.value = Lock.Locked
}

// 从数据库拿数据
interface FirstTimeGetChatDataFromDataBase {
    chatData: Box[]
    lastId: number | undefined
}
async function firstTimeGetChatDataFromDataBase(time: number = 5): Promise<FirstTimeGetChatDataFromDataBase> {
    // 将递归改成 for 方式，尽可能避免多次获取数据，导致内存溢出
    const chat_table = activeFriend.value.chat_table
    for (let i = 0; i < time; i++) {
        // 这个置空的情况不希望触发滚动事件
        // 因为这样会导致重复执行 getChatFromServer 函数
        chatBox.value = []
        const actionFriendPostionData = getActionFriendPositionData()
        const chatData: Box[] = []
        if (actionFriendPostionData) {
            // 这里获取的数据可能为空，Position 记录的信息可能会被 `删除` `撤回` `数据库操作错误`
            // 导致记录与实际情况有出入，所以这里获取为空时，需要尝试将 Position 信息删除，并从头获取
            let data = []
            data = await dbReadRangeByArea(
                chat_table,
                actionFriendPostionData?.first || 0,
                actionFriendPostionData?.last || 0
            )
            // 如果数据为空，尝试从头获取
            if (data.length === 0) {
                clearActionFriendPositionData()
                data = await dbReadRangeNotOffset(
                    chat_table,
                    DESC.UP,
                    scrollSafeLength.value
                )
            }
            // console.log('获取聊天记录 首次获取 1 ->', chatData, position[mainStore.positionId].first, position[mainStore.positionId].last)
            chatData.push(...data)
        } else {
            const data = await dbReadRangeNotOffset(
                chat_table,
                DESC.UP,
                scrollSafeLength.value
            )
            // console.log('获取聊天记录 首次获取 2 ->', chatData)
            chatData.push(...data)
        }
        const lastId = await dbGetLastPrimaryKey(chat_table)
        // console.log('获取聊天记录 首次获取 ->', chatData)
        const resChatData = handleChatData(chatData || [])

        chatBox.value.unshift(...resChatData)
        await nextTick()
        // console.log('scroll -> ',  scrollData.value.el.scrollHeight, scrollData.value.el.clientHeight, chatData[chatData.length - 1].id, lastId)
        // 为了防止获取到的数量不够滚动距离,这里做个递归处理,设置安全滚动距离
        if (
            scrollData?.value?.el?.scrollHeight === scrollData?.value?.el?.clientHeight &&
            chatData.length &&
            chatData.length < scrollSafeLength.value &&
            chatData[chatData.length - 1].id !== lastId
        ) {
            scrollSafeLength.value += Math.ceil(scrollSafeLength.value / 2)
            clearActionFriendPositionData()
            console.log('数量不够')
        } else {
            return {
                chatData,
                lastId
            }
        }
    }
    const lastId = await dbGetLastPrimaryKey(chat_table)

    // console.log('获取聊天记录 首次获取 空 ->')
    return {
        chatData: [],
        lastId
    }
}

// 媒体文件延迟定位处理
function mediaDelayPosition(chatData: Box[], cb: Function) {
    chatData.forEach((d: Box) => {
        if (d.type.includes('video') || d.type.includes('image')) {
            if (!imgLoadList.value.includes(d.chat_id)) {
                imgLoadList.value.push(d.chat_id)
            }
        }
    })

    if (imgLoadList.value.length) {
        const isAllLoadedStop = watchEffect(() => {
            if (imgLoadList.value.length === 0) {
                cb()
                isAllLoadedStop()
            }
        })
    } else {
        cb()
    }
}

const scrollOffsetAntiShakeFn = antiShake(saveChatWindowPosition, 500)
// 滚动条事件处理
// 创建一个防抖实例函数
const scrollAntiShakeFn = antiShake(getChatFromServer)
async function handleScroll(val: { scrollTop: number }) {
    // console.log('handleScroll scrollUpLock -> ', scrollUpLock)
    if (!scrollData.value?.el) {
        console.log('scrollData 没值2 -> ', scrollData.value)
        return
    }
    boxScrolltop.value = val.scrollTop
    scrollOffsetAntiShakeFn()
    // if (!scrollData.value?.el) return
    if (Math.floor(val.scrollTop) === 0 && scrollUpLock.value === Lock.UnLock) {
        scrollAntiShakeFn(IsSwitchFriend.No, DESC.UP)
    }
    if (
        val.scrollTop + scrollData.value.el.clientHeight + 5 >=
        scrollData.value.el.scrollHeight &&
        scrollDownLock.value === Lock.UnLock
    ) {
        // console.log('滚到了底部，需要获取数据了')
        scrollAntiShakeFn(IsSwitchFriend.No, DESC.DOWN)
    }
}

// app 设置弹窗弹出
const appSetting = ref()
function showSettingDialog() {
    appSetting.value.showDialog(true)
}

// 头像更新
const avatarRefresh: Ref<string> = ref('')
function handleAvatarChange(url: string) {
    avatarRefresh.value = url
}

// 更新好友信息
function handleNickNameChange(fri: any) {
    userInfo.value = fri
    // sessionStorage.setItem('user_info', JSON.stringify(fri))
    updateUserInfo(fri)
}

// 是否使用markdown
const isUseMd = ref(false)
function handleIsUseMarkdown(val: boolean) {
    isUseMd.value = val
}

// 删除处理
async function handleDeleted(idx: number) {
    const user_id = sessionStorage.getItem('user_id')
    const chat = chatBox.value[idx]
    const [err, res] = await to(
        request({
            method: 'post',
            url: api.deleteChat,
            data: {
                chat,
                del_flag: user_id
            }
        })
    )
    if (err) {
        console.log('删除失败 -> ', err)
    }
    if (res?.data !== 'err') {
        console.log('删除成功 -> ', res)
        deleteLocalDataBaseData(chatBox.value[idx])
        .then(() => {
            chatBox.value.splice(idx, 1)
            chat.text = '[已删除一条信息]'
            freshDeleteTextTip.value = { chat }
            // 重新保存定位信息
            saveChatWindowPosition()
        })
    } else {
        console.log('删除失败 -> ', res.data)
    }
}

// windowChat 撤回回调
async function handleWithdraw(idx: number) {
    // const [err, res] = await to(request({
    //     method: 'post',
    //     url: api.deleteChat,
    //     data: {
    //         chat: {
    //             ...chatBox.value[idx],
    //             thumbnail: '', // 缩略图可能很大,撤回并不需要带那么大的东西回后台
    //         },
    //     }
    // }))
    // if (err) {
    //     console.log('撤回失败 -> ', err)
    //     return
    // }

    // if (res.data === 'ok') {
    //     console.log('撤回成功 -> ', res)
    //     centerDeleted(chatBox.value[idx])
    // } else {
    //     console.log('撤回失败 -> ', res.data)
    // }
    deleteLocalDataBaseData(chatBox.value[idx])
        .then(() => {
            chatBox.value[idx].text = '[撤回一条信息]'
            freshDeleteTextTip.value = { chat: chatBox.value[idx] }
            chatBox.value.splice(idx, 1)

            // 撤回或者删除后，需要重新设置定位信息
            saveChatWindowPosition()
        })
        .catch(err => {
            console.log('撤回失败 uj -> ', err)
        })
    const ws = websocket.value as WebSocket
    if (chatBox.value[idx]?.thumbnail) {
        delete chatBox.value[idx].thumbnail
    }
    const tipsParams: Tips = {
        messages_type: 'withdraw',
        messages_box: chatBox.value[idx],
        to_id: activeFriend.value.user_id
    }
    ws.send(JSON.stringify(tipsParams))
}

// windowChat 引用回调
async function handleQuote(idx: number) {
    showQuote.value = true
    if (chatBox.value[idx].type !== 'text') {
        comment.value = '[文件] ' + chatBox.value[idx].fileName
    } else {
        comment.value = chatBox.value[idx].text
    }
}

// 关掉引用窗口
function handleQuoteClose() {
    comment.value = ''
    showQuote.value = false
}

// 处理图片加载完成事件
function handleLoaded(chat_id: string) {
    if (imgLoadList.value.length) {
        const fdidx = imgLoadList.value.findIndex(f => f === chat_id)
        if (fdidx !== -1) {
            imgLoadList.value.splice(fdidx, 1)
        }
    }
}

// websocket 重连刷新
function handleWsReconnect() {
    // store.commit('footSend/setGotoBottomState', true)
    footSendStore.goToBottom = Judge.YES
    // 如果上锁了，就将锁解开，让它自由的获取到数据
    if (scrollDownLock.value === Lock.Locked) {
        scrollDownLock.value = Lock.UnLock
        isLastChatList.value = Judge.NO
    }

    // 关掉 realoadChatData
    nextTick(() => {
        // store.commit('global/setReloadChatData', false)
        mainStore.setReloadChatData(false)
    })
}
</script>

<style lang="scss" scoped>
.main {
    background-image: url('../../assets/login_bg.png');
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-color: #f5f6fa;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    user-select: none;
}

.chat-window {
    width: 50vw;
    height: 92vh;
    min-width: 600px;
    max-width: 700px;
    max-height: 700px;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    border-radius: 0 5px 5px 0;
    // border-radius: 5px;
    // box-shadow: 0px 1px 6px 6px rgba(221, 223, 230, 0.31);
}

.text-top {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    padding: 12px;
    box-shadow: 0px 3px 6px 0px rgba(221, 223, 230, 0.31);
    font-family: Source Han Sans CN;
    user-select: none;

    img {
        width: 17px;
        height: 17px;
        -webkit-user-drag: none;
        cursor: pointer;
    }

    .avatar {
        flex: 1;
        display: flex;
        align-items: center;
        position: relative;

        img {
            width: 40px;
            height: 40px;
            -webkit-user-drag: none;
        }

        span {
            margin-left: 19px;
            font-size: 18px;
            color: #333333;
            user-select: text;
        }
    }
}

.showTime {
    text-align: center;
    font-size: 18px;
    color: #666666;
    box-sizing: border-box;
    font-family: Source Han Sans CN;
    padding: 10px;
}

.reconnect {
    font-size: 14px !important;
    color: #9f9f9f !important;
    margin-top: 12px !important;
}

.disconnect {
    font-size: 14px !important;
    color: #ff7373 !important;
    margin-top: 12px !important;
}

.default-avatar {
    flex: 1;
}

.zero-friend {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #999999;
    background-color: #f8f8f86e;
}

:deep .el-textarea__inner {
    box-shadow: 0 0 0 0px var(--el-input-border-color, var(--el-border-color)) inset;
    resize: none;
}
</style>

<style lang="scss">
.custom-notification-class {
    padding: 10px 0;
    align-items: center;

    .el-icon {
        width: 20%;

        .notify-img {
            width: 47px;
        }
    }

    .el-notification__group {
        flex: 1;
    }

    .custom-notification {
        display: flex;
        align-items: center;

        .custom-notification-title {
            font-size: 16px;
            font-weight: bold;
            flex: 1;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            width: 40px;
        }

        .custom-notification-box {
            // width: 100%;
            display: flex;
            flex-direction: column;
            align-items: flex-end;

            .custom-notification-button-confirm {
                display: inline-block;
                background: #0087ff;
                width: 52px;
                text-align: center;
                padding: 3px;
                // margin: 10px 0;
                margin-bottom: 10px;
                border-radius: 3px;
                box-shadow: 1px 1px 1px #ddd;
                color: #fff;
                cursor: pointer;
            }

            .custom-notification-button-cancel {
                display: inline-block;
                background: #e6e8eb;
                width: 52px;
                text-align: center;
                padding: 3px;
                // margin: 10px 0;
                border-radius: 3px;
                box-shadow: 1px 1px 1px #ddd;
                color: #303133;
                cursor: pointer;
            }
        }
    }
}

.badge-item {
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
