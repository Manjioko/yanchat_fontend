import axios from "axios"
import router from "@/router/router"

const service = axios.create({
    baseURL: sessionStorage.getItem('baseUrl'),
    timeout: 5000
})

service.interceptors.request.use(config => {
    const token = sessionStorage.getItem('Token')
    if (token) {
        // console.log('token 是 -> ', token)
        config.headers['Authorization'] = 'Bearer ' + token
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
    return res
}, error => {
    // console.error('response error -> ', error)
    if (error?.response?.status === 401) {
        const refreshToken = sessionStorage.getItem('RefreshToken')
        sessionStorage.setItem('Token', 'RefreshToken ' + refreshToken)
        return service(error.config)
    } else if (error?.response?.status === 403) {
        sessionStorage.setItem('user_info', '')
        router.push('/')
        // return Promise.reject('403')
    }
    return Promise.reject(error)
})

export function request (ob) {
    const { url, params, data, method } = ob
    return service({
        url,
        params,
        data,
        method
    })
}

export const api = {
    login: '/login', // 登录
    register: '/register', // 注册
    markdown: '/isUseMd', // 是否使用 markdown
    avatar: '/uploadAvatar', // 加载头像
    changeNickName: '/changeNickName', // 修改昵称
    getFriends: '/getFriends', // 获取好友列表
    addFri: '/addFriend', // 新增好友
    unread: '/unread', // 获取未读信息
    file: '/uploadFile', // 上传文件
    chatData: '/chatData', // 获取聊天记录
    deleteChat: '/deleteChat', // 删除聊天记录
    refreshToken: '/refreshToken', // 更新refreshToken
    quote: '/quote', // 获取引用
}