
// 防抖函数
export default function antiShake(fn: Function, time = 500) {
    let antiTime: number | null = null
    return (...args: any) => {
        const settimeout = () => {
            // console.log(args)
            antiTime = setTimeout(() => fn(...args), time)
        }
        if (!antiTime) return  settimeout()

        clearTimeout(antiTime)
        settimeout()
    }
}