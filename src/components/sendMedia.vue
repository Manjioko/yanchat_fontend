<template>
    <div v-if="type.includes('video')" class="video" @click="playVideo">
        <div v-if="progress >= 100 && stopIconShow" class="stop-to-play"></div>
        <div class="progress" v-if="progress < 100">
            <el-progress type="circle" :percentage="progress || 0" color="#fff" :stroke-width="4" :width="50">
                <template #default="{ percentage }">
                    <div v-if="percentage" class="pr-text">
                        <img src="../assets/startUpload.png" alt="uploadingZipFile" width="6">
                    </div>
                </template>
            </el-progress>
        </div>
        <video :src="src" class="video-style" ref="video" />
    </div>
    <div v-else class="img">
        <img class="img-style" :src="src">
    </div>
</template>
<script setup>
import { defineProps, ref } from 'vue'
const props = defineProps({
    progress: Number,
    type: String,
    fileName: String,
    size: String,
    response: String,
    src: String,
})

function handleIcon() {
    stopIconShow.value = !stopIconShow.value
}
const video = ref()
const stopIconShow = ref(true)
function playVideo() {
    if (props.progress < 100) return
    if (video.value.paused) {
        video.value.play()
        stopIconShow.value = false
        video.value.addEventListener('ended', handleIcon)
    } else {
        video.value.removeEventListener('ended', handleIcon)
        video.value.pause()
        stopIconShow.value = true
    }
}
</script>
<style lang="scss" scoped>
    .video {
        position: relative;
    }
    .video-style {
        max-width: 400px;
        max-height: 300px;
        border-radius: 10px;
    }
    .stop-to-play {
        background-image: url('../assets/play.png');
        background-repeat: no-repeat;
        background-size: 50px;
        width: 50px;
        height: 50px;
        position: absolute;
        top: 50%;
        left: calc(50% - 25px);
        cursor: pointer;
        z-index: 999;
        // background-color: red;
    }
    .img-style {
        max-width: 400px;
        max-height: 300px;
    }
    .progress {
    position: absolute;
    // top: 12px;
    // left: 12px;
    top: 50%;
    left: calc(50% - 25px);

    :deep .el-progress path:first-child {
        // 修改进度条背景色 
        stroke: hsla(43, 28%, 65%, 1);
    }
    :deep .el-progress__text {
        display: none;
    }

    //    /deep/ .el-progress__text { // 修改进度条文字提示颜色
    //        color: #00C7FD; 
    //    }
}
</style>