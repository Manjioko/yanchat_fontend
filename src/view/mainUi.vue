<template>
    <main class="main" @contextmenu.prevent>
        <friendsList
            :friends="userInfo.friends"
            :refreshChatDataOb="newChatData"
            :tryToRefreshChatOb="trytoRfChat"
            :signal="signal"
            :avatarRefresh="avatarRefresh"
            @handleActiveFriend="handleActiveFriend"
        />
        <section class="chat-window">
            <section class="text-top">
                <div class="avatar" v-if="activeFriend">
                    <span>{{ activeFriend.name }}</span>
                    <span v-if="signal === 0" class="reconnect">{{ '正在重连中...' }}</span>
                    <span v-if="signal === 2" class="disconnect">{{ '已经断线,请检测网络环境是否可用' }}</span>
                </div>
                <div class="default-avatar" v-else>
                    <div style="width: 100%; height: 40px;">
                        <span v-if="signal === 0" class="reconnect">{{ '正在重连中...' }}</span>
                        <span v-if="signal === 2" class="disconnect">{{ '已经断线,请检测网络环境是否可用' }}</span>
                    </div>
                </div>
                <img src="../assets/setting.png" alt="setting" @click="showSettingDialog">
            </section>
            <ChatWindow
                v-if="activeFriend"
                ref="chatWindow"
                :chatBox="chatBox"
                :avatarRefresh="avatarRefresh"
                :markdown="isUseMd"
                @scroll="handleScroll"
                @deleted="handleDeleted"
                @withdraw="handleWithdraw"
                @quote="handleQuote"
                @loaded="handleLoaded"
            />
            <section class="zero-friend" v-else>
                还未选择聊天好友
            </section>
            <section style="position: relative;">
                <comentQuote v-if="showQuote" :show-input-quote="true" :comment="comment" @close="handleQuoteClose" />
                <SendFoot
                v-if="activeFriend"
                :upload-disable="!!activeFriend"
                :quote="comment"
                @center="Center"
                @videoCallStart="handleVideoCallStart"
                />
            </section>
        </section>
    </main>
    <AppSetting
        ref="appSetting"
        @exit="handleExit"
        @avaterChange="handleAvatarChange"
        @nickNameChange="handleNickNameChange"
        @isUseMarkdown="handleIsUseMarkdown"
    />
    <!-- 测试模式用 -->
    <videoCallOfferer
        v-if="activeFriend && showOfferer"
        :friend="activeFriend"
        :socket="websocket"
        :anwser-data="videocallAnwserData"
        @destroy="destroyVideoCallOfferer"
        @center="Center"
    />
    <videoCallAnwserer
        v-if="showAnwserer"
        :friend="activeFriend"
        :socket="websocket"
        :offer-data="videocallOfferData"
        @destroy="destroyVideoCallAnwserer"
    />
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

import { ref, onMounted, onBeforeUnmount, nextTick, watchEffect, h, Ref, computed } from 'vue'
import { useStore } from 'vuex'
import ChatWindow from '@/components/chatWindow.vue'
import ws from '@/utils/ws'
import friendsList from '@/components/friendsList.vue'
import antiShake from '@/utils/antiShake'
import AppSetting from '@/components/appSetting.vue'
import SendFoot from '@/components/sendFoot.vue'
import router from '@/router/router'
import to from 'await-to-js'
import { request, api } from '@/utils/api'
import comentQuote from '@/components/comentQuote.vue'
import { ElNotification, NotificationHandle } from 'element-plus'
import videoCallOfferer from '@/components/videoCallOfferer.vue'
import videoCallAnwserer from '@/components/videoCallAnwserer.vue'
// import localforage from 'localforage'
import {
    dbAdd,
    dbReadRange,
    dbReadRangeNotOffset,
    dbReadRangeByArea,
    dbGetLastPrimaryKey
    // dbReadAll,
    // dbReadSome
} from '@/utils/indexDB'

import {
    Box,
    Friend,
    UserInfo,
    RefreshMessage,
    InitBox,
    WsConnectParams,
    PingPong,
    Position,
    IsSwitchFriend
} from '@/interface/global'
import { VideoConfig, InitVideoConfig } from '@/interface/video'
// import { offsetType } from '@/types/global'
import { DESC } from '@/interface/indexDB'


// 测试数据
// const phone = ref(sessionStorage.getItem('phone'))

let chatBox:Ref<Box[]> = ref([])
// 当前聊天框滚动的 scrollTop 值
let boxScrolltop:number = 0
// websocket 客户端
let websocket:Ref<WebSocket | undefined> = ref(undefined)
const userInfo:Ref<UserInfo> = ref({
    friends: '[]',
    phone_number: '',
    user_id: '',
    user: ''
})
// 连接信号
let signal:Ref<number> = ref(0)

