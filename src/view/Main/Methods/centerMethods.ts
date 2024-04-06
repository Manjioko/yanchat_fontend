import { MainStore } from "../store"
import { FriendsListStore } from "@/components/friendsList/store"
import { FootSendStore } from "@/components/sendFoot/store"
import { storeToRefs } from "pinia"
import { Box, Judge, PingPong } from "@/interface/global"
import { nextTick, watchEffect } from "vue"
import { ElNotification } from "element-plus"
import { scrollChatBoxToBottom, sendTipToFriendModel, notifyToWindow, handleGotoBottom } from './mainMethods'
import { dbAdd } from "@/utils/indexDB"
import { saveChatWindowPosition } from "./savePosition"

const  { 
    activeFriend,
    chatBox,
    ws: websocket,
    isLastChatList,
    showQuote,
    comment,
    userInfo,
    receivedShowGotoBottom
} = storeToRefs(MainStore())
const { freshDeleteTextTip } = storeToRefs(FriendsListStore())
const { pongSaveCacheData, goToBottom } = storeToRefs(FootSendStore())

// 消息发送
export function centerSend(chatData: Box) {
    console.log('发送信息 -> ', chatData)
    if (!websocket.value) {
        ElNotification({
            type: 'error',
            title: '提示',
            message: '已经与服务器断开连接,无法发送消息'
        })
        return
    }
    if (!activeFriend.value) {
        ElNotification({
            type: 'error',
            title: '提示',
            message: '尚未选择好友'
        })
        return
    }

    // 清空引用
    showQuote.value = false
    comment.value = ''

    // 以下的三个参数必传
    // 第一个 to_table 代表 聊天记录数据库名称
    // 第二个 to_id 代表 聊天对象的 id
    // 第三个 user_id 代表 自己的 id
    // 第四个 receivedType 代表 信息被接收时类型
    Object.assign(chatData, {
        to_table: activeFriend.value.chat_table,
        to_id: activeFriend.value.user_id,
        user_id: userInfo.value.user_id
    })

    // core
    // chatBox.value.push(chatData)
    if (isLastChatList.value === Judge.YES) {
        chatBox.value.push(chatData)
        nextTick(() => {
            scrollChatBoxToBottom()
        })
    } else {
        pongSaveCacheData.value.push(chatData)
    }
    if (chatData.progress !== undefined) {
        const stop = watchEffect(() => {
            if ((chatData.progress || 0) >= 100 && chatData.response) {
                if (websocket.value) {
                    const ws = websocket.value as WebSocket
                    console.log('mainUI 发送消息 -> ', chatData)
                    ws.send(JSON.stringify(chatData))
                }
                stop()
            }
            if (chatData.destroy) {
                console.log('mainUI 上传失败提示!')
                if (websocket.value) {
                    const ws = websocket.value as WebSocket
                    ws.send(JSON.stringify(chatData))
                }
            }
        })
    } else {
        if (websocket.value) {
            const ws = websocket.value as WebSocket
            ws.send(JSON.stringify(chatData))
            // console.log('mainUI 发送消息!', chatData, ws)
        }
    }

    // 等待 pong, 显示 loading 图标
    if (!('progress' in chatData)) {
        chatData.loading = true
    } else {
        sendTipToFriendModel(0, chatData)
    }
    const stopLoading = watchEffect(() => {
        if (chatData.loading === false) {
            // console.log('stopLoading -> ', chatData)
            sendTipToFriendModel(0, chatData)
            stopLoading()
        }
    })
}

// 接收消息处理
export function centerReceived(chatData: Box) {
    try {
        if (chatData.user_id === userInfo.value.user_id) {
            chatData.user = 1
        } else {
            chatData.user = 0
        }
        // console.log('activeFriend.value -> ', activeFriend.value)
        if (chatData.user_id === activeFriend?.value?.user_id) {
            // 发给自己的信息主要分两种 <1> 是展示用的信息 <2> 是撤回信息
            // 先处理撤回信息
            if (receivedShowGotoBottom.value === Judge.YES) {
                chatBox.value.push(chatData)
                goToBottom.value = Judge.YES
                pongSaveCacheData.value.push(chatData)
            } else {
                if (isLastChatList.value === Judge.YES) {
                    chatBox.value.push(chatData)
                    nextTick(() => {
                        scrollChatBoxToBottom()
                    })
                } else {
                    pongSaveCacheData.value.push(chatData)
                }
            }
            sendTipToFriendModel(0, chatData)
        } else {
            // 撤回信息不推送到好友栏
            sendTipToFriendModel(1, chatData)
        }
        // 推送消息到桌面
        notifyToWindow(chatData)
    } catch (err) {
        console.log('接收错误 -> ', err)
    }
}

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

export function centerPong(data: PingPong) {
    if (activeFriend.value.chat_table === data.to_table) {
        if (isLastChatList.value === Judge.YES) {
            const boxIndex = chatBox.value.findIndex(
                chat => chat.chat_id === data.chat_id
            )
            // console.log(chatBox.value[boxIndex], chatBox, data)
            if (boxIndex !== -1) {
                const chatData = chatBox.value[boxIndex]
                if (chatData.loading) {
                    chatData.loading = false
                    chatData.id = data.id
                }
                dbAdd(chatData.to_table, [{ ...chatData, id: data.id }])
                    .then(res => {
                        console.log('存入数据库成功了 -> ', res)
                        // 重新保存定位信息定位，防止位置丢失
                        saveChatWindowPosition()
                    })
                    .catch(err => {
                        console.log('存入数据库失败了 -> ', err)
                    })
            } else {
                console.log('发送了消息，但是pond没有存储')
            }
        } else {
            // console.log(3)
            // 发送的消息，先滚动到最新的页面，再存入数据库
            handleGotoBottom()
            const index = pongSaveCacheData.value.findIndex(d => d.chat_id === data.chat_id)
            if (index !== -1) {
                if (pongSaveCacheData.value[index].loading) {
                    pongSaveCacheData.value[index].loading = false
                    pongSaveCacheData.value[index].id = data.id
                }
                chatBox.value.push(pongSaveCacheData.value[index])
                console.log(4)
                dbAdd(data.to_table, [{ ...pongSaveCacheData.value[index], id: data.id }])
                    .then(res => {
                        console.log('存入数据库成功了 -> ', res)
                    })
                    .catch(err => {
                        console.log('存入数据库失败了 -> ', err)
                    })
            }
        }
    }
}