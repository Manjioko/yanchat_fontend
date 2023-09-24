<template>
    <div class="container">
        <header class="f-header">
            <div :class="{ isOnlink: signal === 1, isUnlink: signal !== 1 }"></div>
            <img :src="avatarSrc" alt="avatar" class="avatar-img">
            <el-input
                class="w-50 m-2"
                placeholder="搜索"
                :prefix-icon="Search"
                v-model="searchText"
            />
            <div>
                <span class="i-plus" @click="dShow = true">+</span>
            </div>
        </header>
        <main class="f-container">
            <section
                v-for="(i, idx) in friendsList"
                v-show="i.searchActive"
                class="f-friends"
                :key="i.id"
                :class="{'i-active': i.active}"
                @click="handleSelect(idx, i)"
            >
                <div class="unread-dot" v-if="showUnread(chatDataOb[i.to_table])">
                    {{ handleUnreadDotNum(chatDataOb[i.to_table]) }}
                </div>
                <img
                    class="i-img"
                    :src="i.avatar"
                    alt="avatar"
                >
                <div class="i-text">
                    <div class="i-name">{{ i.name }}</div>
                    <div class="i-msg">{{ handleUnreadMsg(chatDataOb[i.to_table]) || i.message }}</div>
                </div>
                <div class="i-time">{{ handleShowTime(chatDataOb[i.to_table]) || i.time }}</div>
            </section>
        </main>
    </div>

    <div>
        <el-dialog
            v-model="dShow"
            title="添加好友"
            width="30%"
            :modal="false"
            :close-on-click-modal="false"
            :show-close="false"
            :append-to-body="true"
            draggable
            style="border-radius: 8px;text-align: center;"
        >
            <div class="d-text">
                <el-input
                    placeholder="输入好友手机号码"
                    v-model="friend_phone_number"
                />
                <div v-if="missFri" class="miss-fri">添加的好友不存在。</div>
                <div v-if="repFri" class="miss-fri">重复添加好友。</div>
            </div>
            <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleClose">取消</el-button>
                <el-button type="primary" @click="addFriend">
                确定
                </el-button>
            </span>
            </template>
        </el-dialog>
    </div>
</template>
<script setup>
import { ref, defineProps, onMounted, defineEmits, watch } from 'vue';
import { Search } from '@element-plus/icons-vue'
import antiShake from '@/utils/antiShake'
import to from 'await-to-js'
const props = defineProps({
    friends: String,
    newChatData: Object,
    signal: Number,
    avatarRefresh: String
})
const emit = defineEmits(['handleActiveFriend'])

const friendsList = ref([
    // {
    //     name: '银河队长',
    //     id: '13445',
    //     time: '22:12',
    //     message: '我已经毁灭半人马星座了，勿 call',
    //     avatar: require('../assets/avatar2.png'),
    //     active: false
    // },
])

// 用户信息
const user_info = JSON.parse(sessionStorage.getItem('user_info'))
const user_id = sessionStorage.getItem('user_id')
const avatarSrc = ref(`${process.env.VUE_APP_BASE_URL}/avatar/avatar_${user_id}.jpg`)
watch(() => props.avatarRefresh, (val) => {
    avatarSrc.value = val
})

onMounted(() => {
    if (!props.friends) return
    const f = JSON.parse(props.friends)
    // console.log('f -> ', f)
    f?.forEach(item => {
        friendsList.value.push({
            name: item.user,
            id: item.user_id,
            time: '',
            message: '',
            avatar: `${process.env.VUE_APP_BASE_URL}/avatar/avatar_${item.user_id}.jpg`,
            active: false,
            searchActive: true,
            to_table: item.chat_table
        })
    })
})

let dShow = ref(false)
const oldIdx = ref(null)
function handleSelect(idx, row) {
    // console.log(idx, row.to_table)
    friendsList.value.forEach((item, i) => {
        if (i === idx) {
            item.active = true
            // 重复点击同一个对象时,只发送一次 handleActiveFriend
            if (idx !== oldIdx.value) {
                emit('handleActiveFriend', item)
            }
            oldIdx.value = idx
            return
        }

        item.active = false
    })
    if (!row.to_table) return
    // console.log(' chatDataOb.value -> ', chatDataOb.value)
    chatDataOb.value[row.to_table]?.forEach(item => {
        if (item?.unread !== undefined) item.unread = 0
    })
}