// 用户信息
userInfo.value = JSON.parse(sessionStorage.getItem('user_info') || '')
// 好友信息
let userFriends:Friend[] = JSON.parse(userInfo.value.friends)

// 计时器
let refreshTokenTime: number | null | undefined = null

const store = useStore()
const scrollBar = computed(() => store.state.chatWindow.scrollBar)
const showGotoBottom = computed(() => store.state.footSend.goToBottom)

// const route = useRoute()
onMounted(async () => {
    // console.log('route -> ', userInfo.value.chat_table)
    const user_id = sessionStorage.getItem('user_id')
    const wsUrl = sessionStorage.getItem('wsBaseUrl')
    // console.log('user id -> ', user_id)
    const url = `${wsUrl}?user_id=${user_id}`
    const wsParams: WsConnectParams = {
        ws: websocket,
        url,
        centerFn: Center,
        pingPongFn: PingPongCenter,
        videoFn: VideoCenter,
        signal
    }
    ws(wsParams)
    getRefreshToken()
})

onBeforeUnmount(() => {
    // 卸载 websocket
    try {
        if (websocket.value) {
            (websocket.value as WebSocket).close()
        }
    } catch(err) {
        console.log('卸载 websocket 出错 -> ', err)
    }
    if (refreshTokenTime) {
        clearInterval(refreshTokenTime)
    }
})

// 刷新 refreshToken
function getRefreshToken() {
    const phone_number = userInfo.value.phone_number
    const user_id = userInfo.value.user_id
    refreshTokenTime = setInterval(async () => {
        const [err, res] = await to(request({
            url: api.refreshToken,
            method: 'post',
            data: {
                phone_number,
                user_id
            }
        }))
        if (!err) {
            // console.log('新 refreshToken -> ', res.data)
            sessionStorage.setItem('RefreshToken', res.data.refreshToken)
        }
    }, 1000 * 60 * 60)
}

let newChatData:Ref<RefreshMessage> = ref({
    chat: InitBox
})
let trytoRfChat:Ref<RefreshMessage> = ref({
    chat: InitBox
})
function Center(chatData: Box, type?: string): void {

    // 发送消息
    if (type === 'sent') {
        console.log('发送信息 -> ', chatData)
        if (!websocket.value) {
            ElNotification({
                type: 'error',
                title: '提示',
                message: '已经与服务器断开连接,无法发送消息'
            })
            return
        }
        if (!activeFriend.value) {
            ElNotification({
                type: 'error',
                title: '提示',
                message: '尚未选择好友'
            })
            return
        }

        // 清空引用
        showQuote.value = false
        comment.value = ''

        // 以下的三个参数必传
        // 第一个 to_table 代表 聊天记录数据库名称
        // 第二个 to_id 代表 聊天对象的 id
        // 第三个 user_id 代表 自己的 id
        // 第四个 receivedType 代表 信息被接收时类型
        Object.assign(chatData, {
            to_table: activeFriend.value.chat_table,
            to_id: activeFriend.value.user_id,
            user_id: userInfo.value.user_id
        })

        // core
        chatBox.value.push(chatData)
        if (chatData.progress !== undefined) {
            // if (chatData.type.includes('video') || chatData.type.includes('image')) {
            //     console.log('图片或视频上传测试,不上传到服务器')
            // } else {
            //     const stop = watchEffect(() => {
            //         if (chatData.progress >= 100 && chatData.response) {
            //             websocket.value.send(JSON.stringify(chatData))
            //             stop()
            //         }
            //     })
            // }
            const stop = watchEffect(() => {
                if ((chatData.progress || 0) >= 100 && chatData.response) {
                    if (websocket.value) {
                        const ws = websocket.value as WebSocket
                        ws.send(JSON.stringify(chatData))
                    }
                    
                    // if (chatData.type.includes('video') || chatData.type.includes('image')) {
                    //     nextTick(() => {
                    //         const end_sp = chatWindow.value.scrollBar.wrapRef.children[0].scrollHeight
                    //         chatWindow.value.scrollBar.setScrollTop(end_sp)
                    //     })
                    // }
                    stop()
                }
                if (chatData.destroy) {
                    // console.log('mainUI 上传失败提示!')
                    if (websocket.value) {
                        const ws = websocket.value as WebSocket
                        ws.send(JSON.stringify(chatData))
                    }
                }
            })
        } else {
            if (websocket.value) {
                const ws = websocket.value as WebSocket
                ws.send(JSON.stringify(chatData))
                // console.log('mainUI 发送消息!', chatData)
            }
        }

        // 等待 pong, 显示 loading 图标
        if (!('progress' in chatData)) {
            chatData.loading = true   
        } else {
            newChatData.value = {
                // isUnread 为 1时标记为未读，0 时标记为已读需要展示
                isUnread: 0,
                chat: chatData
            }
        }
        const stopLoading = watchEffect(() => {
            if (chatData.loading === false) {
                console.log('stopLoading -> ', chatData)
                newChatData.value = {
                    // isUnread 为 1时标记为未读，0 时标记为已读需要展示
                    isUnread: 0,
                    chat: chatData
                }
                stopLoading()
            }
        })
    }

    // 接收信息
    if (type === 'received') {
        // console.log('mainUI 接收信息!', chatData)
        try {
            // const chatData = JSON.parse(chatData)
            // console.log('id 比较 -> ', chatData.user_id, userInfo.value.user_id)
            if (chatData.user_id === userInfo.value.user_id) {
                chatData.user = 1
            } else {
                chatData.user = 0
            }
            console.log('activeFriend.value -> ', activeFriend.value)
            if (chatData.user_id === activeFriend?.value?.user_id) {
                // console.log('发到自己的信息 -> ', chatData.type)
                // 发给自己的信息主要分两种 <1> 是展示用的信息 <2> 是撤回信息
                // 先处理撤回信息
                chatBox.value.push(chatData)
                newChatData.value = {
                    isUnread: 0,
                    chat: chatData,
                }
                // 保存到数据库
                // dbAdd(chatData)
            } else {
                // console.log('发到别处的信息 -> ', chatData)
                // 撤回信息不推送到好友栏
                newChatData.value = {
                    isUnread: 1,
                    chat: chatData,
                } 

            }
            // 推送消息到桌面
            notifyToWindow(chatData)
        } catch (err) {
            console.log('接收错误 -> ', err)
        }
    }

    if (type === 'deleted') {
        centerDeleted(chatData)
    }

    if (activeFriend.value && chatWindow?.value?.scrollBar) {
        nextTick(() => {
            const end_sp = chatWindow.value.scrollBar.wrapRef.children[0].scrollHeight
            chatWindow.value.scrollBar.setScrollTop(end_sp)
            // console.log('end_sp -> ', end_sp, chatWindow.value)
        })
    }
}

