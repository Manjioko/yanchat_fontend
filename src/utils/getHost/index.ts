export function getHost() {
    const hostname = window.location.hostname
    const protocol = window.location.protocol
    const host = window.location.host
    if (process.env.NODE_ENV === 'development') {
        return protocol + '//' + hostname + ':' + '9999'
    } else {
        return protocol + '//' + host
    }
}

export function getWsHost(wss: boolean = false) {
    const host = window.location.host
    const hostname = window.location.hostname
    if (process.env.NODE_ENV === 'development') {
        return wss ? 'wss://' + hostname + ':' + '9999' : 'ws://' + hostname + ':' + '9999'
    } else {
        return wss ? 'wss://' + host + ':' + '9999' : 'ws://' + host + ':' + '9999'
    }
}