// 防抖函数
export default function debounce(fn: Function, time = 500): Function {
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

// 节流函数
export function throttle(fn: Function, time: number = 500): Function {
    let antiTime: number | null = null
    return (...args: any): number => {
        if (!antiTime) {
            antiTime = setTimeout(() => {
                console.log('节流')
                fn(...args)
                antiTime = null
            }, time)
        }
        return antiTime
    }
}