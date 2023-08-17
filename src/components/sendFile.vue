<script setup>
import { defineProps } from 'vue'
defineProps({
    progress: Number,
    type: String,
    fileName: String,
    size: String
})


</script>

<!-- 结构部分 -->
<template>
    <div class="pr">
        <section class="pr-word">
            <div class="pr-message">{{ fileName }}</div>
            <div class="pr-tip">{{ progress < 100 ? '正在上传' : size }}</div>
        </section>
        <section class="pr-container">
            <div v-if="type === 'zip'">
                <img v-if="progress < 100" src="../assets/uploadingZipFile.png" alt="uploadingZipFile" width="49">
                <img v-if="progress >= 100" src="../assets/uploadedZipFile.png" alt="uploadingZipFile" width="49">
            </div>
            <div v-else>
                <img v-if="progress < 100" src="../assets/uploadingFile.png" alt="uploadingZipFile" width="49">
                <img v-if="progress >= 100" src="../assets/uploadedFile.png" alt="uploadingZipFile" width="49">
            </div>
            <div class="progress" v-if="progress < 100" >
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
        ::v-deep .el-progress path:first-child { // 修改进度条背景色 
           stroke: hsla(43, 28%, 65%, 1); 
       }
        //    /deep/ .el-progress__text { // 修改进度条文字提示颜色
        //        color: #00C7FD; 
        //    }
   }
   .pr-message {
        font-size: 18px;
        color: #333333;
   }
   .pr-tip {
        font-size: 14px;
        box-sizing: border-box;
        padding-top: 12px;
        color: #999999;
    }
</style>