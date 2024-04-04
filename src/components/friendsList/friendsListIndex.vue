<template>
  <div class="container">
    <header class="f-header">
      <div :class="{ isOnlink: signal === 1, isUnlink: signal !== 1 }"></div>
      <img
        :src="avatarSrc"
        alt="avatar"
        class="avatar-img"
        @error="handleAvatarSelfErr"
      />
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
        :key="i.user_id"
        :class="{ 'i-active': i.active }"
        @click="handleSelect(idx, i)"
      >
        <!-- <div class="unread-dot" v-if="showUnread(chatDataOb[i.to_table])">
                    {{ handleUnreadDotNum(chatDataOb[i.to_table]) }}
                </div> -->
        <el-badge
          :value="handleUnreadDotNum(chatDataOb[i.chat_table])"
          :max="99"
        >
          <img
            class="i-img"
            :src="i.avatar_url"
            alt="avatar"
            @error="handleError(i)"
          />
        </el-badge>

        <div class="i-text">
          <div class="i-name">{{ i.name }}</div>
          <div class="i-msg">
            {{ handleUnreadMsg(chatDataOb[i.chat_table]) || i.message }}
          </div>
        </div>
        <div class="i-time">
          {{ handleShowTime(chatDataOb[i.chat_table]) || i.time }}
        </div>
      </section>
    </main>
  </div>

  <div>
    <el-dialog
      v-model="dShow"
      title="添加好友"
      width="300"
      :modal="false"
      :close-on-click-modal="false"
      :show-close="false"
      :append-to-body="true"
      draggable
      style="border-radius: 8px; text-align: center"
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
          <el-button type="primary" @click="addFriend"> 确定 </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import {
  ref,
  defineProps,
  onMounted,
  defineEmits,
  watch,
  Ref
} from 'vue'
import { FriendsListStore } from './store'
import { Search } from '@element-plus/icons-vue'
import antiShake from '@/utils/antiShake'
import to from 'await-to-js'
import { request, api } from '@/utils/api'
import { dbAdd, initDdOperate } from '@/utils/indexDB'
import {
  Box,
  Friend,
  RefreshMessage,
  Tip,
  UserInfo,
  Tips,
  Judge
} from '@/interface/global'
import typeIs from '@/utils/type'
import { MainStore } from '@/view/Main/store'
import { storeToRefs } from 'pinia'
const friendStore = FriendsListStore()
const mainStore = MainStore()
const { friendsList, fresh:reconnectFresh, freshDeleteTextTip, freshTextTip } = storeToRefs(friendStore)

const props = defineProps({
  friends: String,
  signal: Number,
  avatarRefresh: String,
})
const emit = defineEmits(['handleActiveFriend'])

// 重连刷新内容
watch(() => reconnectFresh.value, val => {
  if (val) {
    handleUnread(Judge.YES)
  }
})

// 用户信息
const user_info = JSON.parse(sessionStorage.getItem('user_info') || '')
// console.log('用户信息 -》 ', user_info)
initDdOperate(user_info).then(() => {
  handleUnread()
})
const user_id = sessionStorage.getItem('user_id')
const baseUrl = sessionStorage.getItem('baseUrl')
const avatarSrc = ref(`${baseUrl}/avatar/avatar_${user_id}.jpg`)
watch(
  () => props.avatarRefresh,
  val => {
    avatarSrc.value = val || ''
  }
)

