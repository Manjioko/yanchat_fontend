<script setup>

import { ref } from 'vue'

const textList = ref([
    {
        user: 0,
        text: '我们今天中午去吃火锅吧?🤣🤣🤣',
    },
    {
        user: 1,
        text: '好啊好啊你请客?',
    },
    {
        user: 1,
        text: '🉑🉑❤️',
    }
])

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
            <section class="text-show">
                <div v-for="(textObject, idx) in textList" :key="idx">
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
                <input type="text" placeholder="在这里输入你的消息...">
                <button>
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
    box-shadow: 0px 3px 6px 0px rgba(221,223,230,0.31);
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
</style>