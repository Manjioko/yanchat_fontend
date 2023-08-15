<script setup>

import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import ws from '@/utils/ws.js'

let textList = ref([])
// websocket 客户端
let websocket = ref({})
// 自己 ID
let id = ''
// 连接信号
let signal = ref(0)

onMounted(() => {
    const [myId, otherId] = sessionStorage.getItem('id').split('//')
    // 如果获取不到 id 必须返回登录页
    if (!myId || !otherId) {
        useRouter().push({name: 'Login'})
    }
    id = myId
    const url = `${process.env.VUE_APP_WS}?id=${myId}&to=${otherId}`
    ws(websocket, url, appendMessage, signal)
})

onBeforeUnmount(() => {
    // 卸载 websocket
    websocket?.value?.close()
})

const chatText = ref('')

function appendMessage(message, type) {
    if (type === 'sent') {
        console.log('发送一些信息：', message)
        textList.value.push({
            text: message,
            user: 1
        })
    }
    if (type === 'received') {
        // messageContainer.classList.add('received-message');
        console.log('收到一些信息：', message)
        const text = message.replace(/(.+)?-(\d+)?:(.+)/, (m, v, v2, v3) => {
            if (v === id) {
                return JSON.stringify({text: v3, user:1})
            } else if (v) {
                return JSON.stringify({text: v3, user:0})
            } else {
                return JSON.stringify({text: m, user:0})
            }
        })
        try {
            textList.value.push(JSON.parse(text))
        } catch {
            textList.value.push({ text: message, user: 0 })
        }
    }
}

function sendMessage() {
    if (signal.value !== 1) return
    const message = chatText.value;
    // console.log('websocket ', websocket.value)
    if (websocket && message) {
        // websocket 再客户端成功连接后,会保存一个实例
        // 可以通过该实例收发信息
        websocket.value.send(message);
        appendMessage(message, 'sent');
        chatText.value = ''
    }
}
function hdkeydown() {
    if (signal.value !== 1) return
    sendMessage()
}

// 接收到信息时信息栏滚动到底部
const chatWindow = ref(null)
watch(textList.value, () => {
    if (chatWindow.value) {
        nextTick(() => {
            chatWindow.value.scrollTop = chatWindow.value.scrollHeight
        })
    }
})

// 文件上传
function uploadFile(e) {
    // console.log('eeee ', e.target.files[0])
    const formData = new FormData()
    console.log(e.target.files[0])
    formData.append("file", e.target.files[0])
    const xhr = new XMLHttpRequest()

    // 监听上传进度事件
    xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        console.log(`文件上传进度: ${percentComplete.toFixed(2)}%`);
        }
    });

    // 监听上传完成事件
    xhr.addEventListener('load', () => {
        console.log('上传文件完成。');
    });

    // 监听上传错误事件
    xhr.addEventListener('error', () => {
        console.error('上传失败。');
    });


    xhr.open('post', process.env.VUE_APP_FILE)
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 400) {
            console.log(xhr)
        }
    }
    xhr.send(formData)
}
</script>
<template>
    <main class="main">
        <section class="chat-window">
            <section class="text-top">
                <div class="avatar">
                    <div :class="{isOnlink: signal === 1, isUnlink: signal !== 1}"></div>
                    <img src="../assets/avatar1.png" alt="avatar">
                    <span>Manjioko🐶</span>
                    <span v-if="signal === 0" class="reconnect">{{ '正在重连中...' }}</span>
                    <span v-if="signal === 2" class="disconnect">{{ '已经断线,请检测网络环境是否可用' }}</span>
                </div>
                <img src="../assets/setting.png" alt="setting">
            </section>
            <section class="text-show" id="container" ref="chatWindow">
                <div v-for="(textObject, idx) in textList" :key="idx">
                    <div class="showTime" v-if="textObject.time">{{ textObject.time }}</div>
                    <div class="chat-box-remote" v-if="!textObject.user">
                        <img src="../assets/avatar1.png" alt="其他">
                        <div class="chat-box-remote-message">
                            <span class="chat-box-remote-message-text">
                                {{ textObject.text }}
                            </span>
                        </div>
                    </div>
                    <div class="chat-box-local" v-else>
                        <span class="chat-box-local-message">
                            {{ textObject.text }}
                        </span>
                        <img src="../assets/avatar2.png" alt="其他">
                    </div>
                </div>
            </section>
            <section class="text-send">
                <input type="text" v-model="chatText" @keyup.enter="hdkeydown" placeholder="在这里输入你的消息...">
                <div class="upload">
                    <img src="../assets/uploadIcon.png" alt="upload">
                    <input type="file" @change="uploadFile">
                </div>
                <button @click="sendMessage" class="send-btn">
                    <span>发送</span>
                    <img src="../assets/send.png" alt="send">
                </button>
            </section>
        </section>
    </main>
