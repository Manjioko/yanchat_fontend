interface VideoConfig {
    event: string
    type: string
    user_id: string
    to_table: string
    to_id: string
    from?: any
    data: any
}

const InitVideoConfig = {
    event: '',
    type: '',
    user_id: '',
    to_table: '',
    to_id: '',
    data: ''
}


export {
    VideoConfig,
    InitVideoConfig
}