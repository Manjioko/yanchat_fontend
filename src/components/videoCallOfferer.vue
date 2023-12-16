<!-- 结构部分 -->
<template>
    <VueDragResize :w="600" :h="300" :isResizable="false" :z="99999">
        <video id="local-video" autoplay playsinline></video>
    </VueDragResize>
</template>

<script setup>
import VueDragResize from 'vue-drag-resize'
import { onMounted } from 'vue'
// const props = defineProps({
//     socket: {
//         type: Object,
//         default: {}
//     }
// })




async function start() {
    let localStream
    let localVideo = document.getElementById('local-video')
    const constraints = { video: true, audio: false }
    localStream = await navigator.mediaDevices.getUserMedia(constraints)

    localVideo.srcObject = localStream
}

onMounted(() => {
    start()
})



</script>

<!-- 样式部分 -->
<style lang="scss" scoped></style>