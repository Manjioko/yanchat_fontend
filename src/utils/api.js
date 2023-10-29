export function request (ob) {
    const { url, params, data, method } = ob
    // const baseUrl = sessionStorage.getItem('baseUrl')
    return window.$axios({
        url: sessionStorage.getItem('baseUrl') + url,
        params,
        data,
        method
    })
}

export const api = {
    login: '/login', // 登录
    register: '/register', // 注册
    markdown: '/isUseMd', // 是否使用 markdown
    avatar: '/uploadAvatar', // 加载头像
    changeNickName: '/changeNickName', // 修改昵称
    getFriends: '/getFriends', // 获取好友列表
    addFri: '/add', // 新增好友
    unread: '/unread', // 获取未读信息
    file: '/uploadFile', // 上传文件
    chatData: '/chatData', // 获取聊天记录
    deleteChat: '/deleteChat' // 删除聊天记录
}