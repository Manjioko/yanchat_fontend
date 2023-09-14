<template>
    <div class="text-send">
        <el-input v-model="chatText" :autosize="{ minRows: 1, maxRows: 5 }" type="textarea"
            placeholder="在这里输入你的消息..." @keyup.shift.enter.exact="hdkeydown" />
        <div class="upload">
            <img src="../assets/uploadIcon.png" alt="upload">
            <input type="file" @change="uploadFile">
        </div>
        <button @click="sendMessage()" class="send-btn">
            <span>发送</span>
            <img src="../assets/send.png" alt="send">
        </button>
    </div>
</template>
<script setup>
import {ref, defineProps, defineEmits} from 'vue'
import { timeFormat } from '@/utils/timeFormat.js'
import byteCovert from '@/utils/byteCovert.js'

const props = defineProps({
    chatBox: Object,
    // activeFriend: Object,
    // userInfo: Object
})
const emit = defineEmits(['center', 'progress', 'response'])

const chatText = ref('')

// 键盘 摁下 enter 键触发事件
function hdkeydown() {
    // if (signal.value !== 1 || !activeFriend.value) return
    sendMessage()
}

// 发送文本到聊天框的处理器
function sendMessage(chatData) {
    if (chatData) {
        // Center(chatData, 'sent')
        emit('center', chatData, 'sent')
        return
    }

    const message = chatText.value

    if (!message) return

    // websocket.value?.send(JSON.stringify(sendData))
    const dataOb = {
        type: 'text',
        text: message,
        user: 1,
        time: timeFormat(),
    }
    // Center(dataOb, 'sent')
    emit('center', dataOb, 'sent')

    // 清空聊天框
    chatText.value = ''

    // nextTick(() => {
    //     // 文字窗口滚动到底部
    //     scrollBar.value.setScrollTop(chatWindow.value.dom.scrollHeight)
    // })
}

// 文件上传
// let fileData = ref('')
function uploadFile(e) {
    const formData = new FormData()
    formData.append("file", e.target.files[0])
    const xhr = new XMLHttpRequest()
    // 文件信息所在下标
    // const index = props.chatBox.length

    const box = {
        progress: 0,
        type: e.target.files[0]?.type,
        fileName: e.target.files[0]?.name,
        // text 文本描述主要用于好友栏的提示
        text: `[文件]${e.target.files[0]?.name ?? ''}`,
        size: byteCovert(e.target.files[0]?.size),
        time: timeFormat(),
        response: '',
        user: 1,
    }
    // 发送信息到文本框
    sendMessage(box)

    // 监听上传进度事件
    xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            console.log(`文件上传进度: ${percentComplete.toFixed(2)}%`);
            // props.chatBox.value[index].progress = percentComplete
            // emit('progress',index, percentComplete)
            box.progress = percentComplete
        }
    });

    // 监听上传完成事件
    xhr.addEventListener('load', (res) => {
        console.log('上传文件完成。', res.target.response)
        // props.chatBox.value[index].response = res.target.response
        // fileData.value = chatBox.value[index]
        // emit('response', index, res.target.response)
        // sendMessage()
        box.response = res.target.response
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
</script>
<style lang="scss" scoped>
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
        box-sizing: border-box;
        padding: 6px;

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
</style>