<template>
    <main class="main">
        <friendsList :friends="userInfo?.friends ?? '[]'" :newChatData="newChatData || {}"
            @handleActiveFriend="handleActiveFriend" />
        <section class="chat-window">
            <section class="text-top">
                <div class="avatar" v-if="activeFriend">
                    <div :class="{ isOnlink: signal === 1, isUnlink: signal !== 1 }"></div>
                    <img :src="activeFriend.avatar || require('../assets/default_avatar.png')" alt="avatar">
                    <span>{{ activeFriend.name }}</span>
                    <span v-if="signal === 0" class="reconnect">{{ '正在重连中...' }}</span>
                    <span v-if="signal === 2" class="disconnect">{{ '已经断线,请检测网络环境是否可用' }}</span>
                </div>
                <div class="default-avatar" v-else>
                    <div style="width: 40px; height: 40px;"></div>
                </div>
                <img src="../assets/setting.png" alt="setting" @click="showSettingDialog">
            </section>
            <section class="text-show" v-if="activeFriend">
                <el-scrollbar ref="scrollBar" :size="10" @scroll="handleScroll">
                    <ChatWindow ref="chatWindow" :chatBox="chatBox" />
                </el-scrollbar>
            </section>
            <section class="zero-friend" v-else>
                还未选择聊天好友
            </section>
            <section class="text-send">
                <el-input v-model="chatText" :autosize="{ minRows: 1, maxRows: 5 }" type="textarea"
                    placeholder="在这里输入你的消息..." @keyup.shift.enter.exact="hdkeydown" />
                <div class="upload">
                    <img src="../assets/uploadIcon.png" alt="upload">
                    <input type="file" @change="uploadFile" v-if="activeFriend" >
                </div>
                <button @click="sendMessage" class="send-btn">
                    <span>发送</span>
                    <img src="../assets/send.png" alt="send">
                </button>
            </section>
        </section>
    </main>
    <AppSetting ref="appSetting" :websocket="websocket" />
</template>

<script setup>

import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import ChatWindow from '@/components/chatWindow.vue'
import ws from '@/utils/ws.js'
import friendsList from '@/components/friendsList.vue'
import antiShake from '@/utils/antiShake.js'
import { timeFormat } from '@/utils/timeFormat.js'
import byteCovert from '@/utils/byteCovert.js'
import AppSetting from '@/components/appSetting.vue'

let chatBox = ref([])
// let ChatData = ref({}) 
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
const userFriends = JSON.parse(userInfo.value.friends)

// const route = useRoute()
onMounted(async () => {
    // console.log('route -> ', userInfo.value.chat_table)
    const user_id = sessionStorage.getItem('user_id')
    console.log('user id -> ', user_id)
    const url = `${process.env.VUE_APP_WS}?user_id=${user_id}`
    ws(websocket, url, Center, signal)
})

onBeforeUnmount(() => {
    // 卸载 websocket
    websocket?.value?.close()
})

const chatText = ref('')
let newChatData = ref({})
function Center(chatData, type) {
    if (type === 'sent') {
        console.log('发送信息 -> ', chatData)
        chatBox.value.push(chatData)
        // 产生新的数据时需要更新数据到朋友列表
        newChatData.value = {
            // unread 为 1时标记为未读，0 时标记为已读需要展示
            unread: 0,
            chat: chatData
        }
    }
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
            // console.log('activeFriend.value -> ', activeFriend.value)
            if (chat.user_id === activeFriend?.value?.id) {
                chatBox.value.push(chat)
                newChatData.value = {
                    unread: 0,
                    chat,
                }
            } else {
                console.log('发到别处的信息 -> ', chat)
                newChatData.value = {
                    unread: 1,
                    chat,
                }
            }
            // 推送消息到桌面
            notifyToWindow(chat)
        } catch (err) {
            console.log('接收错误 -> ', err)
        }
    }
}

