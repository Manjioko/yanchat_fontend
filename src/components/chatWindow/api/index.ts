// import { Box } from "@/interface/global"
import { request } from "@/utils/request"

// 删除聊天
interface deleteChat_Inter {
    chat: Box
    del_flag: string
}
export function deleteChat(data: deleteChat_Inter) {
    return request({
        method: 'post',
        url: '/deleteChat',
        data
    })
}

// 撤回聊天
interface revokeChat_Inter {
    chat: Box
}
export function revokeChat(data: revokeChat_Inter) {
    return request({
        method: 'post',
        url: '/deleteChat',
        data
    })
}

// 从服务器获取聊天记录
interface getChat_Inter {
    user_id: string,
    chat_table: string,
    limit: number,
    position: string,
    offset?: number
}
export function getChatData(data: getChat_Inter) {
    return request({
        method: 'post',
        url: '/chatData',
        data
    })
}