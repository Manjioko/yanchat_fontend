function getVideoBase64(url: string, compressRatio = 0.19): Promise<string> {
    return  new Promise ((resolve) => {
        //resolve是一个函数 将异步代码成功的结果传入即可
        //reject也是一个函数 是用来传入异步代码失败的自定义结果
        let dataURL = ""
        //创建vide标签 为获取视频第一帧作为缩略图做准备
        let video: HTMLVideoElement | null = document.createElement("video")
        video.setAttribute("crossOrigin","anonymous")//处理跨域
        video.setAttribute("src",url)
        // video.setAttribute("width",400)
        // video.setAttribute("height",240)
        video.setAttribute("preload","auto")
        //loadeddata事件 加载当前帧会执行loadeddata事件
        video.addEventListener("loadeddata",function () {
            // 获取视频的原始宽度和高度
            const originalWidth = video?.videoWidth;
            const originalHeight = video?.videoHeight;
            //创建画布 画布可以做到截取视频的第一帧绘制画布上
            const canvas = document.createElement("canvas") as HTMLCanvasElement

            const width = (originalWidth || 0) * compressRatio
            const height = (originalHeight || 0) * compressRatio
            
            canvas.width = width
            canvas.height = height

            if (video) {
                const towD = canvas.getContext("2d") as CanvasRenderingContext2D
                towD.drawImage(video,0,0,width,height)//绘制
            }
            
            dataURL = canvas.toDataURL("image/jpeg", 0.1)//转换成base64
            // 清除video标签
            video = null
            //将拿到的dataURL地址传入这个resolve函数 很重要 通过这个resolve函数，实例出来的对象调用then方法可以拿到这个resolve的结果
            resolve(dataURL)//这resolve函数是用来传入异步代码成功的结果的
        })
    })
}


function getImageBase64(url: string, compressRatio = 0.3): Promise<string> {
    return new Promise ((resolve) => {
        let dataURL = ""
        let image: HTMLImageElement | null = new Image()
        image.setAttribute("crossOrigin","anonymous")//处理跨域
        image.setAttribute("src",url)
        // image.setAttribute("width",400)
        // image.setAttribute("height",240)
        image.setAttribute("preload","auto")
        image.addEventListener("load",function () {
            const originalWidth = image?.width
            const originalHeight = image?.height
            const canvas = document.createElement("canvas") as HTMLCanvasElement

            const width = (originalWidth || 0) * compressRatio
            const height = (originalHeight || 0) * compressRatio
            
            canvas.width = width
            canvas.height = height
            const twoD = canvas.getContext("2d") as CanvasRenderingContext2D
            if (image) {
                twoD.drawImage(image,0,0,width,height)//绘制
            }
            
            dataURL = canvas.toDataURL("image/jpeg", 0.1)//转换成base64
            // 清除image标签
            image = null
            //将拿到的dataURL地址传入这个resolve函数 很重要 通过这个resolve函数，实例出来的对象调用then方法可以拿到这个resolve的结果
            resolve(dataURL)//这resolve函数是用来传入异步代码成功的结果的

        })

    })
}

function getAvatarImage(url: string): Promise<File> {
    return new Promise ((resolve) => {
        let image: HTMLImageElement | null = new Image()
        image.setAttribute("crossOrigin","anonymous")//处理跨域
        image.setAttribute("src",url)
        // image.setAttribute("width",400)
        // image.setAttribute("height",240)
        image.setAttribute("preload","auto")
        image.addEventListener("load",function () {
            const originalWidth = image?.width
            const originalHeight = image?.height
            const canvas = document.createElement("canvas") as HTMLCanvasElement

            const width = (originalWidth || 0) * 0.3
            const height = (originalHeight || 0) * 0.3
            
            canvas.width = 200
            canvas.height = 200
            const twoD = canvas.getContext("2d") as CanvasRenderingContext2D
            if (image) {
                twoD.drawImage(image,0,0,width,height)//绘制
            }
            
            canvas.toBlob((blob: any) => {
                if (blob) {
                    const file = new File([blob as Blob], 'avatar.jpg', {
                        type: 'image/jpeg',
                    })
                    resolve(file)
                }

            }, "image/jpeg")
            image = null

        })
    })
}

export {
    getVideoBase64,
    getImageBase64,
    getAvatarImage
}