</template>
<style lang="scss" scoped>
.main {
    background-color: #F5F6FA;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

.chat-window {
    width: 70vw;
    height: 85vh;
    min-width: 600px;
    max-width: 1000px;
    max-height: 875px;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    border-radius: 5px;
    box-shadow: 0px 1px 6px 6px rgba(221, 223, 230, 0.31);
}

.text-show {
    flex: 1;
    overflow: auto;
    position: relative;
}

.text-send {
    height: 100px;
    display: flex;
    box-sizing: border-box;
    padding: 25px 20px 25px 20px;
    border-top: 2px solid #F5F6FA;
    align-items: center;

    input {
        flex: 1;
        border: none;
        outline: none;
        font-size: 18px;
        font-family: Source Han Sans CN;
    }

    button {
        width: 140px;
        background: #2F88FF;
        outline: none;
        display: flex;
        justify-content: center;
        align-items: center;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-family: Source Han Sans CN;
        user-select: none;

        span {
            font-size: 18px;
            color: #FFFFFF;
        }

        img {
            width: 18px;
            height: 18px;
            margin-left: 12px;
        }
    }
}

.text-top {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    padding: 19px;
    box-shadow: 0px 3px 6px 0px rgba(221, 223, 230, 0.31);
    font-family: Source Han Sans CN;
    user-select: none;

    img {
        width: 22px;
        height: 22px;
        -webkit-user-drag: none;
        cursor: pointer;
    }

    .avatar {
        flex: 1;
        display: flex;
        align-items: center;
        position: relative;

        img {
            width: 54px;
            height: 54px;
            -webkit-user-drag: none;
        }

        span {
            margin-left: 19px;
            font-size: 30px;
            color: #333333;
            user-select: text;
        }
    }
}

.chat-box-remote {
    display: flex;
    align-items: center;
    margin: 15px 0;

    img {
        width: 54px;
        height: 54px;
        padding: 10px 20px;
    }

    .chat-box-remote-message {
        display: block;
        box-sizing: border-box;
        padding: 20px;
        font-size: 18px;
        background: #F8F8F8;
        // opacity: 0.5;
        border-radius: 10px 10px 10px 0px;
        max-width: 500px;
    }
}

.chat-box-local {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin: 15px 0;

    img {
        width: 54px;
        height: 54px;
        padding: 10px 20px;
    }

    .chat-box-local-message {
        display: block;
        box-sizing: border-box;
        padding: 20px;
        font-size: 18px;
        background: #EBF3FE;
        // opacity: 0.5;
        border-radius: 10px 10px 0px 10px;
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
    width: 15px;
    height: 15px;
    background: #00daff;
    border-radius: 50%;
    position: absolute;
    top: 0;
    left: 50px;
}
.isUnlink {
    width: 15px;
    height: 15px;
    background: red;
    border-radius: 50%;
    position: absolute;
    top: 0;
    left: 50px; 
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
    width: 27px;
    height: 25px;
    position: relative;
    margin-right: 20px;
    margin-left: 10px;
    img {
        width: inherit;
        height: inherit;
    }
    input {
        position: absolute;
        width: 27px;
        height: 25px;
        top: 0;
        left: 0;
        opacity: 0;
    }
}
.send-btn {
    height: 100%;
}

// /* 隐藏原生滚动条 */
// ::-webkit-scrollbar {
//   width: 8px;
//   height: 8px;
// }

// /* 滚动条轨道 */
// ::-webkit-scrollbar-track {
//   background: #f1f1f1;
// }

// /* 滚动条滑块 */
// ::-webkit-scrollbar-thumb {
//   background: #888;
// }

// /* 滚动条滑块悬停样式 */
// ::-webkit-scrollbar-thumb:hover {
//   background: #555;
// }
</style>