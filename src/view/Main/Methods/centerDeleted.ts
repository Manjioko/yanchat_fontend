import { MainStore } from "../store"
import { FriendsListStore } from "@/components/friendsList/store"
import { storeToRefs } from "pinia"
import { Box } from "@/interface/global"

const  {activeFriend, chatBox} = storeToRefs(MainStore())
const { freshDeleteTextTip } = storeToRefs(FriendsListStore())

// 接收信息撤回处理
export function centerDeleted(chat: Box) {
    const isActive = activeFriend.value?.chat_table === chat.to_table
    if (isActive) {
        const idx = chatBox.value.findIndex(i => i.chat_id === chat.chat_id)
        if (idx !== -1) {
            chatBox.value.splice(idx, 1)
        }
        chat.text = '[撤回一条信息]'
        freshDeleteTextTip.value = { chat }
        return
    }
    chat.text = '[撤回一条信息]'
    freshDeleteTextTip.value = { chat }
}