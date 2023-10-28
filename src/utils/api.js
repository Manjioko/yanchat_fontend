export function request (ob) {
    const { url, params, data, method } = ob
    const baseUrl = sessionStorage.getItem('baseUrl')
    return window.$axios({
        url: baseUrl + url,
        params,
        data,
        method
    })
}

export const api = {
    login: '/user/login',
}