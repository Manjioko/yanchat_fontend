export default function download(url, name) {
    fetch(url)
    .then(res => res.blob())
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
    })
}