// 添加好友功能
const friend_phone_number = ref('')
const missFri = ref(false)
const repFri = ref(false)
let delayToShowErr = antiShake(() => {
    missFri.value = true
}, 200)
let delayToShowRepeatErr = antiShake(() => {
    repFri.value = true
}, 200)
async function addFriend() {
    if (!friend_phone_number.value) {
        return
    }
    let phone_number = user_info.phone_number
    const [err, res] = await to(window.$axios({
        method: 'post',
        url: process.env.VUE_APP_ADDFRI,
        data: {
            phone_number: phone_number,
            friend_phone_number: friend_phone_number.value
        }
    }))
    if (err) {
        console.log('添加好友错误: ', err)
        return
    }
    console.log('好友请求回来了 -> ', res, res?.data)
    if (res.data === 'miss') {
        missFri.value = false
        delayToShowErr()
    } else {
        missFri.value = false
    }

    if (res.data === 'exist') {
        repFri.value = false
        delayToShowRepeatErr()
    } else {
        repFri.value = false
    }
    // 返回错误
    if (!res?.data?.friends) return

    friendsList.value.length = 0
    res.data.friends.forEach(item => {
        friendsList.value.push({
            name: item.user,
            id: item.user_id,
            time: '',
            message: '',
            avatar:  `${process.env.VUE_APP_BASE_URL}/avatar/avatar_${item.user_id}.jpg`,
            active: false,
            searchActive: true,
            to_table: item.chat_table
        })
    })
    const getUserInfo = JSON.parse(sessionStorage.getItem('user_info'))
    getUserInfo.friends = JSON.stringify(res.data.friends)
    sessionStorage.setItem('user_info', JSON.stringify(getUserInfo))
    dShow.value = false
}

// 从服务器拉取未读信息
const userInfo = ref(JSON.parse(sessionStorage.getItem('user_info')))
let chatDataOb = ref({})
watch(chatDataOb, (val) => {
    sessionStorage.setItem('chatDataOb', JSON.stringify(val))
},
{ deep: true })
onMounted(() => {
    handleUnread()
})
watch(() => props.newChatData, (ob) => {
    const { unread, chat } = ob
    if (!chat) return
    // console.log('提示对象 -> ', chat)
    if (!Array.isArray(chatDataOb.value[chat.to_table])) {
        chatDataOb.value[chat.to_table] = []
        chatDataOb.value[chat.to_table].push({
            unread,
            chat: JSON.stringify(chat)
        })
        return
    }
    chatDataOb.value[chat.to_table].push({
        unread,
        chat: JSON.stringify(chat)
    })
})

// 处理未读信息
async function handleUnread() {
    const c = sessionStorage.getItem('chatDataOb')
    if (c) {
        chatDataOb.value = JSON.parse(c)
        return
    }
    const flist = JSON.parse(userInfo.value.friends)
    const [err, unRead] = await to(window.$axios({
        method: 'post',
        url: process.env.VUE_APP_UNREAD,
        data: {
            friends: flist?.map(i => i.chat_table),
            user_id: userInfo.value.user_id
        }
    }))
    if (err) {
        console.log('处理未读消息错误：', err)
        return
    }
    // console.log('unread -> ', unRead)
    if (unRead.status !== 200) return
    if (unRead.data === 'err') return
    chatDataOb.value = unRead.data
}

// 处理未读信息
function handleUnreadMsg(unreadAry) {
    if (!Array.isArray(unreadAry)) return
    
    const len = unreadAry?.length
    if (!len || len <= 0) return
    // console.log('time -> ', JSON.parse(unreadAry[len - 1]?.chat ?? '{}'))
    return JSON.parse(unreadAry[len - 1]?.chat ?? '{}').text
}

