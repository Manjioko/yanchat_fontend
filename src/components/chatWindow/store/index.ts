import { defineStore } from 'pinia'
import { ScrollData } from '@/interface/chatWindow'
// import { Box } from '@/interface/global'

export interface ChatWindowState {
    scrollBar: any
    chatListEle: any
    scrollData: ScrollData
}

export const ChatWindowStore = defineStore('components/chatWindow', {
    state:(): ChatWindowState => ({
        scrollBar: null,
        chatListEle: null,
        scrollData: {}
    }),
    actions: {
        setScrollBar(payload: any) {
            this.scrollBar = payload
        },
        setChatListEle(payload: any) {
            this.chatListEle = payload
        },
        setScrollData(payload: any) {
            this.scrollData = payload
        }
    }
})