function PingPongCenter(data: PingPong, type?: string) {
    console.log('pingpong -> ', data, type)
    if (type === 'pong') {
        centerPong(data)
    }
}

function VideoCenter(data: VideoConfig, type?: string) {
    console.log('data -> ', data, type)
        // 视频通话 anwser 通信
        if (type === 'videoCallAnwser') {
        console.log('video call event1 -> ', type)
        centerVideoCallAnwser(data)
    }

    // 视频通话 offer 通信
    if (type === 'videoCallOffer') {
        console.log('video call event2 -> ', type)
        centerVideoCallOffer(data)
    }

    // 结束视频通话
    if (type === 'videoCallLeave') {
        console.log('video call event3 -> ', type)
        centerVideoCallLeave(data)
    }

    // 视频通话请求
    if (type === 'videoCallRequest') {
        console.log('video call event4 -> ', type)
        centerVideoCallRequest(data)
    }

    // 视频通话请求回复
    if (type === 'videoCallResponse') {
        console.log('video call event5 -> ', type)
        centerVideoCallResponse(data)
    }
}

// 接收信息撤回处理
function centerDeleted(chat: Box) {
    const isActive = activeFriend.value?.chat_table === chat.to_table
    if (isActive) {
        // console.log('撤回 -> 0')
        const idx = chatBox.value.findIndex(i => i.chat_id === chat.chat_id)
        if (idx !== -1) {
            chatBox.value.splice(idx, 1)
        }
        chat.text = '[撤回一条信息]'
        trytoRfChat.value = { chat }
        return
    }
    chat.text = '[撤回一条信息]'
    trytoRfChat.value = { chat }
    // console.log('撤回 -> 1')
}

// 接收消息回响
function centerPong(data: PingPong) {
    // console.log('123 -> ', data, activeFriend.value)
    if (activeFriend.value.chat_table === data.to_table) {
        // console.log('xxx')
        const len =  chatBox.value.length - 1
        for (let i = len; i >= 0; i--) {
            const chat = chatBox.value[i]
            if (chat.chat_id === data.chat_id) {
                if (chat.loading) chat.loading = false
                // 这里设置 id 是方便后续对聊天框内容的精准定位,获取等操作提供锚点
                chatBox.value[i].id = data.id
                dbAdd(chat.to_table, [{...chat, id: data.id}])
                .then(res => {
                    console.log('存入数据库成功了 -> ', res)
                }).catch(err => {
                    console.log('存入数据库失败了 -> ', err)
                })
                return
            }
        }
    }
}


