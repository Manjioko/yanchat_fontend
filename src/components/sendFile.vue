<!-- 结构部分 -->
<template>
    <div class="pr" @contextmenu.prevent="onContextMenu" data-menu-file>
        <!-- 下载视频 loading -->
        <div class="download-progress" :class="{ 'other-progress': user === 0}" v-if="downloadProgress && downloadProgress < 100">
            <el-progress
                type="circle"
                :percentage="downloadProgress || 0"
                color="#00daff"
                :stroke-width="2"
                :width="15"
            ></el-progress>
        </div>
        <section class="pr-word">
            <div class="pr-message">{{ fileName }}</div>
            <div class="pr-tip" v-if="destroy">{{ '上传失败' }}</div>
            <div class="pr-tip" v-else>{{ progress < 100 ? '正在上传' : size }}</div>
        </section>
        <section class="pr-container">
            <div v-if="type === 'application/x-zip-compressed'">
                <img v-if="progress < 100" src="../assets/uploadingZipFile.png" alt="uploadingZipFile" width="49">
                <img v-if="progress >= 100" src="../assets/uploadedZipFile.png" alt="uploadingZipFile" width="49">
            </div>
            <div v-else>    
                <img v-if="progress < 100" src="../assets/uploadingFile.png" alt="uploadingZipFile" width="49">
                <img v-if="progress >= 100" src="../assets/uploadedFile.png" alt="uploadingZipFile" width="49">
            </div>
            <div class="progress" v-if="progress < 100">
                <el-progress type="circle" :percentage="progress || 0" color="#fff" :stroke-width="2" :width="22">
                    <template #default="{ percentage }">
                        <div v-if="percentage" class="pr-text">
                            <img src="../assets/startUpload.png" alt="uploadingZipFile" width="6">
                        </div>
                    </template>
                </el-progress>
            </div>
        </section>
    </div>
</template>

<script setup>
// import { InfoFilled } from '@element-plus/icons-vue'
import download from '@/utils/download.js'
// import ContextMenu from '@imengyu/vue3-context-menu'
import menu from '@/utils/contextMenu.js'
import { defineEmits, ref, watch } from 'vue'
import { api } from '@/utils/api'
// import { ElNotification } from 'element-plus'
// eslint-disable-next-line no-undef
const props = defineProps({
    progress: Number,
    type: String,
    fileName: String,
    size: String,
    response: String,
    dataIndex: Number,
    user: Number,
    destroy: String
})
const downloadProgress = ref(null)

watch(() => downloadProgress.value, (val) => {
    if (val >= 100) {
        downloadProgress.value = null
    }
})
const emit = defineEmits(['withdraw','deleted', 'quote'])

const items = [
    { 
        label: "下载到本地", 
        onClick: () => {
            // const token = sessionStorage.getItem('Token')
            const url = `${api.source}/${props.response}`
            download(url, props.fileName, function(err, progress) {
                if (err) downloadProgress.value = null
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

function onContextMenu(e) {
    const menuList = [...items]
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

<!-- 样式部分 -->
<style lang="scss" scoped>
.pr {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 250px;
    position: relative;
}

.pr-container {
    position: relative;
}

.pr-text {
    width: 22px;
    line-height: 0px;
}

.progress {
    position: absolute;
    top: 12px;
    left: 12px;

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

.pr-message {
    font-size: 14px;
    color: #333333;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
}

.pr-tip {
    font-size: 12px;
    box-sizing: border-box;
    padding-top: 7px;
    color: #999999;
}

.pr-word {
    width: inherit;
    overflow: hidden;
    word-wrap: break-word;
}
.download-progress {
    position: absolute;
    top: 50%;
    left: -12%;
    :deep .el-progress path:first-child {
        // 修改进度条背景色 
        stroke: rgb(31, 31, 31);
    }
    :deep .el-progress__text {
        display: none;
    }
}

.other-progress {
    left: auto;
    right: -12%;
}
</style>