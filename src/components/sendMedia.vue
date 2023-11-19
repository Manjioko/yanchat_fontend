<template>
    <section class="media-sec">
        <!-- 下载视频 loading -->
        <div class="download-progress" v-if="downloadProgress && downloadProgress < 100">
            <el-progress
                type="circle"
                :percentage="downloadProgress || 0"
                color="#00daff"
                :stroke-width="2"
                :width="15"
            ></el-progress>
        </div>
        <div
            v-if="type.includes('video')"
            class="video"
            @dblclick="doubleclick"
            @contextmenu.prevent="onContextMenu"
            data-menu-video
        >
            <div :class="{'gray-background' : stopIconShow}">
                <div v-if="progress >= 100 && stopIconShow" class="stop-to-play"  @click="playVideo"></div>
            </div>
            <div class="progress" v-if="progress < 100">
                <el-progress type="circle" :percentage="progress || 0" color="#fff" :stroke-width="4" :width="50">
                    <template #default="{ percentage }">
                        <div v-if="percentage" class="pr-text">
                            <img src="../assets/startUpload.png" alt="uploadingZipFile" width="6">
                        </div>
                    </template>
                </el-progress>
            </div>
            <video :src="mediaSrc" class="video-style" ref="video" @click="stopVideo" />
        </div>
        <div v-else class="img" @contextmenu.prevent="onContextMenuImg" data-menu-image>
            <el-image
                class="img-style"
                ref="image"
                :src="mediaSrc"
                :zoom-rate="1.2"
                :preview-src-list="[mediaSrc]"
                fit="cover"
                @load="loadEmit"
            />
        </div>
    </section>

    <!-- 弹框播放视频 -->
    <section class="video-dialog">
        <el-dialog v-if="showVideo" v-model="showVideo" draggable :close-on-click-modal="false">
            <video-player
                :src="mediaSrc"
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
import { defineProps, ref, defineEmits, onMounted, onUnmounted, inject, watch } from 'vue'
import { VideoPlayer } from '@videojs-player/vue'
import 'video.js/dist/video-js.css'
// import ContextMenu from '@imengyu/vue3-context-menu'
import download from '@/utils/download.js'
import menu from '@/utils/contextMenu.js'
import { request, api } from '@/utils/api'
import { to } from 'await-to-js'
// import { ElNotification } from 'element-plus'

const props = defineProps({
    progress: Number,
    type: String,
    src: String,
    response: String,
    fileName: String,
    dataIndex: Number,
    user: Number
})
const emit = defineEmits(['loaded', 'withdraw', 'deleted', 'quote'])
// inject 
const scrollBar = inject('scrollBar')

// 视频播放示意 icon
function handleIcon() {
    stopIconShow.value = !stopIconShow.value
}


// 视频处理
// 视频 ref
const video = ref()
// 图片 ref
const image = ref()
// 用于点击时弹出视频
const showVideo = ref(false)
const dialogSrc = ref('')
const token = sessionStorage.getItem('Token')
const mediaSrc = ref('')
const downloadProgress = ref(null)

watch(showVideo, async val => {
    if (val) {
        const [err, res] = await to(request({
            method: 'get',
            url: api.verifyAuth,
        }))
        if (err) return
        // console.log('res -> ', res)
        if (res.status === 200) {
            const token = sessionStorage.getItem('Token')
            dialogSrc.value = `${props.src}?token=${token}`
        }
    }
})

watch(() => props.src, val => {
    if (val) {
        mediaSrc.value = `${val}?token=${token}`
    }
}, { immediate: true })

watch(() => downloadProgress.value, (val) => {
    if (val >= 100) {
        downloadProgress.value = null
    }
})


// emit 事件
function loadEmit() {
    const chatWindowRect = scrollBar.value.wrapRef.getBoundingClientRect()

    // 为了解决视频和图片在加载之初与加载完成后高度不同，导致聊天记录位置定位错乱的问题
    // 使用 getBoundingClientRect 方法来获取元素的位置,然后与父元素的高度进行比较
    // 就可以确定元素是否在聊天框的可视范围之内,如果在可视范围指南,则需要将元素加载后的高度
    // 附加到父元素的 scrollTop 上，这样就可以解决定位错乱的问题
    if (props.type.includes('video')) {
        const videoRect = video.value.getBoundingClientRect()
        if (videoRect.top > chatWindowRect.top) {
            scrollBar.value.wrapRef.scrollTop += video.value.clientHeight
        }
    }
    if (props.type.includes('image'))  {
        const imageRect = image.value.$el.getBoundingClientRect()
        if (imageRect.top > chatWindowRect.top) {
            scrollBar.value.wrapRef.scrollTop += image.value.$el.clientHeight
        }
    }
}

