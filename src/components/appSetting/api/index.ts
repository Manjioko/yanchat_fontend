import { request } from "@/utils/request"

// 获取 markdown 设置状态
interface GetMarkDownStatus_Inter {
    user_id: string
    is_use_md: boolean
}
export function getMarkDownStatus(data: GetMarkDownStatus_Inter) {
    return request({
        method: 'post',
        url: '/isUseMd',
        data
    })
}

// 获取头像
export function getAvatar(data: FormData) {
    return request({
        method: 'post',
        url: '/uploadAvatar',
        data
    })
}

// 保存昵称
interface SaveNickName_Inter {
    phone_number: string
    nick_name: string
}
export function saveNickName(data: SaveNickName_Inter) {
    return request({
        method: 'post',
        url: '/changeNickName',
        data
    })
}

// 获取好友列表
interface GetFriends_Inter {
    user_id: string,
    get_user_info: boolean
}
export function getFriends(data: GetFriends_Inter) {
    return request({
        method: 'post',
        url: '/getFriends',
        data
    })
}