// 开启视频通话
const showAnwserer:Ref<boolean> = ref(false)
const videocallOfferData:Ref<any> = ref(null)
function centerVideoCallOffer(chatData: VideoConfig) {
    // console.log('视频通话开始了 -> ', chatData)
    videocallOfferData.value = chatData
    showAnwserer.value = true
}

const showOfferer = ref(false)
const videocallAnwserData:Ref<VideoConfig> = ref(InitVideoConfig)
function centerVideoCallAnwser(chatData:VideoConfig) {
    // console.log('视频通话开始了 -> ', chatData)
    videocallAnwserData.value = chatData
    // showOfferer.value = true
}

function destroyVideoCallOfferer() {
    showOfferer.value = false
}

function destroyVideoCallAnwserer() {
    showAnwserer.value = false
}

function centerVideoCallRequest(chatData:VideoConfig) {
    // videocallOfferData.value = chatData
    // showAnwserer.value = true
    console.log('请求数据是 ->', chatData)
    const id = chatData.user_id
    const friends = JSON.parse(sessionStorage.getItem('user_info')|| '')?.friends ?? '[]'
    console.log('好友是 -》 ', friends)
    const userName = JSON.parse(friends).find((i: { user_id: any }) => i.user_id === id)?.user ?? ''
    const rejectfn = (notify: NotificationHandle) => {
        videocallOfferData.value = {
            ...chatData,
            // 拒绝接通
            reject: true
        }
        showAnwserer.value = true
        
        notify?.close()
    }
    const notify = ElNotification({
        message: h('div', { class: 'custom-notification' }, [
            h('div', {class: 'custom-notification-title'}, `好友 ${userName} 请求与你视频通话`),
            h('div', {class: 'custom-notification-box'}, [
                h('a', {
                    class: 'custom-notification-button-confirm',
                    onClick: () => {
                        // sendRequestConfig.data = 'ok'
                        // props.socket.send(JSON.stringify(sendRequestConfig))
                        console.log('ok')
                        videocallOfferData.value = chatData
                        showAnwserer.value = true
                        notify.close()
                    }
                }, '确定'),
                h('a', {
                    class: 'custom-notification-button-cancel',
                    onClick: () => {
                        // videocallOfferData.value = {
                        //     ...chatData,
                        //     // 拒绝接通
                        //     reject: true
                        // }
                        // showAnwserer.value = true
                        
                        // notify.close()
                        rejectfn(notify)
                    }
                }, '取消'),
            ]),
            
        ]),
        duration: 0,
        showClose: false,
        customClass: 'custom-notification-class',
        position: 'bottom-right',
        icon: h('img', {
            src: require('../assets/video_notify.png'),
            class: 'notify-img'
        }),
    })

    // 1 分钟后自动拒绝
    setTimeout(() => {
        if (!videocallOfferData.value) {
            rejectfn(notify)
        }
    }, 1000 * 60)
}

function centerVideoCallResponse(chatData: VideoConfig) {
    videocallAnwserData.value = chatData
}

// 结束通话中转
function centerVideoCallLeave(chatData: VideoConfig) {
    if (chatData.from === 'offerer') {
        videocallOfferData.value = chatData
        return
    }
    videocallAnwserData.value = chatData
}



function handleVideoCallStart() {
    // console.log('点击了视频通话 -> ', data)
    showOfferer.value = true
}

// 推送到 window 桌面
function notifyToWindow(textOb: { text: any; user_id: any }) {
    // console.log('text ', textOb,document.hidden)
    if (!textOb || !textOb.text) return
    // 在当前页面时，不弹出通知栏
    if (!document.hidden) return

    if (Notification.permission === 'granted') {
        // console.log('新消息 -> ', userFriends)
        const fr = userFriends?.find((f:Friend) => f.user_id === textOb.user_id)
        // console.log('fr', fr)
        const notification = new Notification(fr?.name || '新消息', {
            body: textOb.text || '',
            // 可选的通知图标
            // icon: require('../assets/avatar1.png'),
        });

        notification.onclick = function () {
            // 点击通知时的操作
        };
    }

}

// 选择好友
const activeFriend:Ref<Friend> = ref({
    name: '',
    user_id: '',
    phone_number: '',
    chat_table: '',
    active: false,
    searchActive: false
})
const imgLoadList:Ref<number[]> = ref([])

// 点击好友（切换好友）
async function handleActiveFriend(f: Friend) {

    // 切走之前,把数据保存到本地
    if (activeFriend.value.chat_table) {
        saveChatWindowPosition()
    }

    // 设置好友信息
    activeFriend.value = f
    // 不管有没有保存到磁盘,只要切换好友,就必须把获取记录的锁打开
    isGetChatHistoryFromUp = true
    isGetChatHistoryFromDown = true
    getChatFromServer(IsSwitchFriend.Yes, DESC.UP)
}

