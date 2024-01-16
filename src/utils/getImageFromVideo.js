export default function getVideoBase64(url, compressRatio = 0.5) {
    return  new Promise ((resolve) => {
        //resolve是一个函数 将异步代码成功的结果传入即可
        //reject也是一个函数 是用来传入异步代码失败的自定义结果
        let dataURL = ""
        //创建vide标签 为获取视频第一帧作为缩略图做准备
        let video = document.createElement("video")
        video.setAttribute("crossOrigin","anonymous")//处理跨域
        video.setAttribute("src",url)
        video.setAttribute("width",400)
        video.setAttribute("height",240)
        video.setAttribute("preload","auto")
        //loadeddata事件 加载当前帧会执行loadeddata事件
        video.addEventListener("loadeddata",function () {
            //创建画布 画布可以做到截取视频的第一帧绘制画布上
            let canvas = document.createElement("canvas")

            console.log('compress ->  ', compressRatio)
            const width = video.width * compressRatio
            const height = video.height * compressRatio
            
            canvas.width = width
            canvas.height = height
            canvas.getContext("2d").drawImage(video,0,0,width,height)//绘制
            dataURL = canvas.toDataURL("image/jpeg")//转换成base64
            //将拿到的dataURL地址传入这个resolve函数 很重要 通过这个resolve函数，实例出来的对象调用then方法可以拿到这个resolve的结果
            resolve(dataURL)//这resolve函数是用来传入异步代码成功的结果的
        })
    })
}