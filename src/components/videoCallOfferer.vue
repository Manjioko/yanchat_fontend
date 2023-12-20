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
                <img src="../assets/stop_call.png" class="stop-call-icon" alt="stop call">
            </div>
            <div class="vide-container">
                <video id="local-video" autoplay playsinline></video>
                <video id="remote-video" autoplay playsinline></video>
            </div>
        </div>
    </VueDragResize>
</template>

<script setup>
import VueDragResize from 'vue-drag-resize'
import { onMounted, ref, defineProps, watch, defineEmits } from 'vue'
// import { ElNotification } from 'element-plus'
const emit = defineEmits(['destroy'])
const props = defineProps({
    socket: {
        type: Object,
        default: () => ({})
    },
    friend: {
        type: Object,
        default: () => ({})
    },
    anwserData: {
        type: Object,
        default: () => ({})
    }
})

const width = ref(500)
const height = ref(360)
let localStream = null
// let localVideo = null
let localpeerConnection = null
const user_id = sessionStorage.getItem('user_id')
const constraints = { 
    video: {
        width: width.value,
        height: height.value
    },
    audio: false
}

const sendOfferConfig = {
    event: 'videoCallOffer',
    type: 'offer',
    user_id,
    to_table: props.friend.to_table,
    to_id: props.friend.id,
    data: null
}

const sendIcecandidateConfig = {
    event: 'videoCallOffer',
    type: 'candidate',
    user_id,
    to_table: props.friend.to_table,
    to_id: props.friend.id,
    data: null
}

const sendRequestConfig = {
    event: 'videoCallRequest',
    type: 'request',
    user_id,
    to_table: props.friend.to_table,
    to_id: props.friend.id,
    data: null
}

const sendLeaveConfig = {
    event: 'videoCallLeave',
    type: 'leave',
    user_id,
    to_table: props.friend.to_table,
    to_id: props.friend.id,
    data: null
}

watch(() => props.anwserData, (newVal) => {
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
    const videoEl = document.getElementById('local-video')
    videoEl.addEventListener('playing', () => {
        showStopIcon.value = true
    })
    videoEl.srcObject = localStream
    localStream.getTracks().forEach((track) => {
        localpeerConnection.addTrack(track, localStream)
    })

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
    let offer = await localpeerConnection.createOffer()
    await localpeerConnection.setLocalDescription(offer)
    sendOfferConfig.data = localpeerConnection.localDescription
    props.socket.send(JSON.stringify(sendOfferConfig))
}

// 发送候选者
async function sendIcecandidate() {
    localpeerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            sendIcecandidateConfig.data = event.candidate
            props.socket.send(JSON.stringify(sendIcecandidateConfig))
        }
    }
}

// 播放远程流
async function playRemote() {
    localpeerConnection.ontrack = (e) => {
        document.getElementById('remote-video').srcObject = e.streams[0]
    }
}


// 接收 answer
async function listenAnswer(answer) {
    // 将 Answer 保存为远程描述；
    await localpeerConnection.setRemoteDescription(answer)
}

// 接收 candidate
async function listenIcecandidate(candidate) {
    if (candidate) {
        await localpeerConnection?.addIceCandidate(candidate)
    }
    
}

function listenResponse(data) {
    if (data === 'ok') {
        sendOffer()
    } else {
        // console.log('对方拒绝视频通话')
        localpeerConnection.close()
        localStream.getTracks().forEach(track => track.stop())
        emit('destroy', true)
    }
}

function disconnectVideoCall() {
    localpeerConnection.close()
    localStream.getTracks().forEach(track => track.stop())
    emit('destroy', true)
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
