import { storeToRefs } from "pinia"
import { FriendsListStore } from "@/components/friendsList/store"
import { FootSendStore } from "@/components/sendFoot/store"
import { ChatWindowStore } from "@/components/chatWindow/store"
// import { MainStore } from "../store"
// import { Judge, Box, Friend } from "@/interface/global"
import { dbReadRangeNotOffset } from "@/view/Main/Methods/indexDB"
import { nextTick, watchEffect } from "vue"
// import { FriendsListStore } from "@/components/friendsList/store"

const { scrollData, isLastChatList, chatBox, imgLoadList } = storeToRefs(ChatWindowStore())
const { freshTextTip, activeFriend, userInfo } = storeToRefs(FriendsListStore())
const { isShowGoToNewBtn } = storeToRefs(FootSendStore())
// const {  } = storeToRefs(MainStore())

// 滚动聊天框到底部
export function scrollChatBoxToBottom(start_sp?: number) {
    const end_sp = scrollData.value.chatListDiv?.scrollHeight
    end_sp
    &&
    scrollData.value.scrollBar.setScrollTop(
        start_sp ? end_sp - start_sp : end_sp
    )
    // 滚动到底部时，应该负责关掉回到最新按钮
    isShowGoToNewBtn.value = 'No'
}


// 将信息发送到好友模块的提示栏中
export function sendTipToFriendModel(unread: number, chat: Box) {
    freshTextTip.value = {
        // isUnread 为 1时标记为未读，0 时标记为已读需要展示
        isUnread: unread,
        chat: chat
    }
}

// 推送到 window 桌面
export function notifyToWindow(textOb: { text: any; user_id: any }) {
    const userFriends = userInfo.value.friends
    // console.log('text ', textOb,document.hidden)
    if (!textOb || !textOb.text) return
    // 在当前页面时，不弹出通知栏
    if (!document.hidden) return

    if (Notification.permission === 'granted') {
        // console.log('新消息 -> ', userFriends)
        const fr = userFriends?.find((f: Friend) => f.user_id === textOb.user_id)
        // console.log('fr', fr)
        const notification = new Notification(fr?.name || '新消息', {
            body: textOb.text || ''
            // 可选的通知图标
            // icon: require('../assets/avatar1.png'),
        })

        notification.onclick = function () {
            // 点击通知时的操作
        }
    }
}

export async function handleGotoBottom() {
    if (isLastChatList.value === 'Yes') {
        scrollChatBoxToBottom()
        // console.log('直接到底部了')
    } else {
        chatBox.value = []
        const chatData: Box[] = []
        const chat_table = activeFriend.value.chat_table
        chatData.push(...(await dbReadRangeNotOffset(chat_table)))
        const resChatData = handleChatData(chatData || [])
        chatBox.value.unshift(...resChatData)
        // console.log('先加上，再到底部')
        nextTick(() => {
            mediaDelayPosition(chatData, () => {
                scrollChatBoxToBottom()
            })
        })
    }
}

// 媒体文件延迟定位处理
function mediaDelayPosition(chatData: Box[], cb: Function) {
    chatData.forEach((d: Box) => {
        if (d.type.includes('video') || d.type.includes('image')) {
            if (!imgLoadList.value.includes(d.chat_id)) {
                imgLoadList.value.push(d.chat_id)
            }
        }
    })

    if (imgLoadList.value.length) {
        const isAllLoadedStop = watchEffect(() => {
            if (imgLoadList.value.length === 0) {
                cb()
                isAllLoadedStop()
            }
        })
    } else {
        cb()
    }
}

function handleChatData(data: Box[]): Box[] {
    return (
        data.map((i: Box) => {
            // const chatOb = JSON.parse(i.chat)
            if (userInfo.value.user_id === i.user_id) {
                i.user = 1
            } else {
                i.user = 0
            }

            return {
                // ...i,
                ...i
            }
        }) ?? []
    )
}