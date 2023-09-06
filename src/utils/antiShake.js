// 防抖函数
export default function antiShake(fn, time = 500) {
    let antiTime = null
    return  () => {
        const settimeout = () => {
            antiTime = setTimeout(() => fn(), time)
        }
        if (!antiTime) return  settimeout()

        clearTimeout(antiTime)
        settimeout()
    }
}