function sendMessage() {
    if (signal.value !== 1) return

    // console.log('websocket ', websocket.value)
    if (websocket && activeFriend.value) {
        // 可以通过该实例收发信息
        if (fileData.value) {
            websocket.value?.send(JSON.stringify(fileData.value))
            fileData.value = null
            nextTick(() => {
                // 文字窗口滚动到底部
                scrollBar.value.setScrollTop(chatWindow.value.dom.scrollHeight)
            })
            return
        }
        const message = chatText.value
        // console.log(chatText.value)
        if (!message) return
        // console.log(activeFriend.value)
        const sendData = {
            type: 'text',
            text: message,
            user: 1,
            time: timeFormat(),
            // 以下的三个参数必传
            // 第一个 to_table 代表 聊天记录数据库名称
            // 第二个 to_id 代表 聊天对象的 id
            // 第三个 user_id 代表 自己的 id
            to_table: activeFriend.value.to_table,
            to_id: activeFriend.value.id,
            user_id: userInfo.value.user_id
        }
        websocket.value?.send(JSON.stringify(sendData))
        Center(sendData, 'sent')
        chatText.value = ''

        nextTick(() => {
            // 文字窗口滚动到底部
            scrollBar.value.setScrollTop(chatWindow.value.dom.scrollHeight)
        })
    }
}
// 键盘 摁下 enter 键触发事件
function hdkeydown() {
    if (signal.value !== 1 || !activeFriend.value) return
    sendMessage()
}
onMounted(() => {
    // notifyToWindow() 
    if ('Notification' in window) {
        // 浏览器支持 Web Notifications API
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(function (permission) {
                if (permission === 'granted') {
                    // 用户已授权
                    console.log('用户已授权')
                } else {
                    // 用户拒绝了权限请求
                    console.log('用户拒绝了权限请求')
                }
            })
        }
    } else {
        console.log('浏览器不支持 Web Notifications API');
    }
    // notifyToWindow()
})
function notifyToWindow(textOb) {
    if (!textOb || !textOb.text) return
    // 在当前页面时，不弹出通知栏
    if (!document.hidden) return

    if (Notification.permission === 'granted') {
        // console.log('新消息 -> ', userFriends)
        const fr = userFriends?.find(f => f.user_id === textOb.user_id)
        const notification = new Notification(fr?.user || '新消息', {
            body: textOb.text || '',
            // 可选的通知图标
            icon: require('../assets/avatar1.png'),
        });

        notification.onclick = function () {
            // 点击通知时的操作
        };
    }

} 

let fileData = ref('')
// 文件上传
function uploadFile(e) {
    const formData = new FormData()
    // console.log(e.target.files[0])
    formData.append("file", e.target.files[0])
    const xhr = new XMLHttpRequest()
    // 文件信息所在下标
    const index = chatBox.value.length
    const sendData = {
        progress: 0,
        type: e.target.files[0]?.type,
        fileName: e.target.files[0]?.name,
        // text 文本描述主要用于好友栏的提示
        text: `[文件]${e.target.files[0]?.name ?? ''}`,
        size: byteCovert(e.target.files[0]?.size),
        time: timeFormat(),
        response: '',
        user: 1,
        // 以下的三个参数必传
        // 第一个 to_table 代表 聊天记录数据库名称
        // 第二个 to_id 代表 聊天对象的 id
        // 第三个 user_id 代表 自己的 id
        to_table: activeFriend.value.to_table,
        to_id: activeFriend.value.id,
        user_id: userInfo.value.user_id
    }
    Center(sendData, 'sent')
    // 监听上传进度事件
    xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            console.log(`文件上传进度: ${percentComplete.toFixed(2)}%`);
            chatBox.value[index].progress = percentComplete
        }
    });

    // 监听上传完成事件
    xhr.addEventListener('load', (res) => {
        console.log('上传文件完成。', res.target.response)
        chatBox.value[index].response = res.target.response
        // fileData.value = 'chat-file://' + JSON.stringify(chatBox.value[index])
        fileData.value = chatBox.value[index]
        sendMessage()
    })

    // 监听上传错误事件
    xhr.addEventListener('error', () => {
        console.error('上传失败。');
    })


    xhr.open('post', process.env.VUE_APP_FILE)
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 400) {
            console.log('暗号正确,开始上传...')
        }
    }
    xhr.send(formData)
}

