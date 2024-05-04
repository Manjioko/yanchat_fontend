// import { PingPong, WsConnectParams } from "@/interface/global"
import { dbAdd } from "./indexDB"
import { handleTips } from "../../../components/chatWindow/Methods/tips"
// import { store } from '@/store'
import { FriendsListStore } from "@/components/friendsList/store"
import { MainStore } from "@/view/Main/store"
import { centerDeleted, centerReceived, centerSentPondEcho } from "@/view/Main/Methods/centerMethods"
import { storeToRefs } from "pinia"
import {
    centerVideoCallOffer,
    centerVideoCallAnwser,
    // destroyVideoCallOfferer,
    // destroyVideoCallAnwserer,
    centerVideoCallRequest,
    centerVideoCallResponse,
    centerVideoCallLeave,
    // handleVideoCallStart
} from '@/components/VideoCallOfferer/methods/videoCenter'

const friendStore = FriendsListStore()
const mainStore = MainStore()

const { signal } = storeToRefs(mainStore)

// 第一次再确认断开连接后,需要在 2 分钟后再重新尝试连接
interface RefreshConnectSocketConfig {
    TIME: number
    COUNT: number
    readonly maxNumber: number
    readonly perTime: number
}
const refreshConfig: RefreshConnectSocketConfig = {
    TIME: 0.2, // 时间（单位/分钟）
    COUNT: 0, // 次数
    maxNumber: 15, // 最多可以尝试 refresh 是 10 次
    perTime: 1.5 // 每次 refresh 时间都是上次的 1.5 倍
}

function refreshConnectSocket(params: WsConnectParams) {
    if (refreshConfig.COUNT < refreshConfig.maxNumber) {
        refreshConfig.COUNT++
        setTimeout(() => {
            console.log('重连机制刷新 -> ', refreshConfig.COUNT)
            // eslint-disable-next-line prefer-rest-params
            connectWebSocket(params, true)
            refreshConfig.TIME = refreshConfig.TIME * refreshConfig.perTime
        }, refreshConfig.TIME * 1000 * 60)

        return true
    }
    return false
    // connectWebSocket(...arguments)
}

// 连接 ws 不能无限制刷新连接，应当限制刷新次数
interface ConnectSocketConfig {
    readonly MAX_RETRIES: number
    retryCount: number
}
const connectConfig: ConnectSocketConfig = {
    MAX_RETRIES: 100,
    retryCount: 0
}

function connectWebSocket(params: WsConnectParams, isReconnect:boolean = false) {
    const { url } = params
    // console.log(`正在连接到服务器, 次数：${ retryCount } ...`,)
    if (connectConfig.retryCount >= connectConfig.MAX_RETRIES) {
        console.log('超过重连次数...')
        const isHasRefresh = refreshConnectSocket(params)
        if (isHasRefresh) {
            signal.value = 0
            connectConfig.retryCount = 0
            return
        } else {
            // websocket = undefined
            signal.value = 2
            return
        }
    }
    const refreshToken = sessionStorage.getItem('RefreshToken')
    const websocket: WebSocket = new WebSocket(url + `&token=${refreshToken}`)
    mainStore.ws = websocket
    websocket.onopen = function () {
        // console.log('连接成功，重连模式为 -> ', isReconnect)
        // appendMessage('已连接到WebSocket服务端', 'received')
        // 用于记录用户重连时需要刷新的状态
        // 因为 websocket 可能会时不时断线重连，所以断线期间，如果用户不关闭这个窗口
        // 就会出现客户端如果发送任何信息，该用户都会默认无法收到消息，直到用户刷新页面
        if (isReconnect) {
            // store.commit('friendsList/setRefreshFriendData', true)
            friendStore.setRefreshFriendData(true)
            // console.log('进入重刷模式', store?.state.friendsList.fresh)
        }

        signal.value = 1
        connectConfig.retryCount = 0 // Reset retry count on successful connection

        // 重置刷新机制
        refreshConfig.TIME = 0.2
        refreshConfig.COUNT = 0
        
    }

    websocket.onmessage = function (event:any) {
        // console.log('message -> ', event.data)
        const chatData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

        switch (chatData.receivedType) {
            case 'deleted':
                // centerFn(chatData, 'deleted')
                centerDeleted(chatData)
                break
            case 'pong':
                console.log('对方确认收到')
                // pingPongFn(chatData, 'pong')
                centerSentPondEcho(chatData)
                break
            case 'videoCallRequest':
                // videoFn(chatData, 'videoCallRequest')
                centerVideoCallRequest(chatData)
                break
            case 'videoCallResponse':
                // videoFn(chatData, 'videoCallResponse')
                centerVideoCallResponse(chatData)
                break
            case 'videoCallOffer':
                console.log('offer -> ', chatData)
                // videoFn(chatData, 'videoCallOffer')
                centerVideoCallOffer(chatData)
                break
            case 'videoCallAnwser':
                // videoFn(chatData, 'videoCallAnwser')
                centerVideoCallAnwser(chatData)
                break
            case 'videoCallLeave':
                // videoFn(chatData, 'videoCallLeave')
                centerVideoCallLeave(chatData)
                break
            case 'tips':
                // console.log('这是消息系统发来的消息 -> ', chatData)
                handleTips(chatData)
                break
            default:
                // centerFn(chatData, 'received')
                centerReceived(chatData)
                {
                    const pong: PingPong = {
                        user_id: chatData.to_id,
                        to_id: chatData.user_id,
                        to_table: chatData.to_table,
                        chat_id: chatData.chat_id,
                        pingpong: 'pong',
                        id: chatData.id // 这里应该是服务器数据库响应的 id
                    }
                    // console.log('客户端响应 -> ', pong)
                    websocket?.send(JSON.stringify(pong))

                    dbAdd(chatData.to_table, chatData)
                    .then((res) => {
                        chatData.id = res
                        console.log('ws.ts 保存数据到数据库成功 -> ', chatData.id)
                    })
                    .catch((err: string) => {
                        console.log('ws.ts 保存数据到数据库失败 -> ', err)
                    })
                }
                break;
        }
    }

    websocket.onclose = function (res:any) {
        console.log('与WebSocket服务端的连接已关闭', 'received')
        signal.value = 0
        if (res.code && res.code == 4001) {
            console.log('close 断开连接 -> ', res.reason)
            return
        }
        setTimeout(() => {
            console.log('正在重连 websocket ...')
            connectConfig.retryCount++
            connectWebSocket(params, true)
        }, 2000)
    }

    websocket.onerror = function () {
        console.log('WebSocket错误发生')
    }
}


export default connectWebSocket