import { request } from "./api"
import { ElNotification } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'
import { api } from '@/utils/api.js'
// import to from 'await-to-js'

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

export async function upload(url, data, cb) {
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


class uploadSliceClass {
    static file = ''
    static cb = ''
    // 计数器
    #number = 0

    // 分片参数
    #sliceOptions = {
        url: api.sliceFile,
        // url: 'uploadTest',
        method: 'post',
        data: '',
        headers: {
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
            // 'Content-Type': 'application/octet-stream'
        },
        onUploadProgress: this.getPercent,
        params: {
            index: 0,
            uid: uuidv4(),
        }
    }

    // 确认参数
    #confirmOption = {
        url: api.joinFile,
        method: 'post',
        data: {
            uid: uuidv4(),
            fileName: ''
        }
    }

    // 构造函数
    constructor() {
        this.file = ''
        this.cb = ''
    }
    
    // 切分文件
    slice(file) {
        // Object.prototype.toString.call(new Blob(['x'])).slice(8,-1)
        if (!file) return []
        const LEN = 1024 * 1024 * 1
        let start = 0
        let end = LEN
        let size = file.size
        let sliceAry = []
        while (size > LEN) {
            sliceAry.push(file.slice(start, end))
            size = size - LEN
            start = end
            end = end + LEN
        }
        if (size) {
            sliceAry.push(file.slice(start))
        }
        return sliceAry
    }

    // 读百分比函数
    getPercent(pgEvent) {
        // console.log('this.file', this)
        const fileSize = uploadSliceClass.file.size
        // console.log('cb -> ', cb)
        let ld = 0
        const percent = Math.round((pgEvent.loaded * 100) / pgEvent.total)
        if (percent === 100) {
            ld += pgEvent.total
            console.log('ld -> ', Math.round(ld / fileSize * 100))
        }
        if (typeof uploadSliceClass.cb === 'function') uploadSliceClass.cb(null, Math.round(ld / fileSize * 100), null)
    }

    // 设置分片参数
    setSliceOptions(data, index, uid) {
        // console.log('sets this -> ', this)
        return {
            ...this.#sliceOptions,
            data,
            params: {
                index,
                uid,
            }
        }
    }

    // 设置确认参数
    setConfirmOptions(fileName, uid) {
        return {
            ...this.#sliceOptions,
            data: {
                fileName,
                uid
            }
        }
    }

    // 设置数字
    setNumber() {
        this.#number += 1
        return this.#number
    }

    // 提示信息
    notify(type, message, title = '提示') {
        return ElNotification({
            type,
            title,
            message
        })
    }

    // 确认合并
    confirmCombine(successNumber = 0, fileName) {
        if (successNumber === this.#number) {
            // const [joinErr, joinData] = await to()
            request(this.setConfirmOptions(fileName, uuidv4()))
            .then(res => {
                if (res.status === 200) {
                    this.cb(null, null, res.data)
                }
            })
            .catch(err => {
                if (err) {
                    this.cb(new Error('确认合并错误 -> ', err))
                    return
                }
            })
        }
    }

    // 文件切片上传
    sliceFile(data, index, uid) {
        const d = data
        const i = index
        return new Promise((resolve, reject) => {
            const fd = new FormData()
            fd.append('file', d, uuidv4())
            console.log('optoin -> ', this.setSliceOptions(fd, i, uid))
            request(this.setSliceOptions(fd, i, uid))
            .then(res => {
                resolve(res)
            })
            .catch(err => {
                reject(new Error('上传错误 ->', err))
            })
        })
    }

    // 处理文件,发送切片
    async handleFile(file, cb) {
        this.uid = uuidv4()
        uploadSliceClass.file = file
        uploadSliceClass.cb = cb
        
        const fileAry = this.slice(file)
        console.log('fileAry -> ', fileAry)

        const sliceFileDataAry = fileAry.map((f, idx) => this.sliceFile(f, idx, this.uid))

        // for (let i = 0; i < fileAry.length; i++) {
        //     this.sliceFile(fileAry[i], i, this.uid)
        // }
        

        Promise
        .allSettled(sliceFileDataAry)
        .then(res => {
            console.log(' 结果-> ', res)
        })
    }

}


const uploadSlice = new uploadSliceClass()

export { uploadSlice }
