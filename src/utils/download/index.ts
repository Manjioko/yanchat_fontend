import { ElNotification } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'
import { AxiosProgressEvent } from "axios"
import * as API from '@/api'

export default function mediaDownload(url: string, name: string, cb: Function) {
    const progressFn = (pgEvent: AxiosProgressEvent) => {
        const percent = Math.round((pgEvent.loaded * 100) / (pgEvent.total || 1))
        if (typeof cb === 'function') cb(null, percent)
    }

    API.download(url, name, progressFn, 10 * 60 * 1000)
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



async function mediaUpload(fileData:File, callback:Function) {
    const file: File = fileData
    const cb: Function = callback
    let uploadedSize: number = 0
    const uid: string = uuidv4()

    // 切分文件
    const slice = (file: File) => {
        // Object.prototype.toString.call(new Blob(['x'])).slice(8,-1)
        if (!file) return []
        const LEN = 1024 * 1024 * 1
        let start = 0
        let end = LEN
        let size = file.size
        const sliceAry = []
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
    const getPercent = (pgEvent: AxiosProgressEvent) =>  {
        const fileSize = file?.size || 0
        const percent = Math.round((pgEvent.loaded * 100) / (pgEvent.total || 1))
        // console.log('percent -> ', percent)
        if (percent === 100) {
            if (typeof cb === 'function') {
                // uploadedSize += (pgEvent.total || 1)
                // console.log('%c file -> ', 'color: blue;', file, )
                // console.log('percent -> ', uploadedSize, fileSize, pgEvent)
                // cb(null, Math.round(uploadedSize / fileSize * 100), null)
                // uploadedSize = 0
            }
        }
    }

    // 确认合并
    const confirmCombine = (fileName: string, dirName: string) =>  {
        // request(this.setConfirmOptions(fileName, dirName))
        API.joinFile({ fileName, uid: dirName })
        .then(res => {
            if (res.status === 200) {
                if (cb) {
                    cb(null, null, res.data)
                }
            }
        })
        .catch(err => {
            if (err) {
                if (cb) {
                    cb(new Error(`确认合并错误 -> ${err}`))
                }
                return
            }
        })
    }

    // 文件切片上传
    const sliceFile = (data: Blob, index: number, uid: string) => {
        const d = data
        const i = index
        return new Promise((resolve, reject) => {
            const fd = new FormData()
            fd.append('file', d, uuidv4())
            // request(this.setSliceOptions(fd, i, uid))
            // console.log('d size -> ', d.size)
            API.sliceFile(fd, getPercent, { index: i, uid })
            .then(res => {
                if (res.status === 200) {
                    resolve('Ok')
                    // console.log('上传成功 -> ', res)
                    uploadedSize += d.size
                    cb(null, Math.round(uploadedSize / file.size * 100), null)
                }
            })
            .catch(err => {
                reject(new Error(`上传错误 -> ${err}`))
            })
        })
    }

    // 失败上传列表处理
    const failListHandle = async(list: any[], fileName: string) => {
        // console.log('错误 list -> ', list, fileName)
        let tryList = list
        // 尝试 5 次
        for (let re = 0; re < 5; re++) {
            const failList = []
            for (let i = 0; i < tryList.length; i++) {
                try {
                    // console.log('tryList -> ', tryList[i])
                    await sliceFile(tryList[i].data, tryList[i].index, uid)
                } catch (error) {
                    // uploadedSize -= tryList[i].data.size
                    failList.push(tryList[i])
                }

            }
            // failList.length === 0 证明全部上传成功
            if (failList.length === 0) {
                confirmCombine(fileName, uid)
                return
            }
            tryList = failList
        }

        // 尝试 5 次后, 如果还是失败, 则直接提示失败
        if (cb) {
            cb(new Error('文件上传失败'))
        }
        API.clearDir({ dirName: uid })
    }

    // 切片
    const fileAry = slice(file)

    // 每次上传 3 个
    const everyTimeNumber = 3
    // 上传切片次数
    const loopTime = Math.ceil(fileAry.length / everyTimeNumber)

    // 失败切片列表
    const failList: any[] = []

    // 成功数量
    let successNumber = 0

    // 上传切片
    for (let i = 0; i < loopTime; i++) {

        // 上传
        const sliceFileDataAry = fileAry
            .slice(i * everyTimeNumber, i === loopTime - 1 ? fileAry.length : (i + 1) * everyTimeNumber)
            .map((f, idx) => sliceFile(f, idx + i * everyTimeNumber, uid))

        // allsettled 后返回的是一个数组, 可能有失败也有成功
        const res = await Promise.allSettled(sliceFileDataAry)

        // 处理上传失败的片段
        res.forEach((r, ri) => {
            if (r.status !== 'fulfilled') {
                // 减去多余的上传进度
                // uploadedSize -= fileAry[i * everyTimeNumber + ri].size
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
        confirmCombine(file.name, uid)
        return
    }

    // 处理上传失败的切片
    failListHandle(failList, file.name)
}

export { mediaUpload }
