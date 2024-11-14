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
import { ref } from 'vue'
import { FriendsListStore } from '@/components/friendsList/store'
import { clearUserInfo } from '@/view/Main/Methods/userInfoOperator'
import { ResetPinia } from '@/utils/resetAllPiniaStore'
import router from '@/router/router'

const { signal, ws: websocket,   } = storeToRefs(mainStore)
// const { ws: websocket,  isUseMd } = storeToRefs(MainStore())
const friendsListStore = FriendsListStore()
const { userInfo } = storeToRefs(friendsListStore)

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
</script>

<style scoped>

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
    width: 100%;
    background: #fff;
    text-align: center;
    margin-top: 25px;
    border-radius: 5px;
    /* font-size: 12px; */
    cursor: pointer;
}

</style>