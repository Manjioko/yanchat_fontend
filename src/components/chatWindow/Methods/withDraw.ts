import { deleteLocalDataBaseData } from '@/utils/withdraw'
// import { chatBox, freshDeleteTextTip, websocket } from '@/components/chatWindow/store'
import { saveChatWindowPosition } from '@/view/Main/Methods/savePosition'
import { MainStore } from '@/view/Main/store'
import { FriendsListStore } from '@/components/friendsList/store'
import { Tips } from '@/interface/global'
import { storeToRefs } from 'pinia'
const { freshDeleteTextTip } = storeToRefs(FriendsListStore())
const { chatBox, activeFriend, ws:websocket } = storeToRefs(MainStore())
import { request, api } from '@/utils/api'
import { to } from 'await-to-js'

// windowChat 撤回回调
export async function handleWithdraw(idx: number) {
    deleteLocalDataBaseData(chatBox.value[idx])
        .then(() => {
            chatBox.value[idx].text = '[撤回一条信息]'
            freshDeleteTextTip.value = { chat: chatBox.value[idx] }
            chatBox.value.splice(idx, 1)

            // 撤回或者删除后，需要重新设置定位信息
            saveChatWindowPosition()
        })
        .catch(err => {
            console.log('撤回失败 uj -> ', err)
        })
    const ws = websocket.value as WebSocket
    if (chatBox.value[idx]?.thumbnail) {
        delete chatBox.value[idx].thumbnail
    }
    const tipsParams: Tips = {
        messages_type: 'withdraw',
        messages_box: chatBox.value[idx],
        to_id: activeFriend.value.user_id
    }
    ws.send(JSON.stringify(tipsParams))
}

// 删除处理
export async function handleDeleted(idx: number) {
    const user_id = sessionStorage.getItem('user_id')
    const chat = chatBox.value[idx]
    const [err, res] = await to(
        request({
            method: 'post',
            url: api.deleteChat,
            data: {
                chat,
                del_flag: user_id
            }
        })
    )
    if (err) {
        console.log('删除失败 -> ', err)
    }
    if (res?.data !== 'err') {
        console.log('删除成功 -> ', res)
        deleteLocalDataBaseData(chatBox.value[idx])
        .then(() => {
            chatBox.value.splice(idx, 1)
            chat.text = '[已删除一条信息]'
            freshDeleteTextTip.value = { chat }
            // 重新保存定位信息
            saveChatWindowPosition()
        })
    } else {
        console.log('删除失败 -> ', res.data)
    }
}