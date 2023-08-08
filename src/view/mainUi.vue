<script setup>

import { ref, onMounted } from 'vue'

const textList = ref([])
let id = ''
onMounted(() => {
    const [myId, otherId] = sessionStorage.getItem('id').split('//')
    // console.log('get id is : ', myId, otherId, localStorage.getItem('id').split('//'))
    id = myId
    connectWebSocket(myId, otherId)
})

let websocket
const chatText = ref('')

function appendMessage(message, type) {
    if (type === 'sent') {
        console.log('发送一些信息：', message)
        textList.value.push({
            text: message,
            user: 1
        })
    } else if (type === 'received') {
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

function connectWebSocket(myId, otherId) {
    // 请将ws://your-websocket-server-address 替换为您的WebSocket服务端地址
    websocket = new WebSocket(`ws://127.0.0.1:8000/?id=${myId}&to=${otherId}`);

    websocket.onopen = function () {
        appendMessage('已连接到WebSocket服务端', 'received');
    };

    websocket.onmessage = function (event) {
        appendMessage(event.data, 'received');
    };

    websocket.onclose = function () {
        appendMessage('与WebSocket服务端的连接已关闭', 'received');
    };

    websocket.onerror = function () {
        appendMessage('WebSocket错误发生', 'received');
    };
}

function sendMessage() {
    const message = chatText.value;
    if (websocket && message) {
        websocket.send(message);
        appendMessage(message, 'sent');
        chatText.value = ''
    }
}
function hdkeydown() {
    sendMessage()
}

</script>
<template>
    <main class="main">
        <section class="chat-window">
            <section class="text-top">
                <div class="avatar">
                    <img src="../assets/avatar1.png" alt="avatar">
                    <span>Manjioko🐶</span>
                </div>
                <img src="../assets/setting.png" alt="setting">
            </section>
            <section class="text-show" id="container">
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
                <button @click="sendMessage">
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