// const isVideoLoad = ref(false)
onMounted(() => {
    if (props.type.includes('video')) {
        video.value.addEventListener('loadeddata',loadEmit)
        // videoInitHeight = video.value.clientHeight
        // console.log('videoInitHeight -> ', videoInitHeight)
        // isVideoLoad.value = true
        return
    } else {
        // image.value.addEventListener('load',loadEmit)
        // imageInitHeight = image_div.value.clientHeight
        // console.log('imageInitHeight -> ', imageInitHeight)
    }
})
onUnmounted(() => {
    video.value && video.value.removeEventListener('loadeddata', loadEmit)
})

// 视频播放暂停锁
const stopIconShow = ref(true)

// 视频播放控制事件
function playVideo() {
    // showVideo.value = true
    if (props.progress < 100) return
    video.value.play()
    video.value.muted = false
    stopIconShow.value = false
    video.value.addEventListener('ended', handleIcon)
}

// 视频暂停播放控制
function stopVideo() {
    video.value.removeEventListener('ended', handleIcon)
    video.value.pause()
    stopIconShow.value = true
}

// 双击事件
function doubleclick() {
    showVideo.value = true
}

// 右键菜单
const videoMenu = [
    { 
        label: "下载到本地", 
        onClick: () => {
            const url = `${api.source}/${props.response}`
            download(url, props.fileName, function(err, progress) {
                if (err) return downloadProgress.value = null
                downloadProgress.value = progress
                // console.log('downloadProgress -> ', downloadProgress.value)
            })
        }
    },
    {
        label: '静音播放',
        onClick: () => {
            video.value.play()
            video.value.muted = true
            stopIconShow.value = false
        }
    },
    {
        label: '删除',
        onClick: () => {
            emit('deleted', props.dataIndex)
        }
    },
    {
        label: '撤回',
        onClick: () => {
            emit('withdraw', props.dataIndex)
        }
    },
    {
        label: '引用',
        onClick: () => {
            emit('quote', props.dataIndex)
        }
    },
]
// 右键菜单
const imgMenu = [
    { 
        label: "下载到本地", 
        onClick: () => {
            // const fileUrl = sessionStorage.getItem('baseUrl') + api.file 
            // const url = fileUrl.replace(/(.+\/).+/, (m, v) => v) + 'source/' + props.response
            const url = `${api.source}/${props.response}`
            download(url, props.fileName,function(progress) {
                downloadProgress.value = progress
                // console.log('downloadProgress -> ', downloadProgress.value)
            })
        }
    },
    {
        label: '删除',
        onClick: () => {
            emit('deleted', props.dataIndex)
        }
    },
    {
        label: '撤回',
        onClick: () => {
            emit('withdraw', props.dataIndex)
        }
    },
    {
        label: '引用',  
        onClick: () => {
            emit('quote', props.dataIndex)
        }
    },
]

// 菜单事件
function onContextMenu(e) {
    const menuList = [...videoMenu]
    if (!props.user) {
        const shouldRemoveMenus = ['撤回']
        // const shouldAddMenus = []
        for (const m of shouldRemoveMenus) {
            const idx = menuList.findIndex((item) => item.label === m)
            if (idx > -1) {
                menuList.splice(idx, 1)
            }
        }
    }
    menu(e, menuList)
}
function onContextMenuImg(e) {
    const menuList = [...imgMenu]
    if (!props.user) {
        const shouldRemoveMenus = ['撤回']
        // const shouldAddMenus = []
        for (const m of shouldRemoveMenus) {
            const idx = menuList.findIndex((item) => item.label === m)
            if (idx > -1) {
                menuList.splice(idx, 1)
            }
        }
    }
    menu(e, menuList)
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
    .media-sec {
        position: relative;
    }
    .download-progress {
        position: absolute;
        top: 50%;
        left: -10%;
        :deep .el-progress path:first-child {
            // 修改进度条背景色 
            stroke: rgb(31, 31, 31);
        }
        :deep .el-progress__text {
            display: none;
        }
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