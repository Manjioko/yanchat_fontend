// 输入一个文件大小，转换成 KB MB GB 等更加直观的方式
export default function byteCovert(size) {
    const m_size = size / (1024 * 1024)

    if (m_size < 1) {
        return (m_size * 1024).toFixed(2) + ' K'
    }

    if (m_size > 1024) {
        return (m_size / 1024).toFixed(2) + ' G'
    }

    return m_size.toFixed(2) + ' M'
}