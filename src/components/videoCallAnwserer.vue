<!-- 结构部分 -->
<template>
    <VueDragResize
        :w="width"
        :h="height"
        :x="100"
        :y="100"
        :isResizable="false"
        :z="99999"
    >
        <video id="local-video" autoplay playsinline></video>
        <video id="remote-video" autoplay playsinline></video>
    </VueDragResize>
</template>

<script setup>
import VueDragResize from 'vue-drag-resize'
import { onMounted, ref, defineProps, watch } from 'vue'
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
let localVideo = null
let localpeerConnection = null
const user_id = sessionStorage.getItem('user_id')
const constraints = { 
    video: {
        width: width.value,
        height: height.value
    },
    audio: false
}

const sendAnwserConfig = {
    event: 'videoCallAnwser',
    type: 'anwser',
    user_id,
    to_table: props.friend.to_table,
    to_id: props.friend.id,
    data: null
}

const sendIcecandidateConfig = {
    event: 'videoCallAnwser',
    type: 'candidate',
    user_id,
    to_table: props.friend.to_table,
    to_id: props.friend.id,
    data: null
}

watch(() => props.offerData, (newVal) => {
    if (newVal && newVal.type === 'offer') {
        // localpeerConnection.setRemoteDescription(new RTCSessionDescription(newVal.data))
        listenOffer(newVal.data)
    }
    if (newVal && newVal.type === 'candidate') {
        // localpeerConnection.addIceCandidate(new RTCIceCandidate(newVal.data))
        listenIcecandidate(newVal.data)
    }
})


async function start() {
    
    localVideo = document.getElementById('local-video')
    localStream = await navigator.mediaDevices.getUserMedia(constraints)
    localVideo.srcObject = localStream
    localpeerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    localStream.getTracks().forEach((track) => {
        localpeerConnection.addTrack(track, localStream)
    })
    sendIcecandidate()
    playRemote()
}

onMounted(() => {
    start()
})

// 发送候选者
async function sendIcecandidate() {
    localpeerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            sendIcecandidateConfig.data = event.candidate
            props.socket?.send(JSON.stringify(sendIcecandidateConfig))
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
        await localpeerConnection?.addIceCandidate(candidate)
    }
}

</script>

<!-- 样式部分 -->
<style lang="scss" scoped></style>