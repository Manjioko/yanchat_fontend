import { defineStore } from 'pinia'
import { ScrollData } from '@/interface/chatWindow'
import { Judge, Lock, Tips, Box } from '@/interface/global'

export interface ChatWindowState {
    scrollBar: any
    chatListEle: any
    scrollData: ScrollData
    boxScrollTop: number
    isLastChatList: Judge
    scrollUpLock: Lock
    scrollDownLock: Lock
    reloadChatData: boolean
    scrollSafeLength: number
    chatBox: Box[] // 用户的聊天信息放在这里
    tips: Tips[],
    imgLoadList: string[]
}

export const ChatWindowStore = defineStore('components/chatWindow', {
    state:(): ChatWindowState => ({
        scrollBar: null,
        chatListEle: null,
        scrollData: {},
        boxScrollTop: 0,
        isLastChatList: Judge.NO,
        scrollUpLock: Lock.UnLock,
        scrollDownLock: Lock.UnLock,
        chatBox: [],
        tips: [],
        reloadChatData: false,
        scrollSafeLength: 15,
        imgLoadList: [],
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
        },
        setTips(payload: Tips[]) {
            this.tips = payload
        },
        addTips(payload: Tips) {
            this.tips.push(payload)
        },
        clearTips() {
            this.tips = []
        },
        setReloadChatData(payload: boolean) {
            this.reloadChatData = payload
        },
    }
})