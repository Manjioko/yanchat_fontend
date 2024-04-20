
// 防抖函数
export default function antiShake(fn: Function, time = 500): Function {
    let antiTime: number | null = null
    return (...args: any): number => {
        const settimeout = () => {
            // console.log(args)
            antiTime = setTimeout(() => fn(...args), time)
            return antiTime
        }
        if (!antiTime) return  settimeout()

        clearTimeout(antiTime)
        settimeout()
        return antiTime
    }
}