import { saveChatWindowPosition } from '@/view/Main/Methods/savePosition'
import { MainStore } from '@/view/Main/store'
import { FriendsListStore } from '@/components/friendsList/store'
import { storeToRefs } from 'pinia'
import { ChatWindowStore } from '../store'
import { to } from 'await-to-js'

// import { Tips, Box } from "@/interface/global"
import { dbDeleteByIndex } from "@/view/Main/Methods/indexDB"
import { computed, ComputedRef, watchEffect } from "vue"
import { centerDeleted } from "@/view/Main/Methods/centerMethods"
import * as API from '../api'
const mainstore = MainStore()

const { freshDeleteTextTip, activeFriend } = storeToRefs(FriendsListStore())
const {  ws: websocket } = storeToRefs(MainStore())
const { chatBox } = storeToRefs(ChatWindowStore())

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
    const [err, res] = await to(API.deleteChat({ chat, del_flag: user_id || '' }))
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


export function handleWithdrawUtils(data: Tips) {
    return new Promise((resolve, reject) => {
        if (!data) return resolve(null)
        console.log('撤回消息 -> ', data)
        const { messages_box } = data
        if (messages_box) {
            const dbname: ComputedRef<string> = computed(() => mainstore.dbname || '')
            const stop = watchEffect(() => {
                if (dbname.value) {
                    const box: Box = JSON.parse(messages_box)
                    dbDeleteByIndex(box.to_table, 'chat_id', box.chat_id)
                    .then(() => {
                        // serverWithdraw(box)
                        // .then(() => {
                        //     if (typeIs(store.state.global.centerFn) === 'Function') {
                        //         console.log('处理下本地的数据 --> ', box)
                        //         store.state.global.centerFn(box, 'deleted')
                        //     }
                        // })
                        // mainstore.centerFn?.(box, 'deleted')
                        centerDeleted(box)
                        resolve(true)
                    })
                    .catch(err => {
                        console.log('撤回失败 -> ', err)
                        reject(err)
                    })
                    .finally(() => {
                        stop()
                    })
                }
            })
        }
    })
}

function serverWithdraw(chatBox:Box): Promise<boolean | string> {
    return new Promise((resolve, reject) => {
        API.revokeChat({ chat: { ...chatBox, thumbnail: ''}  })
        .then(res => {
            if (res?.data === 'ok') {
                console.log('服务器撤回成功 -> ', res)
                resolve(true)
                // centerDeleted(chatBox.value[idx])
            } else {
                console.log('服务器撤回失败2 -> ', res)
                reject(res)
            }
        }).catch(err => {
            console.log('服务器撤回失败1 -> ', err)
            reject(err)
        })
        
    })
}
export async function deleteLocalDataBaseData(chatBox:Box) {
    new Promise((resolve, reject) => {
        dbDeleteByIndex(chatBox.to_table, 'chat_id', chatBox.chat_id)
        .then((res) => {
            console.log('res ---> ', res, chatBox.chat_id)
            resolve(true)
        })
        .catch(err => {
            console.log('撤回失败 -> ', err)
            reject(err)
        })
    })
}
