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

    // 分片参数
    #sliceOptions = {
        url: api.sliceFile,
        method: 'post',
        data: '',
        onUploadProgress: this.getPercent.bind(this),
        params: {
            index: 0,
            uid: null,
        }
    }

    // 确认参数
    #confirmOption = {
        url: api.joinFile,
        method: 'post',
        data: {
            uid: null,
            fileName: ''
        }
    }

    // 构造函数
    constructor() {
        this.file = ''
        this.cb = ''
        this.uploadedSize = 0
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
        const fileSize = this.file.size
        const percent = Math.round((pgEvent.loaded * 100) / pgEvent.total)
        if (percent === 100) {
            if (typeof this.cb === 'function') {
                this.uploadedSize += pgEvent.total
                this.cb(null, Math.round(this.uploadedSize / fileSize * 100), null)
            }
        }
    }

    // 设置分片参数
    setSliceOptions(data, index, uid) {
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
            ...this.#confirmOption,
            data: {
                fileName,
                uid
            }
        }
    }


    // 提示信息
    // notify(type, message, title = '提示') {
    //     return ElNotification({
    //         type,
    //         title,
    //         message
    //     })
    // }

    // 确认合并
    confirmCombine(fileName, dirName) {
        request(this.setConfirmOptions(fileName, dirName))
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

    // 文件切片上传
    sliceFile(data, index, uid) {
        const d = data
        const i = index
        return new Promise((resolve, reject) => {
            const fd = new FormData()
            fd.append('file', d, uuidv4())
            request(this.setSliceOptions(fd, i, uid))
            .then(res => {
                if (res.status === 200) {
                    resolve('Ok')
                }
            })
            .catch(err => {
                reject(new Error('上传错误 ->', err))
            })
        })
    }

    // 失败上传列表处理
    async failListHandle(list, fileName) {
        // console.log('错误 list -> ', list, fileName)
        let tryList = list
        // 尝试 5 次
        for (let re = 0; re < 5; re++) {
            let failList = []
            for (let i = 0; i < tryList.length; i++) {
                try {
                    await this.sliceFile(tryList[i].data, tryList[i].index, this.uid)
                } catch (error) {
                    this.uploadedSize -= tryList[i].data.size 
                    failList.push(tryList[i])
                }
                
            }
            // failList.length === 0 证明全部上传成功
            if (failList.length === 0) {
                this.confirmCombine(fileName, this.uid)
                return
            }
            tryList = failList
        }

        // 尝试 5 次后, 如果还是失败, 则直接提示失败
        this.cb(new Error('文件上传失败'))
    }

    // 处理文件,发送切片
    async handleFile(file, cb) {

        // 保存一些必要的数据
        this.uid = uuidv4()
        // 文件
        this.file = file
        // 回调函数
        this.cb = cb
        
        const fileAry = this.slice(file)

        // 每次上传 3 个
        const everyTimeNumber = 3
        // 上传切片次数
        const loopTime = Math.ceil(fileAry.length / everyTimeNumber)

        // 失败切片列表
        const failList = []

        // 成功数量
        let successNumber = 0
        
        // 上传切片
        for (let i = 0; i < loopTime; i++) {

            // 上传
            const sliceFileDataAry = fileAry
            .slice(i * everyTimeNumber, i === loopTime - 1 ? fileAry.length : (i + 1) * everyTimeNumber)
            .map((f, idx) => this.sliceFile(f, idx + i * everyTimeNumber, this.uid))

            // allsettled 后返回的是一个数组, 可能有失败也有成功
            const res = await Promise.allSettled(sliceFileDataAry)

            // 处理上传失败的片段
            res.forEach((r, ri) => {
                if (r.status !== 'fulfilled') {
                    // 减去多余的上传进度
                    this.uploadedSize -= fileAry[i * everyTimeNumber + ri].size
                    failList.push({
                        index: i * everyTimeNumber + ri,
                        data: fileAry[i * everyTimeNumber + ri]
                    })
                    return
                }
                successNumber += 1
            })
        }

        // 全部上传成功后, 确认合并
        if (successNumber === fileAry.length) {
            this.confirmCombine(this.file.name, this.uid)
            return
        }

        // 处理上传失败的切片
        this.failListHandle(failList, this.file.name)
    }

}


const uploadSlice = new uploadSliceClass()

export { uploadSlice }
