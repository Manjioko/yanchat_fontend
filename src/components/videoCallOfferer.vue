<!-- 结构部分 -->
<template>
    <VueDragResize
        :w="width"
        :h="height"
        :isResizable="false"
        :z="99999"
    >
        <video id="local-video" autoplay playsinline ></video>
    </VueDragResize>
</template>

<script setup>
import VueDragResize from 'vue-drag-resize'
import { onMounted, ref } from 'vue'
// const props = defineProps({
//     socket: {
//         type: Object,
//         default: {}
//     }
// })

const width = ref(500)
const height = ref(360)
const localStream = ref(null)
const localVideo = ref(null)
const constraints = { 
    video: {
        width: width.value,
        height: height.value
    },
    audio: false
}


async function start() {
    
    localVideo.value = document.getElementById('local-video')
    localStream.value = await navigator.mediaDevices.getUserMedia(constraints)
    localVideo.value.srcObject = localStream.value
}

onMounted(() => {
    start()
})



</script>

<!-- 样式部分 -->
<style lang="scss" scoped></style>