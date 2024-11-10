<template>
    <main class="main" @contextmenu.prevent>
        <friendsList />
        <section class="chat-window">
            <section class="text-top">
                <div class="avatar" v-if="activeFriend">
                    <span>{{ activeFriend.name }}</span>
                    <span v-if="signal === 0" class="reconnect">{{'正在重连中...'}}</span>
                    <span v-if="signal === 2" class="disconnect">{{'已经断线,请检测网络环境是否可用'}}</span>
                </div>
                <div class="default-avatar" v-else>
                    <div style="width: 100%; height: 40px">
                        <span v-if="signal === 0" class="reconnect">{{'正在重连中...'}}</span>
                        <span v-if="signal === 2" class="disconnect">{{'已经断线,请检测网络环境是否可用'}}</span>
                    </div>
                </div>
                <img src="../../assets/setting.png" alt="setting" @click="showSettingDialog" />
                <!-- <el-badge is-dot class="badge-item">
                    <el-icon :size="20" style="margin-left: 10px;"><ChatSquare @click="handleTips" /></el-icon>
                </el-badge> -->
                <tipsMessages />
                <el-icon v-show="activeFriend?.chat_table" style="vertical-align: middle; margin-left: 8px" :size="18">
                    <Search @click="searchText?.showSearch" />
                </el-icon>
                <!-- <div class="full-screen" @click="handleFullScreen">全屏模式</div> -->
                <el-icon :class="fullScreen ? 'full-screen' : ''" style="vertical-align: middle; margin-left: 8px" :size="18" >
                    <FullScreen @click="handleFullScreen" />
                </el-icon>
            </section>
            <ChatWindow v-if="activeFriend.chat_table" />
            <section class="zero-friend" v-else>还未选择聊天好友</section>
            <section style="position: relative">
                <comentQuote v-if="showQuote" :show-input-quote="true" />
                <SendFoot v-if="activeFriend.chat_table" />
            </section>
        </section>
        <SearchText ref="searchText" />
        
    </main>
    <AppSetting ref="appSetting" />
    <!-- 测试模式用 -->
    <!-- <videoCallOfferer v-if="activeFriend && showOfferer" :friend="activeFriend" :socket="websocket || undefined" />
    <videoCallAnwserer v-if="showAnwserer" :friend="activeFriend" :socket="websocket || undefined"/> -->
    <!-- 铃声 -->
    <!-- <audio class="audio"
        src="../assets/audio/call.mp3"
        controls
        id="audioCall"
        hidden="true"
    >
    </audio> -->
</template>

<script setup lang="ts">
import {
    ref,
    onMounted,
    onBeforeUnmount,
    nextTick,
    watch
} from 'vue'
import ChatWindow from '@/components/chatWindow/chatWindowIndex.vue'
import wsInit from '@/view/Main/Methods/ws'
import friendsList from '@/components/friendsList/friendsListIndex.vue'
import AppSetting from '@/components/appSetting/appSettingIndex.vue'
import SendFoot from '@/components/sendFoot/sendFootIndex.vue'
import to from 'await-to-js'
import * as API from './api'
import comentQuote from '@/components/comentQuote/comentQuoteIndex.vue'
// import videoCallOfferer from '@/components/VideoCallOfferer/videoCallOffererIndex.vue'
// import videoCallAnwserer from '@/components/videoCallAnwserer/videoCallAnwsererIndex.vue'
import tipsMessages from '@/components/tipsMessages/tipsMessagesIndex.vue'

// import {
//     WsConnectParams,
//     Judge,
//     Locked,
// } from '@/interface/global'
import { FootSendStore } from '@/components/sendFoot/store'
import { storeToRefs } from 'pinia'
import { MainStore } from './store'
import { FriendsListStore } from '@/components/friendsList/store'
// import { VideoCallOfferer } from '@/components/VideoCallOfferer/store'
import { getUserInfo } from './Methods/userInfoOperator'
import { ChatWindowStore } from '@/components/chatWindow/store'
import { CommentQuoteStore } from '@/components/comentQuote/store'
import { Search, FullScreen } from '@element-plus/icons-vue'
import SearchText from '@/components/searchText/searchTextIndex.vue'


const searchText = ref<InstanceType<typeof SearchText>>()


// const { showOfferer, showAnwserer } = storeToRefs(VideoCallOfferer())


// websocket 客户端
const {
    ws: websocket,
    signal,
    fullScreen,
}  = storeToRefs(MainStore())
const friendsListStore = FriendsListStore()
const { userInfo, activeFriend } = storeToRefs(friendsListStore)
const { showQuote } = storeToRefs(CommentQuoteStore())

const user_info = getUserInfo()
if (user_info) {
    userInfo.value = user_info
}


// 计时器
let refreshTokenTime: number | null | undefined = null
// const mainStore = MainStore()
const chatWindowStore = ChatWindowStore()

const footSendStore = FootSendStore()
// const { isLastChatList, scrollDownLock } = storeToRefs(mainStore)
const { isLastChatList, scrollDownLock, reloadChatData:reconnectFresh, } = storeToRefs(chatWindowStore)

watch(() => reconnectFresh.value, (val:boolean) => {
    if (val) {
        if (activeFriend?.value?.user_id) {
            handleWsReconnect()
        }
    }
})

onMounted(async () => {
    const user_id = sessionStorage.getItem('user_id')
    const wsUrl = sessionStorage.getItem('wsBaseUrl')
    const url = `${wsUrl}?user_id=${user_id}`
    const wsParams: WsConnectParams = {url}
    wsInit(wsParams)
    getRefreshToken()
})