// 选择好友
const activeFriend = ref(null)
function handleActiveFriend(f) {
    activeFriend.value = f
    console.log('切换 -》 ')
    isGetChatHistory = true
    getChatFromServer(true)
}

function handleChatData(data) {
    return data.filter(i => !i.chat.type)?.map(i => {
        const chatOb = JSON.parse(i.chat)
        // console.log(' -> ', userInfo.value.user_id, i.user_id)
        if (userInfo.value.user_id === chatOb.user_id) {
            chatOb.user = 1
        } else {
            chatOb.user = 0
        }

        return {
            ...i,
            ...chatOb
        }
    }) ?? []
}


// 接收到信息时信息栏滚动到底部
const scrollBar = ref()

const chatWindow = ref()

// 查询锁
let isGetChatHistory = true

// 从服务器获取聊天记录
async function getChatFromServer(isSwitchFriend) {
    console.log('get -> ', isSwitchFriend, isGetChatHistory)
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

    const res = await window.$axios({
        method: 'post',
        url: process.env.VUE_APP_CHATDATA,
        data: {
            chat_table: activeFriend.value.to_table,
            offset: chatBoxLen
        }
    })

    if (res.status !== 200) return


    if (Array.isArray(res.data)) {
        const start_sp = chatWindow.value.dom.scrollHeight
        const chatData = handleChatData(res.data)
        chatBox.value = [...chatData, ...chatBox.value]
        nextTick(() => {
            const end_sp = chatWindow.value.dom.scrollHeight
            scrollBar.value.setScrollTop(end_sp - start_sp)
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
    max-width: 1000px;
    max-height: 875px;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    border-radius: 0 5px 5px 0;
    // border-radius: 5px;
    // box-shadow: 0px 1px 6px 6px rgba(221, 223, 230, 0.31);
}

.text-show {
    flex: 1;
    overflow: hidden;
    position: relative;
}

.text-send {
    min-height: 70px;
    display: flex;
    box-sizing: border-box;
    padding: 10px;
    border-top: 2px solid #F5F6FA;
    align-items: center;
    justify-content: center;

    input {
        flex: 1;
        border: none;
        outline: none;
        font-size: 12px;
        font-weight: 300;
        font-family: Source Han Sans CN;
    }

    button {
        width: 70px;
        max-height: 36px;
        background: #2F88FF;
        outline: none;
        display: flex;
        justify-content: center;
        align-items: center;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-family: Source Han Sans CN;
        -webkit-user-select: none;
        -moz-user-select: none;
        user-select: none;
        height: 65%;

        span {
            font-size: 12px;
            color: #FFFFFF;
        }

        img {
            width: 10px;
            height: 10px;
            margin-left: 12px;
        }
    }
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

.isOnlink {
    width: 10px;
    height: 10px;
    background: #00daff;
    border-radius: 50%;
    position: absolute;
    top: 0;
    left: 38px;
}

.isUnlink {
    width: 10px;
    height: 10px;
    background: red;
    border-radius: 50%;
    position: absolute;
    top: 0;
    left: 38px;
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

.upload {
    width: 18px;
    height: 15px;
    position: relative;
    margin-right: 20px;
    margin-left: 10px;

    img {
        width: inherit;
        height: inherit;
        -webkit-user-drag: none;
    }

    input {
        position: absolute;
        width: 20px;
        height: 17px;
        top: 0;
        left: 0;
        opacity: 0;
    }
}

.send-btn {
    height: 100%;
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