// 将好友聊天定位位置保存到 vuex 中
function saveChatWindowPosition() {
    // console.log(`Reset offset -> ${isResetOffset ? 'Yes' : 'No'}`)
    const chatWindowRect = scrollBar.value.wrapRef.getBoundingClientRect() 
    const chatDivList:HTMLLIElement[] = [...scrollBar.value.wrapRef.children[0].children[0].children]
    let canSaw:any[] = []
    chatDivList.forEach((div, idx) => {
        const rect = div.getBoundingClientRect()
        if (rect.top >= chatWindowRect.top && rect.bottom <= chatWindowRect.bottom) {
            canSaw.push({
                index: idx,
                id: chatBox.value[idx].id,
                // rect
            })
        }
    })
    if (canSaw.length) {
        let extendFirst = chatBox.value[canSaw[0].index as number - 5] || chatBox.value[0]
        let extendLast = chatBox.value[canSaw[canSaw.length - 1].index as number + 5] || chatBox.value[chatBox.value.length - 1]
        console.log('last -> ', extendLast.id, extendFirst.id)
        if ((extendLast.id as number) - (extendFirst.id as number) < 12) {
            console.log('小于 12')
            extendFirst = chatBox.value[0]
            extendLast = chatBox.value[chatBox.value.length - 1]
        }
        if (extendFirst && extendLast) {
            // console.log('extend -> ', extendFirst, extendLast)
            const beforedata:{ [chat_table: string]: Position } = JSON.parse(localStorage.getItem('Position') || '{}')
            const af = activeFriend.value
            // console.log('beforedata[af.chat_table]?.offset -> ', beforedata[af.chat_table]?.offset)
            const saveData:Position  = {
                first: extendFirst.id as number,
                last: extendLast.id as number,
                use: canSaw[0].id,
                // area: canSaw[0].rect.toJSON(),
                // offset: chatBox.value[0].id as number
            }
            const scrollHeight = scrollBar.value.wrapRef.scrollHeight
            const clientHeight = scrollBar.value.wrapRef.clientHeight
            if (boxScrolltop + clientHeight + 5 >= scrollHeight && !isGetChatHistoryFromDown) {
                // const beforedata: { [chat_table: string]: Position } = JSON.parse(localStorage.getItem('Position') || '{}')
                if (beforedata[activeFriend.value.chat_table]) {
                    console.log('滚到底部,并且锁住消息获取时,应该删掉定位信息 -> ')
                    delete beforedata[activeFriend.value.chat_table]
                    localStorage.setItem('Position', JSON.stringify(beforedata))
                    // 如果存在回到最新位置,则把其去掉
                    store.commit('footSend/setGotoBottomState', false)
                } else {
                    beforedata[af.chat_table] = saveData
                    localStorage.setItem('Position', JSON.stringify(beforedata))
                    console.log('定位信息 -> ', saveData)
                }
            } else {
                beforedata[af.chat_table] = saveData
                localStorage.setItem('Position', JSON.stringify(beforedata))
                console.log('定位信息 -> ', saveData)
            }
        } else {
            console.log('extendFirst 或 extendLast 不存在')
        }
    } else {
        console.log('cansaw 为空')
    }
}
// 从本地获取聊天记录
// async function getChatFromLocal(offset: number, f: Friend): Promise<Box[]> {
//     const user_id = sessionStorage.getItem('user_id') || ''
//     // 将上次保存的offset信息释放到内存中
//     offsetOb = JSON.parse(localStorage.getItem(user_id + 'offsetOb') || '{}')
//     // const oldDataOffset = offsetOb[f.chat_table]?.dataOffset || 0
    
//     let boxData: Box[] = []
//     if (offset) {
//         console.log('有')
//         boxData = await dbReadRange(f.chat_table, offset)
//     } else {
//         console.log('没有')
//         boxData = await dbReadRangeNotOffset(f.chat_table)
//     }
//     console.log('boxData -> ', boxData)
    
//     // 如果boxData的长度大于 0, 说明有数据,需要保存 offset 信息
//     if (boxData.length > 0) {
//         const dataOffset = boxData[0].id
//         if (!offsetOb[f.chat_table]) {
//             offsetOb[f.chat_table] = {}
//         }
//         offsetOb[f.chat_table].dataOffset = dataOffset
//         console.log('保存 dataOffset 信息 -> ', dataOffset)
//     }

//     return boxData

// }

// 处理本地聊天记录
// eslint-disable-next-line no-unused-vars
// function handleChatDataFromLocal(boxData: Box[], f: Friend) {
//     const scrollOffset = offsetOb[f.chat_table]?.scrollOffset || 0
//     chatBox.value = []
//     chatBox.value = boxData || []
//     nextTick(() => {
//         boxData.forEach((d: { type: string | string[] }, i: number) => {
//             if (d.type.includes('video') || d.type.includes('image')) {
//                 imgLoadList.value.push(i)
//             }
//         })
        
