import { defineStore } from 'pinia'
// import { ScrollData } from '@/interface/chatWindow'
// import { VideoConfig, InitVideoConfig } from '@/interface/video'
// import { Box } from '@/interface/global'

export interface VideoCallOffererState {
    showAnwserer: boolean
    videocallOfferData: any
    showOfferer: boolean
    videocallAnwserData: VideoConfig
}

export const VideoCallOfferer = defineStore('components/VideoCallOfferer', {
    state:(): VideoCallOffererState => ({
        showAnwserer: false,
        videocallOfferData: null,
        showOfferer: false,
        videocallAnwserData: {
            event: '',
            type: '',
            user_id: '',
            to_table: '',
            to_id: '',
            from: null,
            data: null
        }
    }),
    actions: {
    }
})