onBeforeUnmount(() => {
    // 卸载 websocket
    try {
        if (websocket.value) {
            (websocket.value as WebSocket).close()
        }
    } catch (err) {
        console.log('卸载 websocket 出错 -> ', err)
    }
    if (refreshTokenTime) {
        clearInterval(refreshTokenTime)
    }
    friendsListStore.setActiveFriend({
        name: '',
        user_id: '',
        phone_number: '',
        chat_table: '',
        active: false,
        searchActive: false
    })
})

const chatWindowHeight = ref(92)
const chatWindowWidth = ref(60)
watch(() => fullScreen.value, val => {
    console.log('全屏状态 -> ', val)
    if (val) {
        chatWindowHeight.value = 100
        chatWindowWidth.value = 80
    } else {
        chatWindowHeight.value = 92
        chatWindowWidth.value = 60
    }
})

// 全屏
function handleFullScreen() {
    fullScreen.value = !fullScreen.value
}

// 刷新 refreshToken
function getRefreshToken() {
    const phone_number = userInfo.value.phone_number
    const user_id = userInfo.value.user_id
    refreshTokenTime = setInterval(async () => {
        const [err, res] = await to(API.A_RefreshToken({ phone_number, user_id }))
        if (!err) {
            // console.log('新 refreshToken -> ', res.data)
            sessionStorage.setItem('RefreshToken', res.data.refreshToken)
        }
    }, 1000 * 60 * 60)
}

// app 设置弹窗弹出
const appSetting = ref()
function showSettingDialog() {
    appSetting.value.showDialog(true)
}

// websocket 重连刷新
function handleWsReconnect() {
    // store.commit('footSend/setGotoBottomState', true)
    footSendStore.isShowGoToNewBtn = 'Yes'
    // 如果上锁了，就将锁解开，让它自由的获取到数据
    if (scrollDownLock.value === 'Locked') {
        scrollDownLock.value = 'UnLock'
        isLastChatList.value = 'No'
    }

    // 关掉 realoadChatData
    nextTick(() => {
        // store.commit('global/setReloadChatData', false)
        chatWindowStore.setReloadChatData(false)
    })
}
</script>

<style lang="scss" scoped>
.main {
    background-image: url('../../assets/login_bg.png');
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-color: #f5f6fa;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    user-select: none;
}

.chat-window {
    width: v-bind('chatWindowWidth + "vw"');
    height: v-bind('chatWindowHeight + "vh"');
    // min-width: 600px;
    // max-width: 700px;
    // max-height: 700px;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    border-radius: 0 5px 5px 0;
    // border-radius: 5px;
    // box-shadow: 0px 1px 6px 6px rgba(221, 223, 230, 0.31);
}

.text-top {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    padding: 12px;
    box-shadow: 0px 3px 6px 0px rgba(221, 223, 230, 0.31);
    font-family: Source Han Sans CN;
    user-select: none;

    img {
        width: 17px;
        height: 17px;
        -webkit-user-drag: none;
        cursor: pointer;
    }

    .avatar {
        flex: 1;
        display: flex;
        align-items: center;
        position: relative;

        img {
            width: 40px;
            height: 40px;
            -webkit-user-drag: none;
        }

        span {
            margin-left: 19px;
            font-size: 18px;
            color: #333333;
            user-select: text;
        }
    }
}

.showTime {
    text-align: center;
    font-size: 18px;
    color: #666666;
    box-sizing: border-box;
    font-family: Source Han Sans CN;
    padding: 10px;
}

.reconnect {
    font-size: 14px !important;
    color: #9f9f9f !important;
    margin-top: 12px !important;
}

.disconnect {
    font-size: 14px !important;
    color: #ff7373 !important;
    margin-top: 12px !important;
}

.default-avatar {
    flex: 1;
}

.zero-friend {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #999999;
    background-color: #f8f8f86e;
}

:deep .el-textarea__inner {
    box-shadow: 0 0 0 0px var(--el-input-border-color, var(--el-border-color)) inset;
    resize: none;
}
</style>

<style lang="scss">
.custom-notification-class {
    padding: 10px 0;
    align-items: center;

    .el-icon {
        width: 20%;

        .notify-img {
            width: 47px;
        }
    }

    .el-notification__group {
        flex: 1;
    }

    .custom-notification {
        display: flex;
        align-items: center;

        .custom-notification-title {
            font-size: 16px;
            font-weight: bold;
            flex: 1;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            width: 40px;
        }

        .custom-notification-box {
            // width: 100%;
            display: flex;
            flex-direction: column;
            align-items: flex-end;

            .custom-notification-button-confirm {
                display: inline-block;
                background: #0087ff;
                width: 52px;
                text-align: center;
                padding: 3px;
                // margin: 10px 0;
                margin-bottom: 10px;
                border-radius: 3px;
                box-shadow: 1px 1px 1px #ddd;
                color: #fff;
                cursor: pointer;
            }

            .custom-notification-button-cancel {
                display: inline-block;
                background: #e6e8eb;
                width: 52px;
                text-align: center;
                padding: 3px;
                // margin: 10px 0;
                border-radius: 3px;
                box-shadow: 1px 1px 1px #ddd;
                color: #303133;
                cursor: pointer;
            }
        }
    }
}

.badge-item {
    display: flex;
    align-items: center;
    justify-content: center;
}
.full-screen {
    color: #0087ff;
}
</style>
