const MAX_RETRIES = 3
let retryCount = 0

// 第一次再确认断开连接后,需要在 2 分钟后再重新尝试连接
let refreshTime = 0.2
let refreshCount = 0
// 最多可以尝试 refresh 是 10 次
const maxRefreshCount = 15
// 每次 refresh 时间都是上次的 1.5 倍
const perTime = 1.5

function refreshConnectSocket() {
    if (refreshCount < maxRefreshCount) {
        refreshCount++
        setTimeout(() => {
            console.log('重连机制刷新 -> ', refreshCount)
            connectWebSocket(...arguments)
            refreshTime = refreshTime * perTime
        }, refreshTime * 1000 * 60)

        return true
    }
    return false
    // connectWebSocket(...arguments)
}

function connectWebSocket(ws, url, appendMessage, signal) {
    console.log(`正在连接到服务器, 次数：${ retryCount } ...`,)
    if (retryCount >= MAX_RETRIES) {
        console.log('超过重连次数...')
        const isHasRefresh = refreshConnectSocket(ws, url, appendMessage, signal)
        if (isHasRefresh) {
            signal.value = 0
            retryCount = 0
            return
        } else {
            ws.value = null
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

    ws.value.onmessage = function (event) {
        // console.log('message -> ', event.data)
        let chatData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

        switch (chatData.receivedType) {
            case 'deleted':
                appendMessage(chatData, 'deleted')
                break
            case 'pong':
                // console.log('对方确认收到', chatData)
                appendMessage(chatData, 'pong')
                break
            case 'videoCallStart':
                appendMessage(chatData, 'videoCallStart')
                break
            default:
                appendMessage(chatData, 'received')
                {
                    const pong = {
                        user_id: chatData.to_id,
                        to_id: chatData.user_id,
                        table_id: chatData.to_table,
                        chat_id: chatData.chat_id,
                        pingpong: 'pong'
                    }
                    ws.value.send(JSON.stringify(pong))
                }
                break;
        }
    }

    ws.value.onclose = function (res) {
        appendMessage('与WebSocket服务端的连接已关闭', 'received')
        signal.value = 0
        if (res.code && res.code == 4001) {
            console.log('close 断开连接 -> ', res.reason)
            return
        }
        setTimeout(() => {
            console.log('正在重连 websocket ...')
            retryCount++
            connectWebSocket(ws, url, appendMessage, signal)
        }, 5000)
    }

    ws.value.onerror = function () {
        console.log('WebSocket错误发生')
    }
}

export default connectWebSocket