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
        <div class="vide-container">
            <video id="local-video" autoplay playsinline></video>
            <video id="remote-video" autoplay playsinline></video>
        </div>
    </VueDragResize>
</template>

<script setup>
import VueDragResize from 'vue-drag-resize'
import { onMounted, ref, defineProps, watch } from 'vue'
// import { ElNotification } from 'element-plus'
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

watch(() => props.anwserData, (newVal) => {
    if (newVal && newVal.type === 'anwser') {
        // localpeerConnection.setRemoteDescription(new RTCSessionDescription(newVal.data))
        console.log('answer', newVal.data )
        listenAnswer(newVal.data)
    }
    if (newVal && newVal.type === 'candidate') {
        console.log('ice -> ', newVal.data)
        // localpeerConnection.addIceCandidate(new RTCIceCandidate(newVal.data))
        listenIcecandidate(newVal.data)
    }
    if (newVal && newVal.type === 'response') {
        listenResponse(newVal.data)
    }
})


async function start() {

    // eslint-disable-next-line no-constant-condition
    // if (true) {
    //         const notify = ElNotification({
    //         message: h('div', { class: 'custom-notification' }, [
    //             h('div', {class: 'custom-notification-title'}, '用户来电通知'),
    //             h('div', {class: 'custom-notification-box'}, [
    //                 h('a', {
    //                     class: 'custom-notification-button-confirm',
    //                     onClick: () => {
    //                         // sendRequestConfig.data = 'ok'
    //                         // props.socket.send(JSON.stringify(sendRequestConfig))
    //                         console.log('ok')
    //                         notify.close()
    //                     }
    //                 }, '确定'),
    //                 h('a', {
    //                     class: 'custom-notification-button-cancel',
    //                     onClick: () => {
    //                         // sendRequestConfig.data = 'cancel'
    //                         // props.socket.send(JSON.stringify(sendRequestConfig))
    //                         console.log('cancel')
    //                         notify.close()
    //                     }
    //                 }, '取消'),
    //             ]),
                
    //         ]),
    //         duration: 0,
    //         showClose: false,
    //         customClass: 'custom-notification-class',
    //         // icon: h('img', { src: require('../assets/videoCall.png') }),
    //     })
    //     return
    // }
    
    localpeerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    localStream = await navigator.mediaDevices.getUserMedia(constraints)
    document.getElementById('local-video').srcObject = localStream
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
        console.log('对方拒绝视频通话')
    }
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
</style>


<style lang="scss">
.custom-notification-class {
    padding: 10px 0;
    .el-notification__group {
        flex: 1;
    }
    .custom-notification {
        display: flex;
        align-items: center;
        .custom-notification-title {
            font-size: 16px;
            font-weight: bold;
            flex: 1;
        }
        .custom-notification-box {
            // width: 100%;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            .custom-notification-button-confirm {
                display: inline-block;
                background: #0087ff;
                width: 52px;
                text-align: center;
                padding: 3px;
                // margin: 10px 0;
                margin-bottom: 10px;
                border-radius: 3px;
                box-shadow: 1px 1px 1px #ddd;
                color: #fff;
            }
            .custom-notification-button-cancel {
                display: inline-block;
                background: #E6E8EB;
                width: 52px;
                text-align: center;
                padding: 3px;
                // margin: 10px 0;
                border-radius: 3px;
                box-shadow: 1px 1px 1px #ddd;
                color: #303133;
            }
        }
    }

}
</style>