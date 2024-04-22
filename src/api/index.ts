import { request } from "@/utils/request"
import { AxiosProgressEvent } from "axios"
// 获取 UserInfo
export interface A_getUserInfo_Inter {
    phone_number: string
    get_friends?: boolean
}
export const A_getUserInfo = (data: A_getUserInfo_Inter): Promise<any>  => {
    return request({
        url: '/getUserInfoByPhone',
        method: 'post',
        data
    })
}

// 下载文件
export const download = async (url: string, name: string, onDownloadProgress: (progressEvent: AxiosProgressEvent) => void, timeout: number = 10 * 60 * 1000) => {
    const res = await request({
        url,
        method: 'get',
        responseType: 'arraybuffer',
        timeout,
        onDownloadProgress,
    })
    console.log('名字是什么？ -> ', name, url)
    const blob = new Blob([res.data])
    const a = document.createElement('a')
    const ObUrl = window.URL.createObjectURL(blob)
    a.download = name
    a.href = ObUrl
    a.click()
    window.URL.revokeObjectURL(ObUrl)
    a.remove()
}

// 上传文件
export const upload = (url: string, data: any, onUploadProgress: (progressEvent: AxiosProgressEvent) => void) => {
    return request({
        url,
        method: 'post',
        onUploadProgress,
        data
    })
}

// 拼接文件
export interface joinFile_Inter {
    fileName: string
    uid: string
}
export const joinFile = (data: joinFile_Inter) => {
    return request({
        url: '/joinFile',
        method: 'post',
        data
    })
}

// 上传切片文件
export interface sliceFile_Inter {
    index: number
    uid: string
}
export const sliceFile = (data: FormData, onUploadProgress: (progressEvent: AxiosProgressEvent) => void, params: sliceFile_Inter) => {
    return request({
        url: '/uploadSliceFile',
        method: 'post',
        data,
        onUploadProgress,
        params
    })
}

// 清空服务器废文件夹
export interface clearDir_Inter {
    dirName: string
}
export const clearDir = (data: clearDir_Inter) => {
    return request({
        url: '/clearDir',
        method: 'post',
        data
    })
}