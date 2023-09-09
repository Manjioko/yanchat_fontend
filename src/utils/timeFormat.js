export function timeFormat() {
    // 获取当前时间的Date对象
    const currentDate = new Date()

    // 获取年、月、日、时、分、秒
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0') // 月份从0开始，需要+1并补零
    const day = String(currentDate.getDate()).padStart(2, '0')
    const hours = String(currentDate.getHours()).padStart(2, '0')
    const minutes = String(currentDate.getMinutes()).padStart(2, '0')
    const seconds = String(currentDate.getSeconds()).padStart(2, '0')

    // 格式化成 YYYY-MM-DD hh:mm:ss 格式
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    return formattedDate
}