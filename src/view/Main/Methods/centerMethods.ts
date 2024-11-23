import { MainStore } from "../store"
import { FriendsListStore } from "@/components/friendsList/store"
import { FootSendStore } from "@/components/sendFoot/store"
import { storeToRefs } from "pinia"
import { nextTick, watchEffect, reactive } from "vue"
import { ElNotification } from "element-plus"
import { scrollChatBoxToBottom, scrollToBottom,sendTipToFriendModel, notifyToWindow, handleGotoBottom } from './mainMethods'
import { dbAdd, dbReadByIndex, dbUpdate, dbGetLastPrimaryKey } from "@/view/Main/Methods/indexDB"
import { ChatWindowStore } from "@/components/chatWindow/store"
import { CommentQuoteStore } from "@/components/comentQuote/store"
// import { Ollama } from "ollama/dist/browser.mjs"
import { timeFormat } from '@/utils/timeFormat'
import { v4 as uuidv4 } from 'uuid'
// import { dbAdd, updateDatabase } from '@/view/Main/Methods/indexDB'
// import { reactive } from "vue"

const  { ws: websocket } = storeToRefs(MainStore())
const { showQuote, comment } = storeToRefs(CommentQuoteStore())
const { freshDeleteTextTip, activeFriend, userInfo, ollama } = storeToRefs(FriendsListStore())
const { chatBoxCacheList, isShowGoToNewBtn, isGetGoToNewSingle } = storeToRefs(FootSendStore())
const { isLastChatList, chatBox } = storeToRefs(ChatWindowStore())
// 消息发送
export function centerSend(chatData: Box) {
    return new Promise((resolve, reject) => {
        _centerSendBefore(chatData)
        .then(res => {
            const ws = websocket.value as WebSocket
            ws?.send(JSON.stringify(chatData))

            if (chatData.progress === undefined) {
                return resolve(chatData)
            }
        
            const stop = watchEffect(() => {
                if ((chatData.progress || 0) >= 100 && chatData.response) {
                    const ws = websocket.value as WebSocket
                    // // console.log('mainUI 发送消息 -> ', chatData)
                    // ws?.send(JSON.stringify(chatData))
                    // 发文件上传成功的消息到服务器
                    const uploadSuccessTips: Tips = {
                        to_id: chatData.to_id,
                        user_id: chatData.user_id,
                        to_table: chatData.to_table,
                        // messages_type: 'uploadSuccess',
                        messages_type: 'uploadSuccess',
                        messages_box: {
                            uploadState: 'success',
                            progress: chatData.progress,
                            response: chatData.response,
                            chat_id: chatData.chat_id,
                            src: chatData.src,
                            to_table: chatData.to_table
                        }
                    }
                    console.log('mainUI 发送成功提示 -> ', uploadSuccessTips)
                    ws?.send(JSON.stringify(uploadSuccessTips))

                    // 为什么要更新数据库？因为上传的进度和其他一些数据是在上传成功后
                    // 才能从服务器返回的，而之前的数据库数据没有这些数据，所以要更新
                    dbUpdate(chatData.to_table, { ...chatData })

                    resolve(chatData)
                    stop()
                }
                if (chatData.destroy) {
                    console.log('mainUI 上传失败提示!')
                    const ws = websocket.value as WebSocket
                    // ws?.send(JSON.stringify(chatData))
                    // 发文件上传失败的消息到服务器
                    const uploadSuccessTips: Tips = {
                        to_id: chatData.to_id,
                        messages_type: 'uploadFailed',
                        user_id: chatData.user_id,
                        to_table: chatData.to_table,
                        messages_box: {
                            uploadState: 'failed',
                            progress: chatData.progress,
                            chat_id: chatData.chat_id,
                            destroy: true,
                            to_table: chatData.to_table
                        }
                    }
                    ws?.send(JSON.stringify(uploadSuccessTips))

                    // 为什么要更新数据库？因为上传的进度和其他一些数据是在上传成功后
                    // 才能从服务器返回的，而之前的数据库数据没有这些数据，所以要更新
                    dbUpdate(chatData.to_table, { ...chatData })

                    resolve(chatData)
                    stop()
                }
            })
            // resolve(res)
        })
        .catch(err => {
            console.log('centerSend -> ', err)
            reject(err)
        })
    })
}

