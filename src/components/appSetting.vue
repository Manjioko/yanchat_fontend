<template>
    <!-- 退出弹窗 -->
    <div>
        <el-dialog v-model="dShow" width="30%" center>
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
import { defineProps, ref, defineExpose } from 'vue'
import router from '@/router/router'
import { WarningFilled } from '@element-plus/icons-vue'
const props = defineProps({
    websocket: Object,
})
let dShow =  ref(false)
defineExpose({
    showDialog
})

function showDialog(isShow) {
    dShow.value = isShow
}

// 处理退出登录
function handleExit() {
    props.websocket?.value?.close(4001, '退出登录')
    sessionStorage.clear('user_info')
    dShow = false
    router.go(-1)
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