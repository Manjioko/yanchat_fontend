export default function download(url, name, cb) {
    fetch(url)
    .then(async (res) => {
        const clonedRes = res.clone()
        const progress = new Promise((resolve, reject) => {
            if (!res.ok) return reject(false)
            let downloadSize = 0
            const totalSize = res.headers.get('Content-Length')
            const streamReader = res.body.getReader()
            const readFn = () => {
                streamReader
                .read()
                .then(({done, value}) => {
                    if (done) {
                        // console.log('下载完成!')
                        return resolve(done)
                    } else {
                        downloadSize += value.byteLength
                        const progress = (downloadSize / totalSize) * 100
                        if (typeof cb === 'function') {
                            cb(progress)
                        }
                    }
                    readFn()
                }).catch(() => {
                    reject(false)
                })
            }
            readFn()
        })
        const isSuccess =  await progress
        if (isSuccess) return clonedRes.blob()
        return new Error('fail to download!')
        // return res.blob()
    })
    .then(blob => {
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
    })
}