// 处理时间
function handleShowTime(unreadAry) {
    if (!Array.isArray(unreadAry)) return
    
    const len = unreadAry?.length
    if (!len || len <= 0) return
    // console.log('time -> ', JSON.parse(unreadAry[len - 1]?.chat ?? '{}'))
    return JSON.parse(unreadAry[len - 1]?.chat ?? '{}').time?.slice(10, -3)
}
// 处理是否显示未读信息
function showUnread(ary) {
    if (!Array.isArray(ary)) return
    const len = ary.length
    if (!len) return
    const last = ary[ary.length - 1]
    
    return last?.unread ??  0
}

// 处理未读数目
function handleUnreadDotNum(ary) {
    if (!Array.isArray(ary)) return
    const fdata = ary?.filter(i => i?.unread)
    return fdata.length
}

// 关闭添加好友框
function handleClose() {
    missFri.value = false
    repFri.value = false
    friend_phone_number.value = ''
    dShow.value = false
}

// 搜索好友
const searchText = ref('')
const shake = antiShake(() => {
    console.log('friends filter -> ', searchText.value)
    const reg = new RegExp(`${searchText.value}`, 'ig')

    // 筛选好友，如果没有筛选中任意一个，就显示全部
    const fl = friendsList.value.filter(f => reg.test(f.name))
    friendsList.value.forEach(f => {
        if (!fl.length) {
            f.searchActive = false
            return
        }
        if (fl.includes(f)) {
            f.searchActive = true
        } else {
            f.searchActive = false
        }
        
    })
}, 1000)
watch(searchText, shake)

</script>
<style lang="scss" scoped>
    .container {
        display: flex;
        flex-direction: column;
        background-color: #fff;
        height: 92vh;
        width: 260px;
        border-right: 2px solid #F5F6FA;
        border-radius: 5px 0px 0px 5px;
        
    }
    .f-header {
        display: flex;
        box-sizing: border-box;
        padding: 20px 10px;
        align-items: center;
        background-color: #F5F6FA;
        justify-content: center;
        border-top-left-radius: 5px;
        position: relative;

        :deep .el-input__wrapper {
            box-shadow: none;
        }
        :deep .el-input__inner {
            font-size: 12px;
        }
    }
    .i-plus {
        width: 26px;
        height: 26px;
        display: block;
        text-align: center;
        line-height: 26px;
        background: #fff;
        margin-left: 10px;
        border-radius: 3px;
        font-size: 18px;
        color: #B0AFB4;
        cursor: pointer;
    }
    .w-50.m-2 {
        height: 26px;
    }
    .f-friends {
        display: flex;
        align-items: center;
        box-sizing: border-box;
        padding: 10px 20px;
        border-bottom: 1px solid #F5F6FA;
        position: relative;
    }
    .i-img {
        width: 35px;
        height: 35px;
        border-radius: 50%;
    }
    .i-text {
        margin-left: 15px;
        flex: 1;
    }
    .i-name {
        font-size: 14px;
        color: #333333;
        width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .i-msg {
        font-size: 12px;
        color: #999999;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 140px;
        min-height: 16px;
        margin-top: 8px;
    }
    .i-time {
        font-size: 12px;
        color: #999999;
    }
    .i-active {
        background-color: #E8F2FF;;
    }
    .unread-dot {
        width: 15px;
        height: 15px;
        border-radius: 50%;
        background-color: red;
        position: absolute;
        color: #fff;
        font-size: 12px;
        text-align: center;
        line-height: 15px;
        top: 13px;
        left: 45px;
    }
    .miss-fri {
        font-size: 12px;
        padding: 10px 0;
        color: #ff6767;
        position: absolute;
        right: 27px;
    }
    :deep .el-dialog {
        border-radius: 8px;
    }
    .isOnlink {
        width: 7px;
        height: 7px;
        background: #00daff;
        border-radius: 50%;
        position: absolute;
        top: 20px;
        left: 35px;
    }

    .isUnlink {
        width: 7px;
        height: 7px;
        background: red;
        border-radius: 50%;
        position: absolute;
        top: 20px;
        left: 35px;
    }
    .avatar-img {
        width: 35px;
        height: 35px;
        border-radius: 50%;
        margin-right: 12px;
    }
</style>