import { FriendsListStore } from '@/components/friendsList/store'
import { ChatWindowStore } from '@/components/chatWindow/store'
import { storeToRefs } from 'pinia'
import { dbUpdate, dbUpdateByChatId } from '@/view/Main/Methods/indexDB'
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
    const { chat_id, response, src, progress, to_table } = JSON.parse(item.messages_box || '{}')

    if (!chat_id || !progress || !response || !src) return
    const chatData = chatBox.value.find(chat => chat.chat_id === chat_id)
    if (chatData) {
        chatData.progress = progress
        chatData.response = response
        chatData.src = src
        // 更新数据库
        dbUpdate(chatData.to_table, { ...chatData })
    } else {
        // 更新数据库
        dbUpdateByChatId(to_table, chat_id, { progress, response, src })
    }
}

export function handleUploadTipsFailed(item:Tips) {
    const { chat_id, destroy, to_table } = JSON.parse(item.messages_box || '{}')

    if (!chat_id || !destroy || !to_table) return

    const chatData = chatBox.value.find(chat => chat.chat_id === chat_id)
    if (chatData) {
        chatData.destroy = destroy
        // 更新数据库
        dbUpdate(chatData.to_table, { ...chatData })
    } else {
        // 更新数据库
        dbUpdateByChatId(to_table, chat_id, { destroy })
    }
}