onMounted(() => {
  // console.log('route -> ', route)
  if (!props.friends) return
  let f = JSON.parse(props.friends)
  const phone_number = user_info.phone_number
  // console.log('f -> ', f, typeIs(f))
  if (typeIs(f) === 'String') {
    f = JSON.parse(f || '[]')
  }
  const baseUrl = sessionStorage.getItem('baseUrl')
  f?.forEach((item: Friend) => {
    // store.commit('friendsList/addFriendsList', {
    //   name: item.name || (item.user as string),
    //   user_id: item.user_id,
    //   time: '',
    //   message: '',
    //   avatar_url: `${baseUrl}/avatar/avatar_${item.user_id}.jpg`,
    //   active: false,
    //   searchActive: true,
    //   chat_table: item.chat_table,
    //   phone_number
    // })
    friendStore.addFriendsList({
      name: item.name || (item.user as string),
      user_id: item.user_id,
      time: '',
      message: '',
      avatar_url: `${baseUrl}/avatar/avatar_${item.user_id}.jpg`,
      active: false,
      searchActive: true,
      chat_table: item.chat_table,
      phone_number
    })
  })
})

let dShow = ref(false)
const oldIdx: Ref<number | null> = ref(null)
function handleSelect(idx: number, row: Friend) {
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
  if (!row.chat_table) return
  if (!chatDataOb.value[row.chat_table]) return
  chatDataOb.value[row.chat_table].unread = 0
}

// 添加好友功能
const friend_phone_number = ref('')
const missFri = ref(false)
const repFri = ref(false)
async function addFriend() {
  if (!friend_phone_number.value) {
    return
  }
  // let phone_number = user_info.phone_number
  const [uerr, udata] = await to(
    request({
      method: 'post',
      url: api.getUserInfoByPhone,
      data: {
        phone_number: friend_phone_number.value
      }
    })
  )
  if (uerr) {
    console.log('获取用户信息错误: ', uerr)
    return
  }
  // console.log('获取用户信息成功 -> ', udata)
  if (udata.data && udata.data[0]) {
    // console.log('用户存在 -> ', udata.data, store.state.global.ws)
    const to_id = udata.data[0].user_id || ''
    const tips: Tips = {
      to_id,
      messages_type: 'addFriend',
      messages_box: {
        msg: `${userInfo.value.user} 想添加你为好友`,
        friend_phone_number: userInfo.value.phone_number,
        friendName: userInfo.value.user,
        friend_user_id: userInfo.value.user_id,
        to_user_id: udata.data[0].user_id
      }
    }
    // store.state.global.ws?.send(JSON.stringify(tips))
    mainStore.ws?.send(JSON.stringify(tips))
    return
  }
  dShow.value = false
}

// 更新好友信息
const userInfo: Ref<UserInfo> = ref(
  JSON.parse(sessionStorage.getItem('user_info') || '{}')
)
let chatDataOb: Ref<{ [to_table: string]: Tip }> = ref({})
watch(
  chatDataOb,
  val => {
    sessionStorage.setItem('chatDataOb', JSON.stringify(val))
  },
  { deep: true }
)

watch(() => freshDeleteTextTip.value.chat!, (chat: Box) => {
    if (!chat) return
    const { to_table } = chat
    // console.log('更新 chat -> ', chat, chatDataOb.value[to_table])
    if (!to_table || !chatDataOb.value[to_table]) return
    const beforChatId = chatDataOb.value[to_table].chat_id
    console.log('is should deleted -> ', beforChatId === chat.chat_id)
    if (beforChatId !== chat.chat_id) return
    chatDataOb.value[to_table] = {
      unread: chatDataOb.value[chat.to_table].unread,
      ...chat
    }
    console.log('更改成功 -> ', chatDataOb.value[to_table])
  }
)

watch(() => freshTextTip.value, (ob: RefreshMessage) => {
    const { isUnread, chat } = ob
    if (!chat) return
    if (!chatDataOb.value[chat.to_table]) {
      chatDataOb.value[chat.to_table] = {
        unread: isUnread ? 1 : 0,
        ...chat
      }
      return
    }
    chatDataOb.value[chat.to_table] = {
      unread: isUnread ? chatDataOb.value[chat.to_table].unread + 1 : 0,
      ...chat
    }
})

