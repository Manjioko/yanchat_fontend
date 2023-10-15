<template>
    <main class="main">
        <friendsList
            :friends="userInfo?.friends ?? '[]'"
            :newChatData="newChatData || {}"
            :signal="signal"
            :avatarRefresh="avatarRefresh || ''"
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
                    <div style="width: 40px; height: 40px;"></div>
                </div>
                <img src="../assets/setting.png" alt="setting" @click="showSettingDialog">
            </section>
            <ChatWindow
                v-if="activeFriend"
                ref="chatWindow"
                :chatBox="chatBox"
                :avatarRefresh="avatarRefresh || ''"
                :markdown="isUseMd"
                @scroll="handleScroll"
                @deleted="handleDeleted"
                @withdraw="handleWithdraw"
            />
            <section class="zero-friend" v-else>
                还未选择聊天好友
            </section>
            <section>
                <SendFoot :upload-disable="!!activeFriend" @center="Center" />
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
</template>

<script setup>

import { ref, onMounted, onBeforeUnmount, nextTick, watchEffect } from 'vue'
import ChatWindow from '@/components/chatWindow.vue'
import ws from '@/utils/ws.js'
import friendsList from '@/components/friendsList.vue'
import antiShake from '@/utils/antiShake.js'
import AppSetting from '@/components/appSetting.vue'
import SendFoot from '@/components/sendFoot.vue'
import router from '@/router/router'
import to from 'await-to-js'

let chatBox = ref([])
// websocket 客户端
let websocket = ref({})
const userInfo = ref({
    friends: ''
})
// 连接信号
let signal = ref(0)

// 用户信息
userInfo.value = JSON.parse(sessionStorage.getItem('user_info'))
// 好友信息
let userFriends = JSON.parse(userInfo.value.friends)

// const route = useRoute()
onMounted(async () => {
    // console.log('route -> ', userInfo.value.chat_table)
    const user_id = sessionStorage.getItem('user_id')
    // console.log('user id -> ', user_id)
    const url = `${process.env.VUE_APP_WS}?user_id=${user_id}`
    ws(websocket, url, Center, signal)
})

onBeforeUnmount(() => {
    // 卸载 websocket
    websocket?.value?.close()
})

let newChatData = ref({})
function Center(chatData, type) {
    if (signal.value !== 1) return

    // 发送消息
    if (type === 'sent') {
        console.log('发送信息 -> ', chatData)
        if (!websocket.value || !activeFriend.value) return
        // 以下的三个参数必传
        // 第一个 to_table 代表 聊天记录数据库名称
        // 第二个 to_id 代表 聊天对象的 id
        // 第三个 user_id 代表 自己的 id
        Object.assign(chatData, {
            to_table: activeFriend.value.to_table,
            to_id: activeFriend.value.id,
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
                if (chatData.progress >= 100 && chatData.response) {
                    websocket.value.send(JSON.stringify(chatData))
                    stop()
                }
            })
        } else {
            websocket.value.send(JSON.stringify(chatData))
        }
        
        // 产生新的数据时需要更新数据到朋友列表
        newChatData.value = {
            // unread 为 1时标记为未读，0 时标记为已读需要展示
            unread: 0,
            chat: chatData
        }
    }

    // 接收信息
    if (type === 'received') {
        console.log('收到信息 -> ', chatData)
        try {
            const chat = JSON.parse(chatData)
            // console.log('id 比较 -> ', chat.user_id, userInfo.value.user_id)
            if (chat.user_id === userInfo.value.user_id) {
                chat.user = 1
            } else {
                chat.user = 0
            }
            console.log('activeFriend.value -> ', activeFriend.value)
            if (chat.user_id === activeFriend?.value?.id) {
                console.log('发到自己的信息 -> ', chat.type)
                // 发给自己的信息主要分两种 <1> 是展示用的信息 <2> 是撤回信息
                // 先处理撤回信息
                if (chat.type === 'withdraw') {
                    console.log('撤回消息 -> ', chat)
                    handleCenterWithdraw(chat)
                } else {
                    chatBox.value.push(chat)
                    newChatData.value = {
                        unread: 0,
                        chat,
                    }
                }
            } else {
                console.log('发到别处的信息 -> ', chat)
                // 撤回信息不推送到好友栏
                // bug 撤回如果是最后的一条推送数据的话,需要做处理的(这里功能还未开发)
                if (chat.type !== 'withdraw') {
                    newChatData.value = {
                        unread: 1,
                        chat,
                    }   
                } else {
                    console.log('user -> ', chat, chat.chat.to_table)
                    console.log('chatDataOb', sessionStorage.getItem('chatDataOb'))
                    newChatData.value = {
                        unread: 1,
                        chat,
                        withdrawOb: chat.chat
                    }
                }

            }
            // 推送消息到桌面
            notifyToWindow(chat)
        } catch (err) {
            console.log('接收错误 -> ', err)
        }
    }

    if (activeFriend.value && chatWindow?.value?.scrollBar) {
        nextTick(() => {
            const end_sp = chatWindow.value.scrollBar.wrapRef.children[0].scrollHeight
            chatWindow.value.scrollBar.setScrollTop(end_sp)
            console.log('end_sp -> ', end_sp, chatWindow.value)
        })
    }
}

