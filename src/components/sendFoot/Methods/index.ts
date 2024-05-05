import { FriendsListStore } from '@/components/friendsList/store'
import { ChatWindowStore } from '@/components/chatWindow/store'
import { storeToRefs } from 'pinia'
import { dbUpdate } from '@/view/Main/Methods/indexDB'
const { activeFriend } = storeToRefs(FriendsListStore())
const { chatBox } = storeToRefs(ChatWindowStore())
export function handleProgress(chatData:EventParams) {
    // 如果没有被激活的好友则不处理
    if (!activeFriend.value) return

    // 如果不是自己的消息则不处理
    if (activeFriend.value.chat_table !== chatData.to_table) return

    chatBox.value.forEach(chat => {
        if (chat.chat_id === chatData.data?.chat_id) {
            chat.progress = chatData.data?.progress
        }
    })
}

export function handleUploadTipsSuccess(item:Tips) {
    const { chat_id, response, src, progress } = JSON.parse(item.messages_box || '{}')

    if (!chat_id || !progress || !response || !src) return
    // 更新数据
    chatBox.value.forEach((chat:Box) => {
        if (chat.chat_id === chat_id) {
            chat.progress = progress
            chat.response = response
            chat.src = src
            // 更新数据库
            dbUpdate(chat.to_table, { ...chat })
        }
    })
}

export function handleUploadTipsFailed(item:Tips) {
    const { chat_id, destroy } = JSON.parse(item.messages_box || '{}')

    console.log('上传失败 -> ', item)

    if (!chat_id || !destroy) return
    // 更新数据

    chatBox.value.forEach((chat:Box) => {
        if (chat.chat_id === chat_id) {
            chat.destroy = destroy
            // 更新数据库
            dbUpdate(chat.to_table, { ...chat })
        }
    })
}