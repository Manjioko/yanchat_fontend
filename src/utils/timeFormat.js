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

export function getUseTime(startTIme, endTime) {
    const time = endTime - startTIme
    if (typeof time !== 'number' || time < 0) {
        return false
    }
    // 将毫秒转换为秒
    var seconds = Math.floor(time / 1000);
  
    // 计算小时、分钟和剩余秒数
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var remainingSeconds = seconds % 60;

    const pad = (number) => {
        return (number < 10 ? '0' : '') + number;
    }
  
    // 格式化字符串
    var formattedTime = pad(hours) + ':' + pad(minutes) + ':' + pad(remainingSeconds);
  
    return formattedTime;
}

