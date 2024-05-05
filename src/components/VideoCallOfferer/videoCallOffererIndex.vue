<!-- 结构部分 -->
<template>
    <VueDragResize
        :w="width"
        :h="height"
        :x="100"
        :y="100"
        :isResizable="false"
        :z="9"
    >
        <div class="video-box">
            <div v-if="showStopIcon" style="z-index: 10;" class="stop-call" @click="stopToCall">
                <img src="../../assets/stop_call.png" class="stop-call-icon" alt="stop call">
            </div>
            <div class="vide-container">
                <video id="local-video" autoplay playsinline></video>
                <video id="remote-video" autoplay playsinline></video>
            </div>
        </div>
    </VueDragResize>
</template>

<script setup lang="ts">
import VueDragResize from 'vue-drag-resize'
import { onMounted, ref, defineProps, watch } from 'vue'
import { timeFormat, getUseTime } from '@/utils/timeFormat'
import { v4 as uuidv4 } from 'uuid'
// import { VideoConfig } from '@/interface/video'
import { centerSend } from '@/view/Main/Methods/centerMethods'
// import { Box } from '@/interface/global'
import { destroyVideoCallOfferer } from '@/components/VideoCallOfferer/methods/videoCenter'
import { VideoCallOfferer } from './store'
import { storeToRefs } from 'pinia'
const { videocallAnwserData: anwserData } = storeToRefs(VideoCallOfferer())
// import { Box } from '@/interface/global'

// import { ElNotification } from 'element-plus'
// const emit = defineEmits(['destroy', ])
const props = defineProps({
    socket: {
        type: WebSocket,
        default: () => ({})
    },
    friend: {
        type: Object,
        default: () => ({})
    },
    // anwserData: Object as () => VideoConfig
})

const width = ref(500)
const height = ref(360)
let localStream:MediaStream | null = null
// let localVideo = null
let localpeerConnection:RTCPeerConnection | null = null
const user_id: string = sessionStorage.getItem('user_id') || ''
const constraints = { 
    video: {
        width: width.value,
        height: height.value
    },
    audio: false
}

const sendOfferConfig: VideoConfig = {
    event: 'videoCallOffer',
    type: 'offer',
    user_id,
    to_table: props.friend.to_table,
    to_id: props.friend.id,
    data: null
}

const sendIcecandidateConfig: VideoConfig = {
    event: 'videoCallOffer',
    type: 'candidate',
    user_id,
    to_table: props.friend.to_table,
    to_id: props.friend.id,
    data: null
}

const sendRequestConfig: VideoConfig = {
    event: 'videoCallRequest',
    type: 'request',
    user_id,
    to_table: props.friend.to_table,
    to_id: props.friend.id,
    data: null
}

const sendLeaveConfig: VideoConfig = {
    event: 'videoCallLeave',
    type: 'leave',
    user_id,
    to_table: props.friend.to_table,
    to_id: props.friend.id,
    data: null
}

watch(() => anwserData.value, (newVal) => {
    if (newVal && newVal.type === 'anwser') {
        // localpeerConnection.setRemoteDescription(new RTCSessionDescription(newVal.data))
        // console.log('answer', newVal.data )
        listenAnswer(newVal.data)
    }
    if (newVal && newVal.type === 'candidate') {
        // console.log('ice -> ', newVal.data)
        // localpeerConnection.addIceCandidate(new RTCIceCandidate(newVal.data))
        listenIcecandidate(newVal.data)
    }
    if (newVal && newVal.type === 'response') {
        listenResponse(newVal.data)
    }
    if (newVal && newVal.type === 'leave') {
        disconnectVideoCall()
    }
})

const showStopIcon = ref(false)
async function start() {
    localpeerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    localStream = await navigator.mediaDevices.getUserMedia(constraints)
    if (localStream) {
        const videoEl = document.getElementById('local-video') as HTMLMediaElement
        if (!videoEl) return
        videoEl.addEventListener('playing', () => {
            showStopIcon.value = true
        })
        videoEl.srcObject = localStream
        localStream.getTracks().forEach((track) => {
            // 这里 localStream 只有两种状态 MediaStream | null,前面已经判断 localStream 存在
            // 这里就断言 localStream 为 MediaStream 类型数据
            localpeerConnection?.addTrack(track, localStream!)
        })
    }

    // sendOffer()
    sendIcecandidate()
    playRemote()

    // 发送视频通话请求
    props.socket.send(JSON.stringify(sendRequestConfig))
}

onMounted(() => {
    start()
})

// 发送 offer
async function sendOffer() {
    let offer = await localpeerConnection?.createOffer()
    await localpeerConnection?.setLocalDescription(offer)
    if (sendOfferConfig && localpeerConnection) {
        sendOfferConfig.data = localpeerConnection.localDescription
        props.socket.send(JSON.stringify(sendOfferConfig))
    }
}

// 发送候选者
async function sendIcecandidate() {
    if(!localpeerConnection) return
    localpeerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            sendIcecandidateConfig.data = event.candidate
            props.socket.send(JSON.stringify(sendIcecandidateConfig))
        }
    }
}

// 播放远程流
async function playRemote() {
    if(!localpeerConnection) return
    localpeerConnection.ontrack = (e) => {
        (document.getElementById('remote-video') as HTMLMediaElement).srcObject = e.streams[0]
    }
}


// 接收 answer
async function listenAnswer(answer: any) {
    // 将 Answer 保存为远程描述；
    await localpeerConnection?.setRemoteDescription(answer)
}

// 接收 candidate
async function listenIcecandidate(candidate:any) {
    if (candidate) {
        await localpeerConnection?.addIceCandidate(candidate)
    }
    
}
// 计时
let startTime:number | null = null
function listenResponse(data:any) {
    if (data === 'ok') {
        sendOffer()
        startTime = new Date().getTime()
    } else {
       disconnectVideoCall('通话未连接') 
    }
}

function disconnectVideoCall(rejectMessage?:string) {
    localpeerConnection?.close()
    localStream?.getTracks().forEach(track => track.stop())
    // emit('destroy', true)
    destroyVideoCallOfferer()
    // 处理通话时长显示
    const uuid = uuidv4()
    // 发送消息还有一种情况,就是发送给自己的和发送到对面的不是同一文本
    let dataOb = {
        type: 'text',
        text: '',
        user: 1,
        time: timeFormat(),
        chat_id: uuid
    }
    
    if (!startTime) {
        dataOb.text = rejectMessage || '通话未接通'
    } else {
        const timeMsg = getUseTime(startTime, new Date().getTime()).toString()
        dataOb.text = `通话时长为 ${timeMsg}`
    }

    // emit('center', dataOb, 'sent')
    centerSend(dataOb as Box)
}

// 点击结束通话按钮
function stopToCall() {
    console.log('结束通话 1')
    props.socket.send(JSON.stringify({
        ...sendLeaveConfig,
        from: 'offerer',
        to: 'anwserer'
    }))
    
    disconnectVideoCall()

}

</script>

<!-- 样式部分 -->
<style lang="scss" scoped>
.de-container {
    position: relative;
}
#remote-video {
    width: 160px;
    position: absolute;
    right: 0;
    border-radius: 4px;
}
.video-box {
    position: relative;
    .stop-call {
        width: 80px;
        height: 80px;
        background: #ff5151bf;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        bottom: 20px;
        left: 43%;
        img {
            width: 50px;
        }
    }
}
</style>
@/utils/timeFormat/timeFormat