import { request } from "@/utils/api"

// 获取 UserInfo
export interface A_getUserInfo_Inter {
    phone_number: string,
    get_friends?: boolean
}
export const A_getUserInfo = (data: A_getUserInfo_Inter): Promise<any>  => {
    return request({
        url: '/getUserInfoByPhone',
        method: 'post',
        data
    })
}