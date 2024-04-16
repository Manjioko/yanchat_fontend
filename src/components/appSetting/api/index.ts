import { request } from "@/utils/api"

// 获取 markdown 设置状态
export function getMarkDownStatus(data: Record<string, any>) {
    return request({
        method: 'post',
        url: '/isUseMd',
        data
    })
}

// 获取头像
export function getAvatar(data: Record<string, any>) {
    return request({
        method: 'post',
        url: '/uploadAvatar',
        data
    })
}

// 保存昵称
export function saveNickName(data: Record<string, any>) {
    return request({
        method: 'post',
        url: '/changeNickName',
        data
    })
}

// 获取好友列表
export function getFriends(data: Record<string, any>) {
    return request({
        method: 'post',
        url: '/getFriends',
        data
    })
}