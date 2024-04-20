import axios, { AxiosRequestConfig } from "axios"
import router from "@/router/router"
import { clearUserInfo } from "@/view/Main/Methods/userInfoOperator"

const service = axios.create({
    baseURL: sessionStorage.getItem('baseUrl') || '',
    timeout: 50000
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
    if (res.headers['x-new-domain']) {
        sessionStorage.setItem('baseUrl', res.headers['x-new-domain'])
    }
    if (res.headers['x-new-ws']) {
        sessionStorage.setItem('wsBaseUrl', res.headers['x-new-ws'])
    }
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
    // console.log('ob是 -> ', ob)
    return service({
        timeout: customTimeout || service.defaults.timeout, // 超时时间
        ...rest
    })
}

// export const api = {
//     login: '/login', // 登录
//     register: '/register', // 注册
//     markdown: '/isUseMd', // 是否使用 markdown
//     avatar: '/uploadAvatar', // 加载头像
//     changeNickName: '/changeNickName', // 修改昵称
//     getFriends: '/getFriends', // 获取好友列表
//     addFri: '/addFriend', // 新增好友
//     addFriTest: '/addFriendTest', // 新增好友测试
//     unread: '/unread', // 获取未读信息
//     file: '/uploadFile', // 上传文件
//     sliceFile: '/uploadSliceFile', // 上传切片文件
//     chatData: '/chatData', // 获取聊天记录
//     deleteChat: '/deleteChat', // 删除聊天记录
//     refreshToken: '/refreshToken', // 更新refreshToken
//     quote: '/quote', // 获取引用
//     source: '/source', // 文件资源
//     verifyAuth: '/verifyAuth', // 用于更新 token
//     joinFile: '/joinFile', // 确认合并文件
//     clearDir: '/clearDir', // 清空文件夹
//     getUserInfoByPhone: '/getUserInfoByPhone', // 根据手机号获取用户
//     updateVersion: '/updateVersion', // 更新版本号
//     updateUserInfo: '/updateUserInfo', // 更新用户信息
// }