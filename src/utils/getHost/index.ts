
export function getHost() {
    const hostname = window.location.hostname
    const protocol = window.location.protocol
    const host = window.location.host
    if (process.env.NODE_ENV === 'development') {
        // console.log('protocol -> ', process.env)
        return process.env.VUE_APP_BASE_URL

    } else {
        return protocol + '//' + host
    }
}

export function getWsHost(wss: boolean = false) {
    const host = window.location.host
    const hostname = window.location.hostname
    if (process.env.NODE_ENV === 'development') {
        return process.env.VUE_APP_WS
    } else {
        return wss ? 'wss://' + host : 'ws://' + host
    }
}