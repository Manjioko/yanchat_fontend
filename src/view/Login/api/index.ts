import { request } from "@/utils/request"


// 发送登录请求
export interface A_login_Inter {
    phone_number: string
    password: string
}
export const A_login = (data: A_login_Inter): Promise<any>  => {
    return request({
        url: '/login',
        method: 'post',
        data
    })
}

// 注册
export interface A_register_Inter {
    phone_number: string
    password: string
}
export const A_register = (data: A_register_Inter): Promise<any>  => {
    return request({
        url: '/register',
        method: 'post',
        data
    })
}
