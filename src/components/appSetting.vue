<template>
    <!-- 退出弹窗 -->
    <div>
        <el-dialog v-model="dShow" width="350px" center>
            <div class="avatar">
                <div class="avatar-container">
                    <img :src="avatarSrc" alt="头像" class="avatar-show">
                    <div class="avatar-edit">
                        <img src="../assets/avatar_edit.png" alt="">
                        <input
                            type="file"
                            name="上传头像"
                            id="avatar"
                            accept="image/*"
                            @change="uploadAvatar"
                        >
                    </div>
                </div>
            </div>
            <div class="nick">
                <div class="nick-title">修改昵称:</div>
                <div class="nick-input">
                    <el-input :placeholder="placeholder" v-model="nickName">
                        <template #suffix>
                            <span class="save-text" @click="saveNickName">保存</span>
                        </template>
                    </el-input>
                </div>
            </div>
            <div class="markdown">
                <div class="nick-title markdown-title">是否使用Markdown:</div>
                <div class="m-sel">
                    <el-select v-model="isMarkdown" placeholder="Select">
                        <el-option
                        v-for="item in changeMarkdownList"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                        />
                    </el-select>
                </div>
            </div>
            <div class="exit-login" @click="handleExit">
                <div>退出登录</div>
            </div>
        </el-dialog>
    </div>
</template>
<script setup>
import { defineProps, ref, defineExpose, defineEmits, watchEffect } from 'vue'
import { ElMessage } from 'element-plus'
import to from 'await-to-js'
defineProps({
    websocket: Object,
})
const emit = defineEmits([
    'exit',
    'avaterChange',
    'nickNameChange',
    'isUseMarkdown'
])

let dShow =  ref(false)
const user_id = sessionStorage.getItem('user_id')
const user_info = JSON.parse(sessionStorage.getItem('user_info'))

const changeMarkdownList = [
    { label: '是', value: true },
    { label: '否', value: false },
]
const isUseMd = sessionStorage.getItem('is_use_md') || user_info.is_use_md
// console.log('isUseMd -> ', isUseMd)
const isMarkdown = ref(isUseMd === 'true' || isUseMd === '1' ? true : false)
watchEffect(async () => {
    if (isMarkdown.value !== undefined) {
        // console.log('changed markdown -> ', isMarkdown.value)
        const [err] = await to(window.$axios({
            method: 'post',
            url: process.env.VUE_APP_MD,
            data: {
                user_id: user_info.user_id,
                is_use_md: isMarkdown.value
            }
        }))
        if (err) {
            ElMessage.error('操作失败!')
        } else {
            sessionStorage.setItem('is_use_md', isMarkdown.value.toString())
            emit('isUseMarkdown', isMarkdown.value)
        }
    }
})

const placeholder = ref(user_info.user)
const avatarSrc = ref(`${process.env.VUE_APP_BASE_URL}/avatar/avatar_${user_id}.jpg?t=${new Date().getTime()}`)
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
        ElMessage.error('上传头像失败！')
        return
    }

    if (res.status === 200) {
        ElMessage({
            message: '修改用户头像成功',
            type: 'success',
        })
        avatarSrc.value = `${process.env.VUE_APP_BASE_URL}/avatar/avatar_${user_id}.jpg?t=${new Date().getTime()}`
        emit('avaterChange', avatarSrc.value)
    }
    console.log('res -> ', res)
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
        ElMessage({
            message: '昵称修改成功',
            type: 'success',
        })
        placeholder.value = nickName.value
        nickName.value = ''
        const [err, res] = await to(window.$axios({
            method: 'post',
            url: process.env.VUE_APP_GETFRIENDS,
            data: {
                user_id: user_id,
                get_user_info: true
            }
        }))
        if (err) return

        emit('nickNameChange', res.data)
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
    cursor: pointer;
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

.markdown-title {
    margin-top: 13px;
}
.m-sel {
    :deep .el-select {
        width: 100%;
    }
    :deep .el-input__wrapper {
        display: flex;
        padding: 4px 11px;
    }
}
</style>