// 处理未读信息(红点提示部分)
async function handleUnread(isWsReconnect: Judge = Judge.NO) {
  // console.log('route -> ', route, router)
  // const c = sessionStorage.getItem('chatDataOb')
  // if (c) {
  //     chatDataOb.value = JSON.parse(c)
  //     return
  // }
  // 从服务器拉取未读信息
  let flist = JSON.parse(userInfo.value.friends)
  if (!flist) return
  if (typeof flist === 'string') {
    flist = JSON.parse(flist)
  }
  const [err, unRead] = await to(
    request({
      method: 'post',
      url: api.unread,
      data: {
        friends: flist?.map((i: Friend) => i.chat_table),
        user_id: userInfo.value.user_id
      }
    })
  )

  // 错误处理
  if (err) {
    console.log('处理未读消息错误：', err)
    return
  }
  // console.log('unread -> ', unRead)

  if (unRead.status !== 200) return
  if (unRead.data === 'err') return
  const setTipData: { [key: string]: Tip } = {}

  // 处理一开始返回最后一条数据正好被用户删除时的情况
  Object.keys(unRead.data).forEach(key => {
    const len = unRead.data[key].chat.length
    const lastChat = unRead.data[key].chat[len - 1 < 0 ? 0 : len - 1]

    if (unRead.data[key].unread !== 0) {
      dbAdd(key, unRead.data[key].chat)
      .then(() => {
        console.log('成功将未读信息保存到数据库中！')
        if (isWsReconnect === Judge.YES) {
          // if (store.state.global.activeFriend?.chat_table === key) {
          if (mainStore.activeFriend?.chat_table === key) {
            if (len) {
              // 通知聊天页面，可以重新加载数据
              // store.commit('global/setReloadChatData', true)
              mainStore.reloadChatData = true
              console.log('%c readUnread 已经发出通知', 'color: red')
            }
          }
        }
      })
      .catch((err: string) => {
        console.log('将未读信息保存到数据库中失败了 -> ', err)
      })
    }
    if (lastChat.del_self || lastChat.del_other) {
      lastChat.text = '[已删除一条消息]'
    }
    let unread = 0
    if (chatDataOb.value[key]?.unread) {
      unread = chatDataOb.value[key].unread
    }
    // 如果是 ws 连接时，没有设置未读信息时，默认为 0
    setTipData[key] = {
      ...lastChat,
      unread: mainStore.activeFriend?.chat_table === key ?
      0 :
      unRead.data[key].unread + unread
    }
  })
  chatDataOb.value = setTipData
  if (isWsReconnect === Judge.YES) {
    friendStore.fresh = false
  }
}

// 处理未读信息(文字部分)
function handleUnreadMsg(unreadOb: Tip): string {
  // console.log('chat xxx -> ', unreadOb)
  return unreadOb?.text ?? ''
}

// 处理时间
function handleShowTime(unreadOb: Tip): string {
  if (unreadOb?.time) {
    const time = unreadOb.time
    return String(time).slice(10, -3) ?? ''
  }

  return ''
}

// 处理未读数目
function handleUnreadDotNum(ob: Tip): string | number {
  if (ob?.unread === 0) return ''
  return ob?.unread ?? ''
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
  // console.log('friends filter -> ', searchText.value)
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
watch(searchText, () => shake())
function handleAvatarSelfErr() {
  avatarSrc.value = require('../../assets/default_avatar.png')
}
function handleError(i: Friend) {
  i.avatar_url = require('../../assets/default_avatar.png')
}
</script>
<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  background-color: #fff;
  height: 92vh;
  width: 260px;
  max-height: 700px;
  border-right: 2px solid #f5f6fa;
  border-radius: 5px 0px 0px 5px;
}
.f-header {
  display: flex;
  box-sizing: border-box;
  padding: 20px 10px;
  align-items: center;
  background-color: #f5f6fa;
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
  color: #b0afb4;
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
  border-bottom: 1px solid #f5f6fa;
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
  background-color: #e8f2ff;
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
::v-deep .el-badge__content {
  top: 4px;
  border: none;
  height: 16px;
  padding: 0 5px;
}
</style>
