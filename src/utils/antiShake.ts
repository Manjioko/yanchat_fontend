
// 防抖函数
export default function antiShake(fn: Function, time = 500) {
    let antiTime: number | null = null
    return  () => {
        const settimeout = () => {
            antiTime = setTimeout(() => fn(), time)
        }
        if (!antiTime) return  settimeout()

        clearTimeout(antiTime)
        settimeout()
    }
}