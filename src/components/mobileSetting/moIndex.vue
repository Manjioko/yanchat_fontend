<template>
    <!-- <div>手机设置</div> -->
     <div class="m-container">
        <div class="mobile-header">
            <!-- <div :class="{ isOnlink: signal === 1, isUnlink: signal !== 1 }"></div> -->
            <div class="avatar">
                <div :class="{ isOnlink: signal === 1, isUnlink: signal !== 1 }"></div>
                <img
                    :src="avatarSrc"
                    alt="avatar"
                    class="avatar-img"
                    @error="handleAvatarSelfErr"
                />
            </div>

            <div class="user-info">
                <div class="user-name">
                    {{ userInfo.user }}
                </div>
                <div class="user-phone">
                    <span>手机号:</span>
                    {{ userInfo.phone_number }}
                </div>
            </div>

            <div class="avatar-edit">
                <!-- <img src="../../assets/avatar_edit.png" alt=""> -->
                <!-- <el-icon><Picture /></el-icon> -->
                <el-icon><EditPen /></el-icon>
                <input
                    type="file"
                    name="上传头像"
                    id="avatar"
                    accept="image/*"
                    @change="uploadAvatar"
                >
            </div>
        </div>

        <div class="line" @click="handleEditNick">
            <span class="line-text">昵称设置</span>
            <el-icon size="16">
                <ArrowRight />
            </el-icon>
        </div>

        <div class="line" @click="handleEditMd">
            <span class="line-text">Markdown 设置</span>
            <el-icon size="16">
                <ArrowRight />
            </el-icon>
        </div>

        <div class="line" @click="handleEditMsg">
            <span class="line-text" style="flex: unset;">消息</span>
            <div style="flex: 1;" class="tip-box">
                <div v-if="tipNumber" class="tip-number">
                    {{ tipNumber > 99 ? '99+' : tipNumber }}
                </div>
            </div>
            
            <el-icon size="16">
                <ArrowRight />
            </el-icon>
        </div>

        <div class="exit-login" @click="handleExit">
            <div>退出登录</div>
        </div>
     </div>
</template>

<script setup lang="ts">
import { MainStore } from '@/view/Main/store'
const mainStore = MainStore()
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { FriendsListStore } from '@/components/friendsList/store'
import { clearUserInfo } from '@/view/Main/Methods/userInfoOperator'
import { ResetPinia } from '@/utils/resetAllPiniaStore'
import router from '@/router/router'
import { ArrowRight, EditPen } from '@element-plus/icons-vue'
import * as API from '../appSetting/api'
import to from 'await-to-js'
import { getAvatarImage } from '@/utils/thumbnail'
import { ElMessage } from 'element-plus'
import { AppSettingStore } from '../appSetting/store'
import { dbReadAll } from '@/view/Main/Methods/indexDB'
import { ChatWindowStore } from '../chatWindow/store'
const chatWindowStore = ChatWindowStore()
const { tips } = storeToRefs(chatWindowStore)

const { signal, ws: websocket,dbname:dbName   } = storeToRefs(mainStore)
// const { ws: websocket,  isUseMd } = storeToRefs(MainStore())
const friendsListStore = FriendsListStore()
const { userInfo } = storeToRefs(friendsListStore)
const store = AppSettingStore()

const user_id = sessionStorage.getItem('user_id')
const baseUrl = sessionStorage.getItem('baseUrl')

const avatarSrc = ref(`${baseUrl}/avatar/avatar_${user_id}.jpg`)

console.log('userInfo -> ', userInfo.value)

function handleAvatarSelfErr() {
  avatarSrc.value = require('../../assets/default_avatar.png')
}


// 处理退出登录
function handleExit() {
    if (websocket.value) {
        const ws = websocket.value as WebSocket
        ws.close(4001, '客户端关闭链接')
    }
    clearUserInfo()
    const storeObject = ResetPinia()
    storeObject.all()
    router.replace('/login')
}

// 上传头像
async function uploadAvatar(e: Event) {
    if (!e.target) return
    const formData = new FormData()
    const user_id = sessionStorage.getItem('user_id') || ''
    formData.append('user_id', user_id)
    const target = e.target as HTMLInputElement
    if (!target.files?.[0]) return
    const handledFile = await getAvatarImage(window.URL.createObjectURL(target.files[0]))
    console.log('文件是什么 -> ', handledFile)
    if (!handledFile) return
    formData.append("avatar", handledFile || '')
    const [err, res] = await to(API.getAvatar(formData))

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
        const baseUrl = sessionStorage.getItem('baseUrl') || ''
        avatarSrc.value = `${baseUrl}/avatar/avatar_${user_id}.jpg?t=${new Date().getTime()}`
        console.log(' avatarSrc.value -> ', avatarSrc.value)
        store.avatarRefresh = avatarSrc.value
    }
    console.log('res -> ', res)
}


function handleEditNick() {
    router.replace('/nick')
}

function handleEditMd() {
    router.replace('/md')
}

function handleEditMsg() {
    router.replace('/msg')
}


// 查看消息数量
const tipNumber = ref(0)
function showTips() {
    console.log('查看消息数量')
    dbReadAll('tips_messages')
        .then((res: any) => {
            let ary = []
            res?.forEach((item: Tips) => {
                if (item.messages_type === 'addFriend') {
                    ary.push(item)
                }
            })
            tipNumber.value = ary.length
        })
        .catch((err: string) => {
            console.log('读取 tips_messages 数据库失败 -> ', err)
        })
}
watch(() => dbName.value, (val) => {
    if (val) {
        showTips()
    }
})


watch(() => tips.value, () => {
    showTips()
})
</script>

<style scoped lang="scss">

.m-container {
    background: #f4f4f4;
    height: 100%;
}

.mobile-header {
    position: relative;
    width: 100%;
    height: 140px;
    background: #fff;
    display: flex;
    align-items: center;
    padding-left: 10%;
}

.isOnlink {
  width: 16px;
  height: 16px;
  background: #00daff;
  border-radius: 50%;
  position: absolute;
  top: -8px;
  right: -8px;
}
.avatar {
    position: relative;
    .avatar-img {
        width: 60px;
        border-radius: 8px;
    }
}

.user-info {
    margin-left: 20px;
    margin-right: 20px;
    .user-name {
        font-size: 20px;
        font-weight: 600;
    }
    .user-phone {
        font-size: 16px;
        margin-top: 8px;
        color: #999999;
    }
}


.exit-login {
    box-sizing: border-box;
    padding: 16px;
    font-size: 16px;
    color: red;
    /* width: 100%; */
    background: #fff;
    text-align: center;
    /* margin-top: 25px; */
    /* border-radius: 5px; */
    /* font-size: 12px; */
    cursor: pointer;
    margin: 16px 16px;
    border-radius: 8px;
    box-shadow: 1px 1px 3px #ddd;
}

.line {
    background: #fff;
    margin-top: 16px;
    padding: 16px;
    display: flex;
    font-size: 16px;
    color: #a1a1a1;
    align-items: center;
    margin: 16px 16px;
    border-radius: 8px;
    box-shadow: 1px 1px 3px #ddd;
}
.line-text {
    flex: 1;
}

.avatar-edit {
    width: 33px;
    position: relative;
    bottom: -5px;
    left: 25px;
    -webkit-tap-highlight-color: transparent;
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

.tip-number {
    width: 24px;
    height: 24px;
    background: red;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: #fff;
    font-size: 12px;
}

.tip-box {
    margin-left: 8px;
}

</style>