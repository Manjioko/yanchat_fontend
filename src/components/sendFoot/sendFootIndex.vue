<template>
    <header>
        <section v-if="showGotoBottom === 'Yes'" style="position: relative;">
            <div class="goto-bottom" @click="handleGotoBottom">
                <span>回到最新位置 {{ chatBoxCacheList.length ? chatBoxCacheList.length : ''}}</span>
            </div>
        </section>
    </header>
    <main>
        <section class="select-tab">
            <!-- <div class="video-call">
                <img src="../../assets/videoCall.png" alt="video-call" @click="videoCall">
            </div>
            <div class="call">
                <img src="../../assets/call.png" alt="call">
            </div> -->
            <div class="upload">
                <img src="../../assets/folder.png" alt="upload">
                <input type="file" @change="clickFileUpload" v-if="!!activeFriend">
            </div>
        </section>
        <div class="text-send">
            <!-- @keyup.shift.enter.exact="hdkeydown" -->
            <!-- <el-input
                v-model="chatText"
                :autosize="{ minRows: 1, maxRows: 5 }"
                type="textarea"
                placeholder="在这里输入你的消息...
                @keydown.shift.enter.prevent="hdkeydown"
            /> -->


            <RichText ref="richText" @rich-text-data="richTextData" @keydown="hdkeydown" />
            
            <!-- <button @click="clickSendBtn()" class="send-btn">
                <span>发送</span>
                <img src="../../assets/send.png" alt="send">
            </button> -->
        </div>
    </main>
</template>
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { timeFormat } from '@/utils/timeFormat'
import byteCovert from '@/utils/byteCovert'
import {  mediaUpload } from '@/utils/download'
import { v4 as uuidv4 } from 'uuid'
import { getVideoBase64, getImageBase64 } from '@/utils/thumbnail'
import { ElNotification } from 'element-plus'
import { FootSendStore } from './store'
import { storeToRefs } from 'pinia'
import { centerSend, centerAISend } from '@/view/Main/Methods/centerMethods'
// import { handleVideoCallStart } from '../VideoCallOfferer/methods/videoCenter'
import { handleGotoBottom } from '@/view/Main/Methods/mainMethods'
import { CommentQuoteStore } from '../comentQuote/store'
import { FriendsListStore } from '../friendsList/store'
import RichText from './component/richText/richTextIndex.vue'
import { MainStore } from '@/view/Main/store'


const sfStore = FootSendStore()
const { isShowGoToNewBtn: showGotoBottom, chatBoxCacheList } = storeToRefs(sfStore)
const { comment } = storeToRefs(CommentQuoteStore())
const { activeFriend } = storeToRefs(FriendsListStore())
const { ws } = storeToRefs(MainStore())

const chatText = ref('')


function hdkeydown(e: any) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        clickSendBtn()
    }
}


// 键盘 摁下 enter 键触发事件
// function hdkeydown() {
//     sendMessage()
// }
const richText = ref()
async function richTextData(data: RichTextData) {
    const { textAry, listMap } = data
    const ary: any = []
    textAry.forEach((item)=> {
        if (item.type === 'img') {
            ary.push(item)
        } else {
            if (ary.length && Array.isArray(ary[ary.length - 1])) {
                ary[ary.length - 1].push(item)
            } else {
                ary.push([item])
            }
        }
    })

    for (const item of ary) {
        if (Array.isArray(item)) {
            chatText.value = item.reduce((a, b) => a + b.data + '\n', '')
            await sendMessage()
        } else {
            const file = listMap.get(item.data) as File
            await uploadFile(file)
        }
    }

    richText.value.clearRichText()
        
}

function clickSendBtn() {
    richText.value.handleSend()
}


// 发送文本到聊天框的处理器
async function sendMessage(chatData?:Box) {
    if (chatData) {
        await centerSend(chatData)
        return
    }

    const message = chatText.value
    // console.log('commment.value -> ', comment.value)

    if (!message) return
    
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
    if (comment.value) {
        dataOb.quote = comment.value
    }

    if (activeFriend.value && activeFriend.value.ai) {
        // console.log('activeFriend.value.ai -> ', activeFriend.value.ai, dataOb)
        centerAISend(dataOb)
    } else {
        await centerSend(dataOb)
    }

    // 清空聊天框
    chatText.value = ''
    richText.value.clearRichText()
}

// 文件分段上传测试
function uploadSliceFile(file:File, cb: UploadCallback) {
    // uploadSlice.handleFile(file, cb)
    mediaUpload(file, cb)
}

function clickFileUpload(e: Event) {
    const target = e.target as HTMLInputElement
    if (!target.files?.length) return
    let fileData = target.files[0]
    uploadFile(fileData)
    // 清空 targt,不然上传同一个文件会没有反应
    target.value = ''
}
// 文件上传
async function uploadFile(fileData:File) {
    const formData = new FormData()
    formData.append("file", fileData)
    const size = byteCovert(fileData?.size)
    // console.log('filename -> ', fileData)
    if (!size) return 
    const uuid = uuidv4()
    
    const box:Box = reactive({
        progress: 0,
        type: fileData?.type,
        fileName: fileData?.name,
        // text 文本描述主要用于好友栏的提示
        text: `[文件]${fileData?.name ?? ''}`,
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
        // loading: true
    })

    // 获取缩略图
    if (box.type.includes('video')) {
        // console.log('video -> ', 'video')
        const getURL = window.URL.createObjectURL(fileData)
        const thumbnail = await getVideoBase64(getURL)
        box.thumbnail = thumbnail
    }

    if (box.type.includes('image')) {
        const getURL = window.URL.createObjectURL(fileData)
        const thumbnail = await getImageBase64(getURL)
        box.thumbnail = thumbnail
    }

    uploadSliceFile(fileData, function(err:any, progress:any, response:any) {
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
            // console.log('progress -> ', progress)
            const eventParam: EventParams = {
                event: 'progress',
                data: {
                    chat_id: box.chat_id,
                    progress: progress
                },
                to_id: box.to_id,
                to_table: box.to_table,
                user_id: box.user_id
            }
            ws.value?.send(JSON.stringify(eventParam))
        }

        if (response) {
            box.response = response
            box.src = `${sessionStorage.getItem('baseUrl')}/source/${response}`
        }

    })

    // 发送信息到文本框
    await sendMessage(box)
}

// 视频通话
// const showOfferer = ref(false)
// function videoCall() {
//     // emit('videoCallStart', { videoCallStart: true })
//     handleVideoCallStart()
//     // showOfferer.value = true
// }

// function handleGotoBottom() {
//     // store.commit('footSend/setGotoBottomState', false)
//     // emit('gotoBottom')
//     handleGotoBottom()
// }
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
    z-index: 9999;
    user-select: none;
}
.goto-bottom:hover {
    background-color: #f5f5f5;
}
</style>