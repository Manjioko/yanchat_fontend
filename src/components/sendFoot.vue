<template>
    <main>
        <section class="select-tab">
            <div class="upload">
                <img src="../assets/folder.png" alt="upload">
                <input type="file" @change="uploadFile" v-if="uploadDisable">
            </div>
            <div class="video-call">
                <img src="../assets/videoCall.png" alt="video-call" @click="videoCall">
            </div>
            <div class="call">
                <img src="../assets/call.png" alt="call">
            </div>
        </section>
        <div class="text-send">
            <!-- @keyup.shift.enter.exact="hdkeydown" -->
            <el-input
                v-model="chatText"
                :autosize="{ minRows: 1, maxRows: 5 }"
                type="textarea"
                placeholder="在这里输入你的消息..."
                @keydown.shift.enter.prevent="hdkeydown"
            />
            
            <button @click="sendMessage()" class="send-btn">
                <span>发送</span>
                <img src="../assets/send.png" alt="send">
            </button>
        </div>
    </main>
    <videoCallOfferer v-if="showOfferer"/>
</template>
<script setup>
import {ref, defineProps, defineEmits, reactive} from 'vue'
import { timeFormat } from '@/utils/timeFormat.js'
import byteCovert from '@/utils/byteCovert.js'
import { api } from '@/utils/api'
// import router from '@/router/router'
import { upload } from '@/utils/download'
import { v4 as uuidv4 } from 'uuid'
import videoCallOfferer from './videoCallOfferer.vue'
// import videoCallAnwserer from './videoCallAnwserer.vue'

const props = defineProps({
    chatBox: Object,
    uploadDisable: Boolean,
    quote: {
        type: String,
        default: ''
    }
})
const emit = defineEmits(['center', 'progress', 'response', 'videoCallStart'])

const chatText = ref('')

// 键盘 摁下 enter 键触发事件
function hdkeydown() {
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
    const uuid = uuidv4()
    const dataOb = reactive({
        type: 'text',
        text: message,
        user: 1,
        time: timeFormat(),
        chat_id: uuid
    })
    if (props.quote) {
        dataOb.quote = props.quote
    }
    // Center(dataOb, 'sent')
    emit('center', dataOb, 'sent')

    // 清空聊天框
    chatText.value = ''
}
// 文件上传
function uploadFile(e) {
    const formData = new FormData()
    formData.append("file", e.target.files[0])
    const size = byteCovert(e.target.files[0]?.size)
    if (!size) return 
    const uuid = uuidv4()
    const box = reactive({
        progress: 0,
        type: e.target.files[0]?.type,
        fileName: e.target.files[0]?.name,
        // text 文本描述主要用于好友栏的提示
        text: `[文件]${e.target.files[0]?.name ?? ''}`,
        size,
        time: timeFormat(),
        response: '',
        user: 1,
        src: '',
        chat_id: uuid
    })
    // 发送信息到文本框
    sendMessage(box)
    // 清空 targt,不然上传同一个文件会没有反应
    e.target.value = null

    upload(api.file, formData, function(err, progress, response) {
        if (err) {
            box.progress = 0
            box.response = ''
            return
        }

        if (progress) {
            box.progress = progress
        }

        if (response) {
            box.response = response.data
            box.src = `${sessionStorage.getItem('baseUrl')}/${api.source}/${response.data}`
        }
    })
}

// 视频通话
const showOfferer = ref(false)
function videoCall() {
    emit('videoCallStart', { videoCallStart: true })
    showOfferer.value = true
}
</script>
<style lang="scss" scoped>
.text-send {
    min-height: 40px;
    display: flex;
    box-sizing: border-box;
    padding: 10px;
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
    margin: 0 10px;

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
.select-tab {
    padding: 5px;
    border-top: 2px solid #F5F6FA;
    display: flex;
}
.video-call {
    margin: 0 10px;
    img {
        width: 18px;
    }
}
.call {
    margin: 0 10px;
    img {
        width: 18px;
    }
}
</style>