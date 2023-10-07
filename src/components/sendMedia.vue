<template>
    <div
        v-if="type.includes('video')"
        class="video"
        @dblclick="doubleclick"
        @contextmenu="onContextMenu"
    >
        <div :class="{'gray-background' : stopIconShow}">
            <div v-if="isVideoLoad && progress >= 100 && stopIconShow" class="stop-to-play"  @click="playVideo"></div>
        </div>
        <div class="progress" v-if="isVideoLoad && progress < 100">
            <el-progress type="circle" :percentage="progress || 0" color="#fff" :stroke-width="4" :width="50">
                <template #default="{ percentage }">
                    <div v-if="percentage" class="pr-text">
                        <img src="../assets/startUpload.png" alt="uploadingZipFile" width="6">
                    </div>
                </template>
            </el-progress>
        </div>
        <video :src="src" :class="{ 'video-style': isVideoLoad, 'default-video-style': !isVideoLoad }" ref="video" @click="stopVideo" />
    </div>
    <div v-else class="img">
        <el-image
            class="img-style"
            :src="src"
            :zoom-rate="1.2"
            :preview-src-list="[src]"
            fit="cover"
            @load="emit('loaded', $event.target)"
        />
    </div>

    <!-- 弹框播放视频 -->
    <section class="video-dialog">
        <el-dialog v-if="showVideo" v-model="showVideo" draggable :close-on-click-modal="false">
            <video-player
                :src="src"
                controls
                :loop="false"
                :volume="0.6"
                :width="800"
                :height="450"
            />
        </el-dialog>
    </section>

</template>
<script setup>
import { defineProps, ref, defineEmits, onMounted, onUnmounted } from 'vue'
import { VideoPlayer } from '@videojs-player/vue'
import 'video.js/dist/video-js.css'
import ContextMenu from '@imengyu/vue3-context-menu'

const props = defineProps({
    progress: Number,
    type: String,
    src: String,
})
const emit = defineEmits(['loaded'])
function handleIcon() {
    stopIconShow.value = !stopIconShow.value
}


// 视频处理
const video = ref()
const showVideo = ref(false)

function loadEmit() {
    emit('loaded', video.value)
}
const isVideoLoad = ref(false)
onMounted(() => {
    if (props.type.includes('video')) {
        video.value.addEventListener('loadeddata',loadEmit)
        isVideoLoad.value = true
        return
    }
})
onUnmounted(() => {
    video.value && video.value.removeEventListener('loadeddata', loadEmit)
})
const stopIconShow = ref(true)
function playVideo() {
    // showVideo.value = true
    if (props.progress < 100) return
    video.value.play()
    stopIconShow.value = false
    video.value.addEventListener('ended', handleIcon)
}

function stopVideo() {
    video.value.removeEventListener('ended', handleIcon)
    video.value.pause()
    stopIconShow.value = true
}
function doubleclick() {
    showVideo.value = true
}

// 右键菜单
function onContextMenu(e) {
  //prevent the browser's default menu
  e.preventDefault();
  //show your menu
  ContextMenu.showContextMenu({
    x: e.x,
    y: e.y,
    items: [
      { 
        label: "A menu item", 
        onClick: () => {
          alert("You click a menu item");
        }
      },
      { 
        label: "A submenu", 
        children: [
          { label: "Item1" },
          { label: "Item2" },
          { label: "Item3" },
        ]
      },
    ]
  }); 
}
</script>
<style lang="scss" scoped>
    .video {
        position: relative;
    }
    .default-video-style {
        height: 1px;
        width: 1px;
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
        max-width: 120px;
        border-radius: 10px;
    }
    .progress {
        position: absolute;
        // top: 12px;
        // left: 12px;
        top: 50%;
        left: calc(50% - 25px);

        :deep .el-progress path:first-child {
            // 修改进度条背景色 
            stroke: rgb(124, 124, 124);
        }
        :deep .el-progress__text {
            display: none;
        }

        //    /deep/ .el-progress__text { // 修改进度条文字提示颜色
        //        color: #00C7FD; 
        //    }
    }
    .gray-background {
        width: 100%;
        height: calc(100% - 3px);
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 10px;
        background: black;
        opacity: 0.5;
        z-index: 1;
    }
</style>

<style lang="scss">
    .video-dialog {
        .el-dialog {
            background-color: rgba(0, 0, 0, 0.43);
            border-radius: 10px;
            box-shadow: 0px 0px 3px 2px #2c2c2cad;
            width: fit-content;
        }
        .el-dialog__body {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px 10px;
            width: auto;
        }
        .el-icon svg {
            color: #fff
        }
        // .el-dialog__header {
        //     padding: 0;
        // }
        .el-dialog__headerbtn {
            width: 40px;
            height: 38px;
            top: 0;
            // left: 0;
            font-size: 25px;
        }
        .el-dialog__header {
            padding: 0;
            padding-bottom: 25px;
        }
    }
</style>