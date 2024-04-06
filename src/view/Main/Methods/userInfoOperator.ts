import { UserInfo } from "@/interface/global"
import { MainStore } from "../store"
import { request, api } from "@/utils/api"
import { to } from "await-to-js"

const mainStore = MainStore()

export function getUserInfo(): UserInfo | null {
    const data = sessionStorage.getItem('user_info')

    if (data && typeof data === 'string') {
        return JSON.parse(data)
    }
    return null
}


export function setUserInfo(info: UserInfo) {
    // 本地设置同步数据
    if (info) {
        if (info.friends && typeof info.friends === 'string') {
            info.friends = JSON.parse(info.friends)
        }
        // console.log('设置好友值是 -> ', info)
        sessionStorage.setItem('user_info', JSON.stringify(info))
        mainStore.userInfo = info
        console.log('设置好友值是 -> ', mainStore.userInfo)
    }
}


export async function updateUserInfo(data: UserInfo) {
    const reqData = {
        user_id: data.user_id,
        data: {...data, friends: JSON.stringify(data.friends)}
    }
    console.log('updateUserInfo 更新用户信息 -> ', reqData)
    const [err, res] = await to(request({
        url: api.updateUserInfo,
        method: 'post',
        data: reqData
    }))
    if (err) return Promise.reject(`更新用户信息失败 -> ${err}`)
    console.log('newUserInfo 的信息是 -> ', res)
    if(!res || !res.data) return Promise.reject(`更新用户信息失败`)
    // 本地设置同步数据
    if (res.data && res.data) {
        console.log('v 1')
        const info = res.data as UserInfo
        if (info.friends && typeof info.friends === 'string') {
            info.friends = JSON.parse(info.friends)
        }
        sessionStorage.setItem('user_info', JSON.stringify(info))
        mainStore.userInfo = info
        console.log('sessionStorage, mainStore.userInfo -> ', info)
    }

    return Promise.resolve(res.data[0])
}

export function clearUserInfo() {
    sessionStorage.removeItem('user_info')
}
