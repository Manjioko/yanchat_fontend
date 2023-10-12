<!-- 结构部分 -->
<template>
    <div class="pr" @contextmenu.prevent="onContextMenu" data-menu-file>
        <section class="pr-word">
            <div class="pr-message">{{ fileName }}</div>
            <div class="pr-tip">{{ progress < 100 ? '正在上传' : size }}</div>
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
import ContextMenu from '@imengyu/vue3-context-menu'
// eslint-disable-next-line no-undef
const props = defineProps({
    progress: Number,
    type: String,
    fileName: String,
    size: String,
    response: String
})

// const confirmEvent = () => {
//     const url = process.env.VUE_APP_FILE.replace(/(.+\/).+/, (m, v) => v) + props.response
//     download(url, props.fileName)
// }
// const cancelEvent = () => {
//     console.log('cancel!')
// }

function ptDefault(e) {
    e.preventDefault()
}
// 右键菜单
function onContextMenu(e) {
  //prevent the browser's default menu
  e.preventDefault();
  //show your menu
  ContextMenu.showContextMenu({
    x: e.x,
    y: e.y,
    theme: 'flat',
    items: [
      { 
        label: "下载到本地", 
        onClick: () => {
            const url = process.env.VUE_APP_FILE.replace(/(.+\/).+/, (m, v) => v) + props.response
            download(url, props.fileName)
        }
      },
    //   { 
    //     label: "A submenu", 
    //     children: [
    //       { label: "Item1" },
    //       { label: "Item2" },
    //       { label: "Item3" },
    //     ]
    //   },
    ]
  })
  document.getElementsByClassName('mx-context-menu')[0].removeEventListener('contextmenu', ptDefault)
  document.getElementsByClassName('mx-context-menu')[0].addEventListener('contextmenu', ptDefault)
}

</script>

<!-- 样式部分 -->
<style lang="scss" scoped>
.pr {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 250px;
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
</style>