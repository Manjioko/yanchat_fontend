import { request } from "@/utils/request"
// 刷新 refreshToken
export interface A_RefreshToken_Inter {
    phone_number: string
    user_id: string
}
export const A_RefreshToken = (data: A_RefreshToken_Inter) => {
    return request({
        url: '/refreshToken',
        method: 'post',
        data
    })
}