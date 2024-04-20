// import { Friend } from "@/interface/global"
import { request } from "@/utils/request"

// 获取用户信息
interface getUserInfoByPhone_Inter {
    phone_number: string
}
export function getUserInfoByPhone(data: getUserInfoByPhone_Inter) {
    return request({
        method: 'post',
        url: '/getUserInfoByPhone',
        data
    })
}

// 获取未读信息
interface getUnread_Inter {
    friends: string[],
    user_id: string
}
export function getUnread(data: getUnread_Inter) {
    return request({
        method: 'post',
        url: '/unread',
        data
    })
}

// 添加好友
interface addFri_Inter {
    phone_number: string
    friend_phone_number: string
}
export function addFri(data: addFri_Inter) {
    return request({
        method: 'post',
        url: '/addFriend',
        data
    })
}