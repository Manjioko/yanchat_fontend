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
            <div :class="{'gray-background' : stopIconShow, 'not-allow': destroy }">
                <div v-if="progress >= 100 && stopIconShow && options.length" class="stop-to-play"></div>
            </div>
            <div class="progress" v-if="progress && progress < 100">
                <el-progress type="circle" :percentage="progress || 0" color="#fff" :stroke-width="4" :width="50">
                    <template #default="{ percentage }">
                        <div v-if="percentage" class="pr-text">
                            <img src="../assets/startUpload.png" alt="uploadingZipFile" width="6">
                        </div>
                    </template>
                </el-progress>
            </div>
            <!-- <video :src="mediaSrc" class="video-style" ref="video" @click="stopVideo" /> -->
            <img v-if="thumbnail" ref="video" :src="thumbnail" class="video-style" @load="loadEmit" @error="handleElImageErr">
            <div v-else>视频加载出现了一些问题</div>
        </div>
        <div v-else class="img" @contextmenu.prevent="onContextMenuImg" data-menu-image>
            <div class="progress" v-if="progress && progress < 100">
                <el-progress type="circle" :percentage="progress || 0" color="#fff" :stroke-width="4" :width="50">
                    <template #default="{ percentage }">
                        <div v-if="percentage" class="pr-text">
                            <img src="../assets/startUpload.png" alt="uploadingZipFile" width="6">
                        </div>
                    </template>
                </el-progress>
            </div>
            <el-image
                class="img-style"
                ref="image"
                :src="thumbnail"
                :zoom-rate="1.2"
                :preview-src-list="[mediaSrc]"
                fit="cover"
                @load="loadEmit"
                @error="handleElImageErr"
            >
            <template #error>
                <div v-if="destroy" class="image-slot"></div>
            </template>
            </el-image>
        </div>
    </section>

    <!-- 弹框播放视频 -->
    <section class="video-dialog">
        <el-dialog v-if="showVideo" v-model="showVideo" draggable :close-on-click-modal="false">
            <video-player
                :sources="options"
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
import { defineProps, ref, defineEmits, inject, watch, nextTick } from 'vue'
import { VideoPlayer } from '@videojs-player/vue'
import 'video.js/dist/video-js.css'
import download from '@/utils/download'
import menu from '@/utils/contextMenu'
import { 
    // request,
     api 
    } from '@/utils/api'
// import { to } from 'await-to-js'

const props = defineProps({
    progress: Number,
    type: String,
    src: String,
    response: String,
    fileName: String,
    dataIndex: Number,
    user: Number,
    thumbnail: String,
    destroy: Boolean,
    chatId: String
})
const emit = defineEmits(['loaded', 'withdraw', 'deleted', 'quote'])
// inject 
const scrollBar = inject('scrollBar')

// 视频播放示意 icon
// function handleIcon() {
//     stopIconShow.value = !stopIconShow.value
// }


// 视频处理
// 视频 ref
const video = ref()
// 图片 ref
const image = ref()
// 用于点击时弹出视频
const showVideo = ref(false)
const mediaSrc = ref('')
const downloadProgress = ref(null)

const options = ref([])

watch(() => downloadProgress.value, (val) => {
    if (val >= 100) {
        downloadProgress.value = null
    }
})

watch(() => props.src, (val) => {
    if (val) {
        getSource()
    }
}, {
    immediate: true
})


watch(() => showVideo.value, (val) => {
    if (val) {
        stopIconShow.value = false
    } else {
        stopIconShow.value = true
    }
})


// emit 事件
function loadEmit() {
    // console.log('src -> ', props.response)
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
    if (props.type.includes('image')) {
        const imageRect = image.value.$el.getBoundingClientRect()
        if (imageRect.top > chatWindowRect.top) {
            scrollBar.value.wrapRef.scrollTop += image.value.$el.clientHeight
        }
    }
    emit('loaded', props.chatId)
}