// 撤回处理
function handleCenterWithdraw(chat) {
    const chatData = chat.chat
    const idx = chatBox.value.findIndex(item => item.time === chatData.time && item.text === chatData.text)
    console.log('撤回 idx -> ', idx, chatBox.value.length - 1)
    const lastIdx = chatBox.value.length - 1
    if (Number(idx) === lastIdx) {
        let i = lastIdx - 1
        while(i >  0 && chatBox.value[i].withdraw) {
            i--
        }
        newChatData.value = {
            unread: 0,
            chat:i > 0 ? chatBox.value[i] : { ...chatBox.value[0], text: '' },
        }
    }
    if (idx !== -1) {
        chatBox.value.splice(idx, 1)
    }
}

// 推送到 window 桌面
function notifyToWindow(textOb) {
    // console.log('text ', textOb,document.hidden)
    if (!textOb || !textOb.text) return
    // 在当前页面时，不弹出通知栏
    if (!document.hidden) return

    if (Notification.permission === 'granted') {
        // console.log('新消息 -> ', userFriends)
        const fr = userFriends?.find(f => f.user_id === textOb.user_id)
        // console.log('fr', fr)
        const notification = new Notification(fr?.user || '新消息', {
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
const activeFriend = ref(null)
function handleActiveFriend(f) {
    activeFriend.value = f
    // console.log('切换 -》 ')
    isGetChatHistory = true
    getChatFromServer(true)
}

function handleChatData(data) {
    return data.filter(i => !i.chat.type)?.map(i => {
        const chatOb = JSON.parse(i.chat)
        if (userInfo.value.user_id === chatOb.user_id) {
            chatOb.user = 1
        } else {
            chatOb.user = 0
        }

        return {
            // ...i,
            ...chatOb
        }
    }) ?? []
}


// 接收到信息时信息栏滚动到底部
const chatWindow = ref()

// 查询锁
let isGetChatHistory = true

// 从服务器获取聊天记录
async function getChatFromServer(isSwitchFriend) {
    // console.log('get -> ', isSwitchFriend, isGetChatHistory)
    if (!isGetChatHistory) return

    // 从服务器拉取聊天记录
    // 决定拉数据前，上锁，防止重复操作
    isGetChatHistory = false

    // 上锁后再判断是否是切换好友，这样做的好处是
    // 可以利用锁的开关去判断该时间段是否是可以触发
    // 滚动事件的时机
    if (isSwitchFriend) {
        // 这个置空的情况不希望触发滚动事件
        // 因为这样会导致重复执行 getChatFromServer 函数
        chatBox.value = []
    }

    let chatBoxLen = chatBox.value.length

    const [err, res] = await to(window.$axios({
        method: 'post',
        url: process.env.VUE_APP_CHATDATA,
        data: {
            chat_table: activeFriend.value.to_table,
            offset: chatBoxLen
        }
    }))

    if (err) {
        console.log('获取聊天记录错误：', err)
        return
    }

    if (res.status !== 200) return


    if (Array.isArray(res.data)) {
        const start_sp = chatWindow.value.scrollBar.wrapRef.children[0].scrollHeight
        const chatData = handleChatData(res.data)
        chatBox.value = [...chatData, ...chatBox.value]
        nextTick(() => {
            const end_sp = chatWindow.value.scrollBar.wrapRef.children[0].scrollHeight
            chatWindow.value.scrollBar.setScrollTop(end_sp - start_sp)
        })
    }

    // 释放锁
    isGetChatHistory = true

    // 如果聊天记录已经全部获取完毕后，需要上锁，防止再次无效获取
    if (res.data.length === 0) isGetChatHistory = false

    console.log('查询聊天记录回来了 -> ', res.data.length)
}

// 滚动条事件处理
// 创建一个防抖实例函数
const scrollAntiShakeFn = antiShake(getChatFromServer)
async function handleScroll(val) {
    if (Math.floor(val.scrollTop) === 0 && isGetChatHistory) {
        scrollAntiShakeFn()
    }
}

// app 设置弹窗弹出
const appSetting = ref()
function showSettingDialog() {
    appSetting.value.showDialog(true)
}

function handleExit() {
    websocket.value.close(4001,'客户端关闭链接')
    sessionStorage.clear('user_info')
    router.go(-1)
}

// 头像更新
const avatarRefresh = ref('')
function handleAvatarChange(url) {
    avatarRefresh.value = url
}

// 更新好友信息
function handleNickNameChange(fri) {
    console.log('好友信息 -> ', fri)
    userInfo.value = fri
    sessionStorage.setItem('user_info', JSON.stringify(fri))
    userFriends = JSON.parse(fri.friends)
}

// 是否使用markdown
const isUseMd = ref(false)
function handleIsUseMarkdown(val) {
    isUseMd.value = val
}

// 删除处理
async function handleDeleted (idx) {
    chatBox.value[idx].deleted = true
    const lastIdx = chatBox.value.length - 1
    if (Number(idx) === lastIdx) {
        let i = lastIdx - 1
        while(i >  0 && chatBox.value[i].withdraw) {
            i--
        }
        newChatData.value = {
            unread: 0,
            chat:i > 0 ? chatBox.value[i] : { ...chatBox.value[0], text: '' },
        }
    }
    const [err, res] = await to(window.$axios({
        method: 'post',
        url: `${process.env.VUE_APP_BASE_URL}/deleteMessage`,
        data: {
            chat: chatBox.value[idx],
            type: 'deleted'
        }
    }))
    if (err) {
        console.log('删除失败 -> ', err)
    }
    if (res) {
        console.log('删除成功 -> ', res)
    }
    // console.log('删除 -> ', chatBox.value)
}
// 撤回处理
async function handleWithdraw (idx) {
    chatBox.value[idx].withdraw = true
    const lastIdx = chatBox.value.length - 1
    if (Number(idx) === lastIdx) {
        let i = lastIdx - 1
        while(i >  0 && chatBox.value[i].withdraw) {
            i--
        }
        newChatData.value = {
            unread: 0,
            chat: i > 0 ? chatBox.value[i] : { ...chatBox.value[0], text: '' },
        }
    }
    const [err, res] = await to(window.$axios({
        method: 'post',
        url: `${process.env.VUE_APP_BASE_URL}/deleteMessage`,
        data: {
            chat: chatBox.value[idx],
            type: 'withdraw'
        }
    }))
    if (err) {
        console.log('撤回失败 -> ', err)
    }
    if (res) {
        console.log('撤回成功 -> ', res)
    }
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