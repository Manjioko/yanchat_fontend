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
    offerData: {
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
// const to_id = props.offerData.user_id
// const to_table = props.offerData.to_table 
const constraints = { 
    video: {
        width: width.value,
        height: height.value
    },
    audio: false
}
// console.log('offerer 的数据是 -> ', props.offerData, )
const sendAnwserConfig = {
    event: 'videoCallAnwser',
    type: 'anwser',
    user_id,
    to_table: props.offerData.to_table ,
    to_id: props.offerData.user_id,
    data: null
}

const sendIcecandidateConfig = {
    event: 'videoCallAnwser',
    type: 'candidate',
    user_id,
    to_table: props.offerData.to_table ,
    to_id: props.offerData.user_id,
    data: null
}

const sendResponseConfig = {
    event: 'videoCallResponse',
    type: 'response',
    user_id,
    to_table: props.offerData.to_table ,
    to_id: props.offerData.user_id,
    data: null
}

const sendLeaveConfig = {
    event: 'videoCallLeave',
    type: 'leave',
    user_id,
    to_table: props.offerData.to_table ,
    to_id: props.offerData.user_id,
    data: null
}

const ok = ref(false)

watch(() => props.offerData, (newVal) => {
    // console.log('answer 收到 ->', newVal)
    if (newVal && newVal.type === 'offer') {
        // localpeerConnection.setRemoteDescription(new RTCSessionDescription(newVal.data))
        listenOffer(newVal.data)
    }
    if (newVal && newVal.type === 'candidate') {
        // localpeerConnection.addIceCandidate(new RTCIceCandidate(newVal.data))
        listenIcecandidate(newVal.data)
    }
    if (newVal && newVal.type === 'request') {
        if (newVal.reject) {
            ok.value = false
        } else {
            ok.value = true
        }
    }
    if (newVal && newVal.type === 'leave') {
        disconnectVideoCall()
    }
}, {
    immediate: true
})

const showStopIcon = ref(false)
async function start() {
    if (ok.value) {
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
        sendIcecandidate()
        playRemote()
        props.socket.send(JSON.stringify({
            ...sendResponseConfig,
            data: 'ok'
        }))
        return
    }

    props.socket.send(JSON.stringify({
        ...sendResponseConfig,
        data: 'reject'
    }))

    emit('destroy', true)
  
}

onMounted(() => {
    start()
})

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
async function listenOffer(offer) {
    // 将 Answer 保存为远程描述；
    // await localpeerConnection.setRemoteDescription(answer)
    await localpeerConnection.setRemoteDescription(offer)
    let remoteAnswer = await localpeerConnection.createAnswer()
    await localpeerConnection.setLocalDescription(remoteAnswer)
    sendAnwserConfig.data = localpeerConnection.localDescription
    props.socket.send(JSON.stringify(sendAnwserConfig))
}

// 接收 candidate
async function listenIcecandidate(candidate) {
    if (candidate) {
        await localpeerConnection.addIceCandidate(candidate)
    }
}

function disconnectVideoCall() {
    localpeerConnection.close()
    localStream.getTracks().forEach(track => track.stop())
    emit('destroy', true)
}

// 点击结束通话按钮
function stopToCall() {
    // console.log('结束通话')
    props.socket.send(JSON.stringify({
        ...sendLeaveConfig,
        from: 'anwserer',
        to: 'offerer'
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