<template>
    <!-- 退出弹窗 -->
    <div>
        <el-dialog v-model="dShow" width="30%" center>
            <div>
                <input type="file" name="上传头像" id="avatar" @change="uploadAvatar">
            </div>
            <div class="d-text">
                <div>
                    <WarningFilled style="width: 2rem; height: 2rem; padding: 10px; color: red;" />
                </div>
                <div class="d-tip">是否退出登录？</div>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dShow = false">取消</el-button>
                    <el-button type="primary" @click="handleExit">
                        确定
                    </el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>
<script setup>
import { defineProps, ref, defineExpose, defineEmits } from 'vue'
import { WarningFilled } from '@element-plus/icons-vue'
import to from 'await-to-js'
defineProps({
    websocket: Object,
})
const emit = defineEmits([
    'exit'
])
let dShow =  ref(false)
defineExpose({
    showDialog
})

function showDialog(isShow) {
    dShow.value = isShow
}

// 处理退出登录
function handleExit() {
    emit('exit')
    dShow = false
}

// 上传头像
async function uploadAvatar(e) {
    const formData = new FormData()
    const user_id = sessionStorage.getItem('user_id')
    formData.append('user_id', user_id)
    formData.append("avatar", e.target.files[0])
    console.log('url -> ', process.env.VUE_APP_AVATAR)
    const [err, res] = await to(window.$axios({
        method: 'post',
        url: process.env.VUE_APP_AVATAR,
        data: formData
    }))

    if (err) {
        console.log('上传头像失败 -> ', err)
        return
    }

    console.log('res -> ', res)
}
</script>
<style lang="scss" scoped>

.d-text {
    display: flex;
    align-items: center;
    justify-content: center;
}

.d-tip {
    font-size: 16px;
    font-weight: 500;
}

:deep .el-dialog__footer {
    text-align: end;
}
    
</style>