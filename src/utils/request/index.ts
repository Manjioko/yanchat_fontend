import axios, { AxiosRequestConfig } from "axios"
import router from "@/router/router"
import { clearUserInfo } from "@/view/Main/Methods/userInfoOperator"

const service = axios.create({
    baseURL: sessionStorage.getItem('baseUrl') || '',
    timeout: 5000
})

service.interceptors.request.use(config => {
    const token = sessionStorage.getItem('Token')
    if (token) {
        // console.log('token 是 -> ', token)
        config.headers['Authorization'] = 'Bearer ' + token
        // console.log('headers -> ', config)
    } else {
        console.log('token 不存在')
    }
    return config
}, error => {
    console.error('request error -> ', error)
    return Promise.reject(error)
})

service.interceptors.response.use(res => {
    if (res.headers['x-new-token']) {
        sessionStorage.setItem('Token', res.headers['x-new-token'])
    }
    // if (res.headers['x-new-domain']) {
    //     sessionStorage.setItem('baseUrl', res.headers['x-new-domain'])
    // }
    // if (res.headers['x-new-ws']) {
    //     sessionStorage.setItem('wsBaseUrl', res.headers['x-new-ws'])
    // }
    return res
}, error => {
    // console.error('response error -> ', error)
    if (error?.response?.status === 401) {
        const refreshToken = sessionStorage.getItem('RefreshToken')
        sessionStorage.setItem('Token', 'RefreshToken ' + refreshToken)
        return service(error.config)
    } else if (error?.response?.status === 403) {
        clearUserInfo()
        router.push('/')
        // return Promise.reject('403')
    }
    return Promise.reject(error)
})

export function request (ob:AxiosRequestConfig) {
    const { timeout:customTimeout, ...rest } = ob
    // console.log('ob是 -> ', ob,service.defaults.timeout)
    return service({
        timeout: customTimeout || service.defaults.timeout, // 超时时间
        ...rest
    })
}
