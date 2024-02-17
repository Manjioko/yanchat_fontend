// import { VideoConfig } from "./video"
import { VideoConfig } from "./video"
import { Ref } from 'vue'
interface Box {
    progress?: number // 文件上传的进度信息
    fileName?: string // 文件名
    size?: number | string // 文件大小
    response?: string // 服务器返回值保存，一般来说都是文件名
    thumbnail?: string // 缩略图 base64 数据
    destroy?: boolean // 时候已经上传失败， 1 是失败，0 是尚未上传完成或者上传成功
    src?: string // 文件远程路径
    type: string // 类型 
    text: string // 消息内容 
    time: string // 时间 
    user: number // 用户区分，1 是自己， 0 是别人
    chat_id: string // chatbox自己的唯一值，用于标记自己，方便模糊查询用
    to_table: string // 聊天框的 id
    to_id: string // 聊天对象的 id
    user_id: string // 自己的 id
    phone_number?: string // 手机号
    loading: boolean // 是否正在上传
    id?: number // 数据库自己保存chatbox到数据库后，返回的id值放这里，用于客户端自己保存时的唯一 id,
    // 视频通话可能需要以下这些类型
    from?: string // 发送者
    quote?: string, // 引用
    event?: string, // 用于视频通话时传递通信类型,也可以约束接口用
    data?: any // 用于存放一些额外数据
}

const InitBox: Box = {
    type: '', // 类型 
    text: '', // 消息内容 
    time: '', // 时间 
    user: 1, // 用户区分，1 是自己， 0 是别人
    chat_id: '', // chatbox自己的唯一值，用于标记自己，方便模糊查询用
    to_table: '', // 聊天框的 id
    to_id: '', // 聊天对象的 id
    user_id: '', // 自己的 id
    loading: true // 是否正在上传
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
    searchActive: boolean, // 用户搜索
    user?: string
}

// 用户信息
interface UserInfo {
    id?: number
    user: string
    password?: string // 后台不会返回密码,所以这个不做要求
    user_id: string
    phone_number: string
    friends: string
    group?: string
    avatar_url?: string
    is_use_md?: boolean
    created_at?: string
    updated_at?: string
}

// 更新好友列表结构
interface RefreshMessage {
    isUnread?: number,
    chat: Box
}

// 回响形状
interface PingPong {
    user_id: string
    to_id: string
    to_table: string
    chat_id: string
    pingpong: string
    id: number // 这里应该是服务器数据库响应的 id
}

interface WsConnectParams {
    ws: Ref<WebSocket | undefined>
    url: string
    centerFn(data: Box, type?: string): void
    videoFn(data: VideoConfig, type?: string): void
    pingPongFn(data: PingPong, type?: string): void
    signal: Ref<number>
}

interface Tip extends Box {
    unread: number
}

interface Position {
    first: number
    last: number
    use: number
    offset: number
    area: {
        x: number
        y: number
        top: number
        left: number
    }
}

export {
    Box,
    InitBox,
    Friend,
    UserInfo,
    RefreshMessage,
    PingPong,
    WsConnectParams,
    Tip,
    Position
}