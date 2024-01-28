interface Box {
    progress?: number // 文件上传的进度信息
    fileName?: string // 文件名
    size?: number // 文件大小
    response?: string // 服务器返回值保存，一般来说都是文件名
    thumbnail?: string // 缩略图 base64 数据
    destroy?: boolean // 时候已经上传失败， 1 是失败，0 是尚未上传完成或者上传成功
    src?: string // 文件远程路径
    type: string // 类型 
    text: string // 消息内容 
    time: number // 时间 
    user: number // 用户区分，1 是自己， 0 是别人
    chat_id: string // chatbox自己的唯一值，用于标记自己，方便模糊查询用
    to_table: string // 聊天框的 id
    to_id: string // 聊天对象的 id
    user_id: string // 自己的 id
    phone_number: string // 手机号
    loading: boolean // 是否正在上传
    id: number // 数据库自己保存chatbox到数据库后，返回的id值放这里，用于客户端自己保存时的唯一 id,
    // 视频通话可能需要以下这些类型
    from?: string // 发送者
}

interface Friend {
    name: string
    avatar_url?: string
    is_use_md?: string
    created_at?: string
    updated_at?: string
    user_id: string // 和上面的 id 一样，所以这里不做要求
    phone_number: string
    chat_table: string, // 和 to_table 一样，所以这里不做要求
    time?: string | number
    message?: string
    active: boolean // 用户点击
    searchActive: boolean // 用户搜索
}


export {
    Box,
    Friend
}