async function _centerSendBefore(chatData: Box) {
    // console.log('发送信息 -> ', chatData)
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
    if (isLastChatList.value === 'Yes') {
        chatBox.value.push(chatData)
        nextTick(() => {
            scrollChatBoxToBottom()
        })
    } else {
        // 将信息放到缓存中，主要的目的是为了更新 progress 和 loading 这两个属性
        // 如果将 信息丢弃，这两个属性的值就会丢失
        chatBoxCacheList.value.push(chatData)
    }

    // 等待 pong, 显示 loading 图标
    // 在保存数据到数据库前，先将 loading 设置为 true
    // echo 会在收到 pong 时将 loading 设置为 false
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

    // 保存到本地
    const id = await dbAdd(chatData.to_table, {...chatData})
    chatData.id = id
    return id
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
            if (isGetGoToNewSingle.value === 'Yes') {
                chatBox.value.push(chatData)
                isShowGoToNewBtn.value = 'Yes'
                // chatBoxCacheList.value.push(chatData)
            } else {
                if (isLastChatList.value === 'Yes') {
                    chatBox.value.push(chatData)
                    nextTick(() => {
                        scrollChatBoxToBottom()
                    })
                } else {
                    // 这里将消息存起来有啥用？我为什脑抽了写这个？
                    // chatBoxCacheList.value.push(chatData)

                    // 写上面的目的在于给 “回到最新” tips 提供未读信息计数
                    // 不能和 centerSend 混用一个缓存，不然可能造成不必要的
                    // 理解困难，所以需要重新定义一个list专门做缓存用
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

export async function centerSentPondEcho(data: PingPong) {
    if (activeFriend.value.chat_table !== data.to_table) {
        return
    }

    if (isLastChatList.value === 'Yes') {
        const boxIndex = chatBox.value.findIndex(
            chat => chat.chat_id === data.chat_id
        )
        // console.log(chatBox.value[boxIndex], chatBox, data)
        if (boxIndex === -1) {
            // console.log(1)
            console.log('发送了消息，但是pond没有存储')
            return
        }

        const chatData = chatBox.value[boxIndex]
        if (chatData.loading) {
            chatData.loading = false
        }

        nextTick(() => {
            dbUpdate(chatData.to_table, { ...chatData })
            .then(res => {
                console.log('更新数据库成功了 update * -> ', res)
            })
            .catch(err => {
                console.log('更新数据库失败了 update * -> ', err)
            })
        })
    } else {
        // console.log(3)
        // 发送的消息，先滚动到最新的页面，再存入数据库
        await handleGotoBottom()
        const index = chatBoxCacheList.value.findIndex(d => d.chat_id === data.chat_id)
        if (index === -1) {
            return
        }
        if (chatBoxCacheList.value[index].loading) {
            chatBoxCacheList.value[index].loading = false
            // chatBoxCacheList.value[index].id = data.id
        }
        chatBox.value.push(chatBoxCacheList.value[index])
        nextTick(() => {
            dbUpdate(data.to_table, { ...chatBoxCacheList.value[index] })
            .then(res => {
                console.log('更新数据库成功了 update * -> ', res)
            })
            .catch(err => {
                console.log('更新数据库失败了 update * -> ', err)
            })
            .finally(() => {
                // 应该清空 chatBoxCacheList
                chatBoxCacheList.value = []
            })
        })
    }
}


// ai 机器人聊天
export async function centerAISend(chatData: Box) {
    chatBox.value.push(chatData)
    const user_id = activeFriend.value.user_id
    // 保存到本地, ai 只有user_id, 不存在 table_id
    const id = await dbAdd(user_id, {...chatData})
    chatData.id = id
    // console.log('id 是 -> ', user_id)
    nextTick(() => {
        scrollToBottom()
    })

    const uuid = uuidv4()
    let message = '[AI机器人正在思考...]'
    const dataOb:Box = reactive({
        type: 'text',
        text: message,
        user: 0,
        time: timeFormat(),
        chat_id: uuid,
        quote: '',
        to_table: '',
        to_id: '', 
        user_id,
        // 客户端不需要这个字段，因为没有 loading 这个设置
        // loading: true
    })

    chatBox.value.push(dataOb)

    // const ollama = new Ollama({ host: 'http://192.168.9.99:11434', fetch(input, init) {
    //     return fetch(input, {
    //         ...init,
    //         headers: {
    //             ...init?.headers,
    //             'Authorization': 'Bearer ' + sessionStorage.getItem('Token')
    //         }
    //     })
    // }, })

    const model = localStorage.getItem('AI_MODEL') || 'qwen2:latest'
    // 获取数据库第一个数据
    const firstKey = await dbGetLastPrimaryKey(user_id, 'next')
    // 从数据库中获取上下文
    const context = await dbReadByIndex(user_id, 'id', firstKey || 1)

    // console.log('context 是 -> ', context, firstKey)
    const response = await ollama.value.generate({
        model,
        // model: 'qwen2:1.5b',
        // messages: [{ role: 'user', content: chatData.text }],
        prompt: chatData.text,
        context: context?.ai_context || [],
        stream: true
    })

    for await (const part of response) {
        if (message === '[AI机器人正在思考...]') {
            message = part.response
        } else {
            message += part.response
        }
        if (part.done) {
            // 保存到本地
            const id = await dbAdd(user_id, {...dataOb})
            dataOb.id = id

            if (part.context) {
                // 保存到本地
                await dbUpdate(user_id, { ...context, id: firstKey, ai_context: [...part.context] })
            }
        }
        dataOb.text = message
        nextTick(() => {
            scrollToBottom()
        })
    }

}