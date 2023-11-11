const MAX_RETRIES = 6
let retryCount = 0

function connectWebSocket(ws, url, appendMessage, signal) {
    console.log(`正在连接到服务器, 次数：${ retryCount } ...`,)
    if (retryCount >= MAX_RETRIES) {
        console.log('Max retry attempts reached. Disconnecting...')
        ws.value = {}
        signal.value = 2
        return
    }
    const refreshToken = sessionStorage.getItem('RefreshToken')
    ws.value = new WebSocket(url + `&token=${refreshToken}`)

    ws.value.onopen = function () {
        // appendMessage('已连接到WebSocket服务端', 'received')
        signal.value = 1
        retryCount = 0 // Reset retry count on successful connection
    }

    ws.value.onmessage = function (event) {
        console.log('message -> ', event.data)
        let chatData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

        switch (chatData.receivedType) {
            case 'deleted':
                appendMessage(chatData, 'deleted')
                break
            case 'quote':
                appendMessage(chatData, 'quote')
                break
            case 'pong':
                console.log('对方确认收到', chatData)
                break
            default:
                appendMessage(chatData, 'received')
                {
                    const pong = {
                        user_id: chatData.to_id,
                        to_id: chatData.user_id,
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
            console.log('Reconnecting to WebSocket...')
            retryCount++
            connectWebSocket(ws, url, appendMessage, signal)
        }, 2000)
    }

    ws.value.onerror = function () {
        console.log('WebSocket错误发生')
    }
}

export default connectWebSocket