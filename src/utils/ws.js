const MAX_RETRIES = 2
let retryCount = 0

function connectWebSocket(ws, url, appendMessage, signal, otherParams = '&reconnect=0') {
    console.log(`正在连接到服务器, 次数：${ retryCount } ...`,)
    if (retryCount >= MAX_RETRIES) {
        console.log('Max retry attempts reached. Disconnecting...')
        ws.value = {}
        signal.value = 2
        return
    }
    ws.value = new WebSocket(url + otherParams)

    ws.value.onopen = function () {
        // appendMessage('已连接到WebSocket服务端', 'received')
        signal.value = 1
        retryCount = 0 // Reset retry count on successful connection
    }

    ws.value.onmessage = function (event) {
        appendMessage(event.data, 'received')
    }

    ws.value.onclose = function (res) {
        appendMessage('与WebSocket服务端的连接已关闭', 'received')
        signal.value = 0
        if (res.code && res.code == 4001) {
            console.log('close 断开连接 -> ', res.reason)
            return
        }
        // console.log('code -> ', res)
        // reconnect()
        setTimeout(() => {
            console.log('Reconnecting to WebSocket...')
            retryCount++
            connectWebSocket(ws, url, appendMessage, signal, '&reconnect=1')
        }, 2000) // 2 seconds
    }

    ws.value.onerror = function () {
        console.log('WebSocket错误发生')
    }
}

export default connectWebSocket