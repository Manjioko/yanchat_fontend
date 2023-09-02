<template>
    <div class="container">
        <header class="f-header">
            <el-input
                class="w-50 m-2"
                placeholder="搜索"
                :prefix-icon="Search"
            />
            <div>
                <span class="i-plus" @click="dShow = true">+</span>
            </div>
        </header>
        <main class="f-container">
            <section class="f-friends" :class="{'i-active': i.active}" v-for="(i, idx) in friendsList" :key="i.id" @click="handleSelect(idx, i)">
                <!-- {{ unReadOb[i.to_table]}} -->
                <div class="unread-dot" v-if="showUnread(unReadOb[i.to_table])">
                    {{ handleUnreadDotNum(unReadOb[i.to_table]) }}
                    <!-- {{ unReadOb[i.to_table].value?.fliter(i => i.unread)?.length }} -->
                </div>
                <img class="i-img" :src="i.avatar_url || require('../assets/default_avatar.png')" alt="avatar">
                <div class="i-text">
                    <div class="i-name">{{ i.name }}</div>
                    <div class="i-msg">{{ i.message || handleUnreadMsg(unReadOb[i.to_table]) }}</div>
                </div>
                <div class="i-time">{{ i.time }}</div>
            </section>
        </main>
    </div>

    <div>
        <el-dialog v-model="dShow" title="添加好友" width="30%" center>
            <div class="d-text">
                <el-input
                    placeholder="输入好友手机号码"
                    v-model="friend_phone_number"
                />
            </div>
            <template #footer>
            <span class="dialog-footer">
                <el-button @click="dShow = false">取消</el-button>
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
const props = defineProps({
    friends: String,
    unReadChat: Object,
    newChatData: Object
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

onMounted(() => {
    if (!props.friends) return
    const f = JSON.parse(props.friends)
    // console.log(f)
    f?.forEach(item => {
        friendsList.value.push({
            name: item.user,
            id: item.user_id,
            time: item.created_at.slice(10, -3),
            message: '',
            avatar: item.avatar_url,
            active: false,
            to_table: item.chat_table
        })
    })
})

watch(props.unReadChat, (n) => {
    Object.keys(n).forEach(fid => {
        const friOb = friendsList.value.find(item => item.id === fid)
        console.log('friOb -> ',friOb)
        friOb.message = n[fid].text
    })
})

let dShow = ref(false)
function handleSelect(idx, row) {
    console.log(idx, row.to_table)
    friendsList.value.forEach((item, i) => {
        if (i === idx) {
            item.active = true
            emit('handleActiveFriend', item)
            // return
            return
        }

        item.active = false
    })
    if (!row.to_table) return
    row.message = handleUnreadMsg(unReadOb.value[row.to_table])
    unReadOb.value[row.to_table] = []
}
let friend_phone_number = ref('')
async function addFriend() {
    if (!friend_phone_number.value) {
        return
    }
    let phone_number = user_info.phone_number
    const res = await  window.$axios({
        method: 'post',
        url: process.env.VUE_APP_ADDFRI,
        data: {
            phone_number: phone_number,
            friend_phone_number: friend_phone_number.value
        }
    })
    console.log('请求回来了 -> ', res)

    // 返回错误
    if (!res?.data?.friends) return


    friendsList.value.length = 0
    res.data.friends.forEach(item => {
        friendsList.value.push({
            name: item.user,
            id: item.user_id,
            time: item.created_at.slice(10, -3),
            message: '',
            avatar: item.avatar_url,
            active: false,
            to_table: item.chat_table
        })
    })
    const getUserInfo = JSON.parse(sessionStorage.getItem('user_info'))
    getUserInfo.friends = JSON.stringify(res.data.friends)
    sessionStorage.setItem('user_info', JSON.stringify(getUserInfo))
    dShow.value = false
}

// 从服务器拉取未读信息
// console.log(' f -> ', userInfo)
const userInfo = ref(JSON.parse(sessionStorage.getItem('user_info')))
let unReadOb = ref({})
onMounted(() => {
    handleUnread()
})
watch(() => props.newChatData, (n) => {
    console.log('newChatData -> ', n.value, n.to_table)
    if (!Array.isArray(unReadOb.value[n.to_table])) {
        unReadOb.value[n.to_table] = []
        unReadOb.value[n.to_table].push({
            unread: 1,
            chat: JSON.stringify(n)
        })
        console.log('-> ', unReadOb.value)
        return
    }
    unReadOb.value[n.to_table].push({
        unread: 1,
        chat: JSON.stringify(n)
    })
    console.log('-> ', unReadOb.value)
})
async function handleUnread() {
    const flist = JSON.parse(userInfo.value.friends)
    const unRead = await window.$axios({
        method: 'post',
        url: process.env.VUE_APP_UNREAD,
        data: {
            friends: flist?.map(i => i.chat_table),
            user_id: userInfo.value.user_id
        }
    })
    // console.log('unread -> ', unRead)
    if (unRead.status !== 200) return
    if (unRead.data === 'err') return
    unReadOb.value = unRead.data
}

// 处理未读信息
function handleUnreadMsg(unreadAry) {
    if (!Array.isArray(unreadAry)) return
    
    const len = unreadAry?.length
    if (!len || len <= 0) return
    // console.log('-> ', unreadAry)
    return JSON.parse(unreadAry[len - 1]?.chat ?? '{}').text
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
</style>