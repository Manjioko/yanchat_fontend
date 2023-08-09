import bus from './bus.js'
const MAX_RETRIES = 10
let retryCount = 0

function connectWebSocket(url, appendMessage) {
    console.log('正在连接到服务器中...')
    if (retryCount >= MAX_RETRIES) {
        console.log('Max retry attempts reached. Disconnecting...')
        window.$websocket = ''
        bus.$emit('timeOut', { socket: '' })
        return
    }
    window.$websocket = new WebSocket(url)

    window.$websocket.onopen = function () {
        appendMessage('已连接到WebSocket服务端', 'received')
        retryCount = 0 // Reset retry count on successful connection
        bus.$emit('connected', { socket: window.$websocket })
    }

    window.$websocket.onmessage = function (event) {
        appendMessage(event.data, 'received')
    }

    window.$websocket.onclose = function () {
        appendMessage('与WebSocket服务端的连接已关闭', 'received')
        // reconnect()
        setTimeout(() => {
            console.log('Reconnecting to WebSocket...')
            retryCount++
            connectWebSocket()
        }, 2000) // 2 seconds
    }

    window.$websocket.onerror = function () {
        appendMessage('WebSocket错误发生', 'received')
        setTimeout(() => {
            console.log('Reconnecting to WebSocket...')
            retryCount++
            connectWebSocket()
        }, 2000) // 2 seconds
    }
}

export default connectWebSocket