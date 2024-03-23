import { PingPong, Tips, WsConnectParams } from "@/interface/global"
import { updateUserInfo } from '@/utils/friends'
import { dbAdd } from "./indexDB"
import store from '@/store'
const MAX_RETRIES = 10
let retryCount = 0

// 第一次再确认断开连接后,需要在 2 分钟后再重新尝试连接
let refreshTime = 0.2
let refreshCount = 0
// 最多可以尝试 refresh 是 10 次
const maxRefreshCount = 15
// 每次 refresh 时间都是上次的 1.5 倍
const perTime = 1.5

function refreshConnectSocket(params: WsConnectParams) {
    if (refreshCount < maxRefreshCount) {
        refreshCount++
        setTimeout(() => {
            console.log('重连机制刷新 -> ', refreshCount)
            // eslint-disable-next-line prefer-rest-params
            connectWebSocket(params)
            refreshTime = refreshTime * perTime
        }, refreshTime * 1000 * 60)

        return true
    }
    return false
    // connectWebSocket(...arguments)
}

function connectWebSocket(params: WsConnectParams) {
    const { ws, url, centerFn, videoFn, pingPongFn, signal} = params
    console.log(`正在连接到服务器, 次数：${ retryCount } ...`,)
    if (retryCount >= MAX_RETRIES) {
        console.log('超过重连次数...')
        const isHasRefresh = refreshConnectSocket(params)
        if (isHasRefresh) {
            signal.value = 0
            retryCount = 0
            return
        } else {
            ws.value = undefined
            signal.value = 2
            return
        }
    }
    const refreshToken = sessionStorage.getItem('RefreshToken')
    ws.value = new WebSocket(url + `&token=${refreshToken}`)

    ws.value.onopen = function () {
        // appendMessage('已连接到WebSocket服务端', 'received')
        signal.value = 1
        retryCount = 0 // Reset retry count on successful connection

        // 重置刷新机制
        refreshTime = 0.2
        refreshCount = 0
    }

    ws.value.onmessage = function (event:any) {
        // console.log('message -> ', event.data)
        const chatData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

        switch (chatData.receivedType) {
            case 'deleted':
                centerFn(chatData, 'deleted')
                break
            case 'pong':
                console.log('对方确认收到', chatData)
                pingPongFn(chatData, 'pong')
                break
            case 'videoCallRequest':
                videoFn(chatData, 'videoCallRequest')
                break
            case 'videoCallResponse':
                videoFn(chatData, 'videoCallResponse')
                break
            case 'videoCallOffer':
                console.log('offer -> ', chatData)
                videoFn(chatData, 'videoCallOffer')
                break
            case 'videoCallAnwser':
                videoFn(chatData, 'videoCallAnwser')
                break
            case 'videoCallLeave':
                videoFn(chatData, 'videoCallLeave')
                break
            case 'tips':
                console.log('这是消息系统发来的消息 -> ', chatData)
                handleTips(chatData)
                break
            default:
                centerFn(chatData, 'received')
                {
                    const pong: PingPong = {
                        user_id: chatData.to_id,
                        to_id: chatData.user_id,
                        to_table: chatData.to_table,
                        chat_id: chatData.chat_id,
                        pingpong: 'pong',
                        id: chatData.id // 这里应该是服务器数据库响应的 id
                    }
                    console.log('客户端响应 -> ', pong)
                    ws.value?.send(JSON.stringify(pong))
                    dbAdd(chatData.to_table, chatData)
                    .then(() => {
                        console.log('ws.ts 处保存数据到数据库成功')
                    })
                    .catch((err: string) => {
                        console.log('ws.ts 保存数据到数据库失败 -> ', err)
                    })
                }
                break;
        }
    }

    ws.value.onclose = function (res:any) {
        console.log('与WebSocket服务端的连接已关闭', 'received')
        signal.value = 0
        if (res.code && res.code == 4001) {
            console.log('close 断开连接 -> ', res.reason)
            return
        }
        setTimeout(() => {
            console.log('正在重连 websocket ...')
            retryCount++
            connectWebSocket(params)
        }, 500)
    }

    ws.value.onerror = function () {
        console.log('WebSocket错误发生')
    }
}

// 处理消息通知
function handleTips(tips: any) {
    if (!tips.data || !Array.isArray(tips.data)) return
    // 添加好友信息到通知栏，并存入数据库中
    const addFriendsList = tips.data.filter((item: any) => item.messages_type === 'addFriend')
    store.commit('global/clearTips')
    for (const item of addFriendsList) {
        const to_user_id = JSON.parse(item.messages_box || '{}').to_user_id || ''
        if (!to_user_id) continue
        store.commit('global/addTips', item)
    }

    // 处理其他即时消息，不做长久存储
    const otherList = tips.data.filter((item: any) => item.messages_type !== 'addFriend')
    console.log('其他消息 -> ', otherList)
    for (const item of otherList) {
        switch (item.messages_type) {
            case 'withdrew':
                // store.commit('global/withdrewTips', item)
                break
            case 'addFriendRecieved':
                console.log('好友确认更新 ->', item)
                // store.commit('global/addFriendRecievedTips', item)
                updateUserInfo()
                break
            default:
                break
        }
    }
    
}

export default connectWebSocket