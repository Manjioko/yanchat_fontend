<template>
    <!-- 退出弹窗 -->
    <div>
        <el-dialog v-model="dShow" width="30%" center>
            <!-- <div>
                
            </div> -->
            <div class="avatar">
                <div class="avatar-container">
                    <img :src="getAavatar()" alt="头像" class="avatar-show">
                    <div class="avatar-edit">
                        <img src="../assets/avatar_edit.png" alt="">
                        <input type="file" name="上传头像" id="avatar" @change="uploadAvatar">
                    </div>
                </div>
            </div>
            <div class="nick">
                <div class="nick-title">修改昵称：</div>
                <div class="nick-input">
                    <el-input v-model="nickName">
                        <template #suffix>
                            <span class="save-text" @click="saveNickName">保存</span>
                        </template>
                    </el-input>
                </div>
            </div>
            <div class="exit-login" @click="handleExit">
                <div>退出登录</div>
            </div>
        </el-dialog>
    </div>
</template>
<script setup>
import { defineProps, ref, defineExpose, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
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
    // console.log('url -> ', process.env.VUE_APP_AVATAR)
    const [err, res] = await to(window.$axios({
        method: 'post',
        url: process.env.VUE_APP_AVATAR,
        data: formData
    }))

    if (err) {
        // console.log('上传头像失败 -> ', err)
        ElMessage.error('上传头像成功！')
        return
    }

    if (res.status === 200) {
        ElMessage({
            message: '修改用户头像成功',
            type: 'success',
        })
    }
    console.log('res -> ', res)
}

// 获取头像
function getAavatar() {
    const user_id = sessionStorage.getItem('user_id')
    return `${process.env.VUE_APP_BASE_URL}/avatar/avatar_${user_id}.jpg`
}

// 保存昵称
const nickName = ref('')
async function saveNickName() {
    const user_info = JSON.parse(sessionStorage.getItem('user_info'))
    console.log('user_info -> ', user_info)
    if (!nickName.value) return console.log('昵称为空')
    const [err, res] = await to(window.$axios({
        method: 'post',
        url: process.env.VUE_APP_CHANGENICK,
        data: {
            nick_name: nickName.value,
            phone_number: user_info.phone_number
        }
    }))
    if (err) {
        ElMessage.error('修改昵称失败')
        return
    }
    if (res.status === 200 && res.data !== 'err') {
        nickName.value = ''
        ElMessage({
            message: '昵称修改成功',
            type: 'success',
        })
        
    }
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
.avatar {
    display: flex;
    align-items: center;
    justify-content: center;
}
.avatar-show {
    width: 45px;
    height: 45px;
    border-radius: 50%;
}
.avatar-container {
    position: relative;
}
.avatar-edit {
    width: 33px;
    position: absolute;
    bottom: -5px;
    left: 25px;
    // cursor: pointer;
    img {
        width: 33px;
    }
    input {
        width: 33px;
        position: absolute;
        bottom: 10px;
        right: 0;
        opacity: 0;
    }
}
.nick-title {
    font-weight: 600;
    margin-bottom: 5px;
    font-size: 12px;
}
.save-text {
    color: #2F88FF;
    font-size: 12px;
}

.exit-login {
    box-sizing: border-box;
    padding: 10px;
    width: 100%;
    background: #F2F2F2;
    text-align: center;
    margin-top: 25px;
    border-radius: 5px;
    font-size: 12px;
    cursor: pointer;
}

</style>