//         if (imgLoadList.value.length) {
//             const isAllLoadedStop = watchEffect(() => {
//             if (imgLoadList.value.length === 0) {
//                     // console.log('所有图片加载完成 -> ', imgLoadList.value)
//                     chatWindow.value.scrollBar.setScrollTop(scrollOffset)
//                     isAllLoadedStop()
//                 }
//             })
//         } else {
//             chatWindow.value.scrollBar.setScrollTop(scrollOffset)
//             // saveChatWindowPosition()
//         }
//     })
// }

// eslint-disable-next-line no-unused-vars
// function handleChatDataFromLocalNew(boxData: Box[], f: Friend) {
//     const position: { [chat_table: string]: Position } = JSON.parse(localStorage.getItem('Position') || '{}')
//     const nowFriendPositionData: Position = position[f.chat_table]
//     const { first, last } = nowFriendPositionData
//     console.log('friend position -> ', nowFriendPositionData)
//     dbReadRangeByArea(f.chat_table, first, last)
//     .then(res => {
//         console.log('返回值 -> ', res)
//         chatBox.value = []
//         chatBox.value = res
//     })
//     .catch(err => {
//         console.log('err -> ', err)
//     })

// }

function handleChatData(data: Box[]): Box[] {
    return data.map((i:Box) => {
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
}


// 接收到信息时信息栏滚动到底部
const chatWindow = ref()

// 查询锁 向上锁
let isGetChatHistoryFromUp = true
// 查询锁，向下锁
let isGetChatHistoryFromDown = true

// 从服务器获取聊天记录
// offsetOb 可以放置不同的 offset, 比如数据库的 offset, 和滚动距离的 offset
// let offsetOb:{ [key: string]: offsetType  } = {}
async function getChatFromServer(isSwitchFriend: IsSwitchFriend, rollingDeriction: DESC) {
    if (isSwitchFriend === IsSwitchFriend.Yes) {
        firstTimeGetChatData()
    } else {
        normalGetChatData(rollingDeriction)
    }
}

// 首次点击获取数据
async function firstTimeGetChatData() {
    // 看下之前的 定位记录存不存在
    // const position:{ [chat_table: string]: Position } = JSON.parse(localStorage.getItem('Position') || '{}')
    handlePositionAfterFirstTimeGetChatData()
}

// 平常滚动获取数据
async function normalGetChatData(rollingDeriction:DESC) {
    // 看下之前的 定位记录存不存在
    // const position:{ [chat_table: string]: Position } = JSON.parse(localStorage.getItem('Position') || '{}')
    // const chat_table = activeFriend.value.chat_table

    // if (!position[chat_table]) {
    //     return
    // }
    console.log(`向哪个方向处理 -> ${rollingDeriction === DESC.DOWN ? '向下' : '向上'}`)
    if (rollingDeriction === DESC.DOWN) {
        handlePositionAfterGetChatDataFromDown()
    } else {
        handlePositionAfterGetChatDataFromUp()
    }
}
// 获取数据后处理文件定位
async function handlePositionAfterGetChatDataFromUp() {
    if (!isGetChatHistoryFromUp) return

    // 从服务器拉取聊天记录
    // 决定拉数据前，上锁，防止重复操作
    isGetChatHistoryFromUp = false

    const chat_table = activeFriend.value.chat_table
    const offset =  chatBox.value[0].id
    const chatData:Box[] = []
    // chatData.push(...await dbReadRange(chat_table, position[chat_table].offset, isFromDown ? DESC.DOWN : DESC.UP))
    chatData.push(...await dbReadRange(chat_table, offset as number, DESC.UP))
    console.log('获取聊天记录 向上 -> ', chatData)

    const start_sp = chatWindow.value.scrollBar.wrapRef.children[0].scrollHeight
    const resChatData = handleChatData(chatData || [])
    chatBox.value.unshift(...resChatData)
    nextTick(() => {
        mediaDelayPosition(() => {
            const end_sp = chatWindow.value.scrollBar.wrapRef.children[0].scrollHeight
            console.log('sp -> ', start_sp, end_sp)
            chatWindow.value.scrollBar.setScrollTop(end_sp - start_sp)
        })
    })

    // 释放锁
    isGetChatHistoryFromUp = true

    // 如果聊天记录已经全部获取完毕后，需要上锁，防止再次无效获取
    if (chatData?.length === 0) isGetChatHistoryFromUp = false 
}

async function handlePositionAfterGetChatDataFromDown() {

    if (!isGetChatHistoryFromDown) return

    // 从服务器拉取聊天记录
    // 决定拉数据前，上锁，防止重复操作
    isGetChatHistoryFromDown = false

    const chat_table = activeFriend.value.chat_table
    const offset =  chatBox.value[chatBox.value.length - 1].id
    const chatData: Box[] = []
    // chatData.push(...await dbReadRange(chat_table, position[chat_table].offset, isFromDown ? DESC.DOWN : DESC.UP))
    chatData.push(...await dbReadRange(chat_table, offset as number, DESC.DOWN))
    console.log('获取聊天记录 向下 -> ', chatData)
    const tmpScrollTopValue = boxScrolltop
    const resChatData = handleChatData(chatData || [])
    chatBox.value.push(...resChatData)
    nextTick(() => {
        // chatWindow.value.scrollBar.setScrollTop(tmpScrollTopValue)
        mediaDelayPosition(() => {
            chatWindow.value.scrollBar.setScrollTop(tmpScrollTopValue)
        })
    })

    // 释放锁
    isGetChatHistoryFromDown = true

    // 如果聊天记录已经全部获取完毕后，需要上锁，防止再次无效获取
    if (chatData?.length === 0) isGetChatHistoryFromDown = false 
}

async function handlePositionAfterFirstTimeGetChatData() {
    // 这个置空的情况不希望触发滚动事件
    // 因为这样会导致重复执行 getChatFromServer 函数
    chatBox.value = []
    const position:{ [chat_table: string]: Position } = JSON.parse(localStorage.getItem('Position') || '{}')
    const chat_table = activeFriend.value.chat_table
    const chatData:Box[] = []
    if (position[chat_table]) {
        const data = await dbReadRangeByArea(chat_table, position[chat_table].first, position[chat_table].last)
        // 这里虽然有定位信息,但如果获取的聊天记录时最后一个记录的话,需要锁住滚动获取数据,并把位置信息删除
        const lastId = await dbGetLastPrimaryKey(chat_table)
        if (lastId && data.length && lastId === data[data.length - 1].id) {
            console.log('lasid -> ', lastId, data[data.length - 1].id)
            // 向下锁 锁死
            isGetChatHistoryFromDown = false
            // delete position[chat_table]
        }
        chatData.push(...data)
    } else {
        chatData.push(...await dbReadRangeNotOffset(chat_table))
    }
    console.log('获取聊天记录 首次获取 ->', chatData)
    const resChatData = handleChatData(chatData || [])
    chatBox.value.unshift(...resChatData)
    nextTick(() => {
        if (position[chat_table]) {
            // console.log('postion -> ', position, position[chat_table], chatBox.value)
            const dataIndex = chatBox.value.findIndex(item => item.id === position[chat_table]?.use)
            const chatDivList:HTMLLIElement[] = [...scrollBar.value.wrapRef.children[0].children[0].children]
            const div:HTMLElement = chatDivList[dataIndex]
            if (div) {
                // console.log('div -> ', div, position[chat_table].use)
                mediaDelayPosition(() => {
                    div.scrollIntoView()
                    // 用于显示 "回到最新" Tip 按钮
                    store.commit('footSend/setGotoBottomState', true)
                    console.log(' -> ', position[chat_table])
                    const stop = watchEffect(() => {
                        if (showGotoBottom.value === false) {
                            // 回到最新位置实际上需要模拟没有定位信息, 第一次获取数据的状态, 所以需要把定位信息删除并且更新 Position
                            delete position[chat_table]
                            localStorage.setItem('Position', JSON.stringify(position))
                            handlePositionAfterFirstTimeGetChatData()
                            stop()
                        }
                    })
                })
            }
        } else {
            // 随便设置值，后期需要优化
            // chatWindow.value.scrollBar.setScrollTop(100)
            mediaDelayPosition(() => {
                const end_sp = chatWindow.value.scrollBar.wrapRef.children[0].scrollHeight
                chatWindow.value.scrollBar.setScrollTop(end_sp)
            })
        }
    })

    // 释放锁
    isGetChatHistoryFromUp = true

    // 如果聊天记录已经全部获取完毕后，需要上锁，防止再次无效获取
    if (chatData?.length === 0) isGetChatHistoryFromUp = false 
}

// 媒体文件延迟定位处理
function mediaDelayPosition(cb: Function) {
    chatBox.value.forEach((d, i: number) => {
        if (d.type.includes('video') || d.type.includes('image')) {
            imgLoadList.value.push(i)
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
// 保存 scrollOffset 到数据库
// function saveOffsetOb() {
//     if (activeFriend.value.chat_table) {
//         const user_id = sessionStorage.getItem('user_id')
//         // console.log('保存到本地了 ->', boxScrolxltop, offsetOb)
//         if (!offsetOb[activeFriend.value.chat_table]) {
//             offsetOb[activeFriend.value.chat_table] = {
//                 scrollOffset: 0,
//                 dataOffset: 0
//             }
//         }
//         offsetOb[activeFriend.value.chat_table].scrollOffset = boxScrolltop
//         // offsetOb[activeFriend.value.chat_table].dataOffset = offsetOb[activeFriend.value.chat_table].dataOffset || 0
//         localStorage.setItem(user_id + 'offsetOb', JSON.stringify(offsetOb))
//     }
// }
// const scrollOffsetAntiShakeFn = antiShake(saveOffsetOb, 1000)
const scrollOffsetAntiShakeFn = antiShake(saveChatWindowPosition, 1000)
// 滚动条事件处理
// 创建一个防抖实例函数
const scrollAntiShakeFn = antiShake(getChatFromServer)
async function handleScroll(val: { scrollTop: number }) {
    // console.log('handleScroll isGetChatHistoryFromUp -> ', isGetChatHistoryFromUp)
    boxScrolltop = val.scrollTop
    scrollOffsetAntiShakeFn()
    if (Math.floor(val.scrollTop) === 0 && isGetChatHistoryFromUp) {
        console.log('xxxxxxxxxxx')
        scrollAntiShakeFn(IsSwitchFriend.No, DESC.UP)
    }
    const scrollHeight = scrollBar.value.wrapRef.scrollHeight
    const clientHeight = scrollBar.value.wrapRef.clientHeight
    if (val.scrollTop + clientHeight + 5 >= scrollHeight && isGetChatHistoryFromDown) {
        console.log('滚到了底部，需要获取数据了')
        scrollAntiShakeFn(IsSwitchFriend.No, DESC.DOWN)
    }
}

// app 设置弹窗弹出
const appSetting = ref()
function showSettingDialog() {
    appSetting.value.showDialog(true)
}

function handleExit() {
    if (websocket.value) {
        const ws = websocket.value as WebSocket
        ws.close(4001,'客户端关闭链接')
    }
    // websocket?.value?.close(4001,'客户端关闭链接')
    sessionStorage.setItem('user_info', '')
    router.go(-1)
}

// 头像更新
const avatarRefresh:Ref<string> = ref('')
function handleAvatarChange(url: string) {
    avatarRefresh.value = url
}

// 更新好友信息
function handleNickNameChange(fri:any) {
    // console.log('好友信息 -> ', fri)
    userInfo.value = fri
    sessionStorage.setItem('user_info', JSON.stringify(fri))
    userFriends = JSON.parse(fri.friends)
}

// 是否使用markdown
const isUseMd = ref(false)
function handleIsUseMarkdown(val: boolean) {
    isUseMd.value = val
}

// 删除处理
async function handleDeleted (idx: number) {
    const user_id = sessionStorage.getItem('user_id')
    // console.log('删除 -> ', chatBox.value[idx].user_id === user_id)
    const chat = chatBox.value[idx]
    const [err, res] = await to(request({
        method: 'post',
        url: api.deleteChat,
        data: {
            chat,
            del_flag: user_id
        }
    }))
    if (err) {
        console.log('删除失败 -> ', err)
    }
    if (res?.data !== 'err') {
        console.log('删除成功 -> ', res)
        chatBox.value.splice(idx, 1)
        chat.text = '[已删除一条信息]'
        trytoRfChat.value = { chat }
    } else {
        console.log('删除失败 -> ', res.data)
    }
}

// windowChat 撤回回调
async function handleWithdraw (idx: number) {
    const [err, res] = await to(request({
        method: 'post',
        url: api.deleteChat,
        data: {
            chat: {
                ...chatBox.value[idx],
                thumbnail: '', // 缩略图可能很大,撤回并不需要带那么大的东西会后台
            },
        }
    }))
    if (err) {
        console.log('撤回失败 -> ', err)
        return
    }
    
    if (res.data === 'ok') {
        console.log('撤回成功 -> ', res)
        centerDeleted(chatBox.value[idx])
    } else {
        console.log('撤回失败 -> ', res.data)
    }
}

// windowChat 引用回调
const showQuote = ref(false)
const comment = ref('')
async function handleQuote (idx: number) {
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
function handleLoaded(boxindex: any) {
    // console.log('加载完成 -> ', boxindex)
    if (imgLoadList.value.length) {
        const fdidx = imgLoadList.value.findIndex(f => f === boxindex)
        if (fdidx !== -1) {
            imgLoadList.value.splice(fdidx, 1)
        }
    }
    // chatBox.value[index].loaded = true
}

</script>

<style lang="scss" scoped>
.main {
    background-image: url('../assets/login_bg.png');
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-color: #F5F6FA;
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
                background: #E6E8EB;
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
</style>