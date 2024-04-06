import { request } from "@/utils/api"
import { to } from "await-to-js"
import { AxiosResponse } from "axios"
// 约定接口名称必须用 A_ 开头
// 约定接口约束名称必须用 A_ 开头, _Inter 为约定后缀

// type TO_ERR = Error | null
// type TO_RES = AxiosResponse | null | undefined

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