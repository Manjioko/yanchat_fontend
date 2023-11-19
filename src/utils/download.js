import { request } from "./api"
import { ElNotification } from 'element-plus'

export default function download(url, name, cb) {
    const progressFn = pgEvent => {
        const percent = Math.round((pgEvent.loaded * 100) / pgEvent.total)
        if (typeof cb === 'function') cb(null, percent)
    }
    request({
        url,
        method: 'get',
        responseType: 'arraybuffer',
        onDownloadProgress: progressFn
    }).then(res => {
        const blob = new Blob([res.data])
        const a = document.createElement('a')
        const ObUrl = window.URL.createObjectURL(blob)
        a.download = name
        a.href = ObUrl
        a.click()
        window.URL.revokeObjectURL(ObUrl)
        a.remove()
    })
    .catch(err => {
        console.log('下载错误 -> ', err)
        if (typeof cb === 'function') {
            cb(new Error('下载失败'))
        }
        ElNotification({
            type: 'error',
            title: '提示',
            message: '下载错误'
        })
    })
    
}

export function upload(url, data, cb) {
    const progressFn = pgEvent => {
        const percent = Math.round((pgEvent.loaded * 100) / pgEvent.total)
        if (typeof cb === 'function') cb(null, percent, null)
    }
    request({
        url,
        method: 'post',
        onUploadProgress: progressFn,
        data
    }).then(res => {
        cb(null, null, res)
    })
    .catch(err => {
        console.log('上传错误 -> ', err)
        if (typeof cb === 'function') {
            cb(new Error('上传失败'))
        }
        ElNotification({
            type: 'error',
            title: '提示',
            message: '上传错误'
        })
    })
    
}