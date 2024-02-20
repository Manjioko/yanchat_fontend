<template>
    <header>
        <section v-if="showGotoBottom" style="position: relative;">
            <div class="goto-bottom" @click="handleGotoBottom">
                <span>回到最新位置</span>
            </div>
        </section>
    </header>
    <main>
        <section class="select-tab">
            <div class="video-call">
                <img src="../assets/videoCall.png" alt="video-call" @click="videoCall">
            </div>
            <div class="call">
                <img src="../assets/call.png" alt="call">
            </div>
            <div class="upload">
                <img src="../assets/folder.png" alt="upload">
                <input type="file" @change="uploadFile" v-if="uploadDisable">
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
</template>
<script setup lang="ts">
import { ref, defineProps, defineEmits, reactive, computed } from 'vue'
import { timeFormat } from '@/utils/timeFormat'
import byteCovert from '@/utils/byteCovert'
import { api } from '@/utils/api'
import { uploadSlice } from '@/utils/download'
import { v4 as uuidv4 } from 'uuid'
import { getVideoBase64, getImageBase64 } from '@/utils/thumbnail'
import { ElNotification } from 'element-plus'
import { Box } from '@/interface/global'
import { UploadCallback } from '@/interface/download'
import { useStore } from 'vuex'

const props = defineProps({
    chatBox: Object,
    uploadDisable: Boolean,
    quote: {
        type: String,
        default: ''
    }
})
const emit = defineEmits(['center', 'progress', 'response', 'videoCallStart', 'gotoBottom'])
const store = useStore()
const showGotoBottom = computed(() => store.state.footSend.goToBottom)

const chatText = ref('')

// 键盘 摁下 enter 键触发事件
function hdkeydown() {
    sendMessage()
}

// 发送文本到聊天框的处理器
function sendMessage(chatData?:Box) {
    if (chatData) {
        // Center(chatData, 'sent')
        emit('center', chatData, 'sent')
        return
    }

    const message = chatText.value

    if (!message) return

    // websocket.value?.send(JSON.stringify(sendData))
    const uuid = uuidv4()
    const dataOb:Box = reactive({
        type: 'text',
        text: message,
        user: 1,
        time: timeFormat(),
        chat_id: uuid,
        quote: '',
        to_table: '',
        to_id: '', 
        user_id: '',
        loading: false
    })
    if (props.quote) {
        dataOb.quote = props.quote
    }
    // Center(dataOb, 'sent')
    emit('center', dataOb, 'sent')

    // 清空聊天框
    chatText.value = ''
}

// 文件分段上传测试
function uploadSliceFile(file:File, cb: UploadCallback) {
    uploadSlice.handleFile(file, cb)
}
// 文件上传
async function uploadFile(e:Event) {
    const formData = new FormData()
    const target = e.target as HTMLInputElement
    if (!target.files?.length) return
    formData.append("file", target.files[0])
    const size = byteCovert(target.files[0]?.size)
    if (!size) return 
    const uuid = uuidv4()
    const box:Box = reactive({
        progress: 0,
        type: target.files[0]?.type,
        fileName: target.files[0]?.name,
        // text 文本描述主要用于好友栏的提示
        text: `[文件]${target.files[0]?.name ?? ''}`,
        size,
        time: timeFormat(),
        response: '',
        user: 1,
        src: '',
        thumbnail: '',
        destroy: false,
        chat_id: uuid,
        to_table: '',
        to_id: '',
        user_id: '',
        loading: true
    })
    // 发送信息到文本框
    sendMessage(box)
    // console.log('target.files[0] -> ', box.type)
    // 获取缩略图
    if (box.type.includes('video')) {
        // console.log('video -> ', 'video')
        const getURL = window.URL.createObjectURL(target.files[0])
        const thumbnail = await getVideoBase64(getURL)
        box.thumbnail = thumbnail
    }
    if (box.type.includes('image')) {
        const getURL = window.URL.createObjectURL(target.files[0])
        const thumbnail = await getImageBase64(getURL)
        box.thumbnail = thumbnail
    }
    uploadSliceFile(target.files[0], function(err, progress, response) {
        if (err) {
            box.progress = 0
            box.response = ''
            box.destroy = true
            ElNotification({
                type: 'error',
                title: '上传提示',
                message: '上传失败!'
            })
            return
        }

        if (progress) {
            box.progress = progress
        }

        if (response) {
            box.response = response
            box.src = `${sessionStorage.getItem('baseUrl')}/${api.source}/${response}`
        }

    })

    // 清空 targt,不然上传同一个文件会没有反应
    target.value = ''
    // upload(api.file, formData, function(err, progress, response) {
    //     if (err) {
    //         box.progress = 0
    //         box.response = ''
    //         return
    //     }

    //     if (progress) {
    //         box.progress = progress
    //     }

    //     if (response) {
    //         box.response = response.data
    //         box.src = `${sessionStorage.getItem('baseUrl')}/${api.source}/${response.data}`
    //     }
    // })
}

// 视频通话
// const showOfferer = ref(false)
function videoCall() {
    emit('videoCallStart', { videoCallStart: true })
    // showOfferer.value = true
}

function handleGotoBottom() {
    // store.commit('footSend/setGotoBottomState', false)
    emit('gotoBottom')
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
.goto-bottom {
    position: absolute;
    bottom: 15px;
    right: 15px;
    width: 100px;
    background: #fff;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 30px;
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 2px 2px 6px #f5f5f5;
    cursor: pointer;
    color: #0093ff;
}
.goto-bottom:hover {
    background-color: #f5f5f5;
}
</style>