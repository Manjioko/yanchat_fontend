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