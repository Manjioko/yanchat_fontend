const MAX_RETRIES = 10
let retryCount = 0

function connectWebSocket(ws, url, appendMessage, signal) {
    console.log('正在连接到服务器中...')
    if (retryCount >= MAX_RETRIES) {
        console.log('Max retry attempts reached. Disconnecting...')
        ws = {}
        signal.value = 2
        return
    }
    ws = new WebSocket(url)

    ws.onopen = function () {
        // appendMessage('已连接到WebSocket服务端', 'received')
        signal.value = 1
        retryCount = 0 // Reset retry count on successful connection
    }

    ws.onmessage = function (event) {
        appendMessage(event.data, 'received')
    }

    ws.onclose = function () {
        // appendMessage('与WebSocket服务端的连接已关闭', 'received')
        signal.value = 0
        // reconnect()
        setTimeout(() => {
            console.log('Reconnecting to WebSocket...')
            retryCount++
            connectWebSocket(ws, url, appendMessage, signal)
        }, 2000) // 2 seconds
    }

    ws.onerror = function () {
        appendMessage('WebSocket错误发生', 'received')
    }
}

export default connectWebSocket