// const isVideoLoad = ref(false)
// onMounted(() => {
//     if (props.type.includes('video')) {
//         video.value?.addEventListener('loadeddata', loadEmit)
//     }
// })
// onUnmounted(() => {
//     video.value && video.value?.removeEventListener('loadeddata', loadEmit)
// })

// 视频播放暂停锁
const stopIconShow = ref(true)

// 视频播放控制事件
// function playVideo() {
//     // showVideo.value = true
//     if (!options.value.length) return
//     if (props.progress < 100) return
//     video.value.play()
//     video.value.muted = false
//     stopIconShow.value = false
//     video.value.addEventListener('ended', handleIcon)
// }

// 视频暂停播放控制
// function stopVideo() {
//     video.value.removeEventListener('ended', handleIcon)
//     video.value.pause()
//     stopIconShow.value = true
// }

// 双击事件
function doubleclick() {
    if (!options.value.length) return
    showVideo.value = true
    // console.log('url -> ', mediaSrc.value)
}

// 右键菜单
const videoMenu = [
    { 
        label: "下载到本地", 
        onClick: () => {
            if (!options.value.length) return
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
            // if (!options.value.length) return
            // video.value.play()
            // video.value.muted = true
            // stopIconShow.value = false
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
            if (!mediaSrc.value) return
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

async function getSource() {
    // const [err, res] = await to(request({
    //     method: 'get',
    //     responseType: 'arraybuffer',
    //     url: `${api.source}/${props.response}`,
    // }))
    // console.log('err -> ', err)
    // if (err) return
    // if (res.status === 200) {
    //     const blob = new Blob([res.data], { type: props.type })
    //     const newUrl = URL.createObjectURL(blob)
    //     // mediaSrc 如果不设置 type 的话,无法在 video-player 上正确识别
    //     // 所以通过 options 这种方式实现
    //     options.value = [{
    //         type: props.type.includes('video') ? 'video/mp4' : props.type,
    //         src: newUrl
    //     }]
    //     mediaSrc.value = newUrl
    // }

    const src =`${sessionStorage.getItem('baseUrl')}${api.source}/${props.response}`
    // console.log('src -> ', src)
    options.value = [{
        type: props.type.includes('video') ? 'video/mp4' : props.type,
        src
    }]
    mediaSrc.value = src
}

function handleElImageErr() {
    // 这块处理的原因是因为 <el-image> 会在页面渲染后再触发 src 错误机制
    // 导致 <template #error> 在页面渲染后再出发,这样就会导致页面
    // 向下挤压一些像素(class image-slot 中的 height)
    // 所以需要将其拉回来,页面看起来才是正常的
    if (props.type.includes('image'))  {
        const chatWindowRect = scrollBar.value.wrapRef.getBoundingClientRect()
        const imageRect = image.value.$el.getBoundingClientRect()
        if (imageRect.top > chatWindowRect.top) {
            nextTick(() => {
                scrollBar.value.wrapRef.scrollTop += image.value.$el.clientHeight
            })
        }
    }
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
        min-width: 150px;
        max-height: 300px;
        // border-radius: 3px;
    }
    .stop-to-play {
        background-image: url('../assets/play.png');
        background-repeat: no-repeat;
        background-size: 50px;
        width: 50px;
        height: 50px;
        position: absolute;
        top: 40%;
        left: calc(50% - 25px);
        cursor: pointer;
        z-index: 999;
        // background-color: red;
    }
    .img-style {
        max-width: 250px;
        min-width: 150px;
        // border-radius: 3px;
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
        // border-radius: 10px;
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
    .image-slot {
        width: 70px;
        height: 70px;
        color: #ddd;
        cursor: not-allowed;
        background-image: url('../assets/err_load.svg');
        background-repeat: no-repeat;
        background-position: 50%;
        background-size: 70px;
    }
    .not-allow {
        cursor: not-allowed;
        background-image: url('../assets/err_load.svg');
        background-repeat: no-repeat;
        background-repeat: no-repeat;
        background-position: 50%;
        background-size: 100px;
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