
import { Friend, Tips, Box, Judge, Lock, UserInfo } from "@/interface/global"
import { defineStore } from "pinia"

export interface GlobalState {
    ws: WebSocket | null
    chatBox: Box[] // 用户的聊天信息放在这里
    tips: Tips[]
    activeFriend: Friend
    reloadChatData: boolean
    scrollSafeLength: number
    receivedShowGotoBottom:Judge
    isLastChatList: Judge
    scrollUpLock: Lock
    scrollDownLock: Lock
    showQuote: boolean
    comment: string
    userInfo: UserInfo
    signal: number
    imgLoadList: string[]

    db: any | null
    dbname: string | null
    dbversion: number | null,
    isUseMd: boolean

}
export const MainStore = defineStore('view/Main', {
    state:(): GlobalState => ({
        ws: null,
        chatBox: [],
        tips: [],
        activeFriend: {
            name: '',
            user_id: '',
            phone_number: '',
            chat_table: '',
            active: false,
            searchActive: false
        },
        reloadChatData: false,
        scrollSafeLength: 15,
        receivedShowGotoBottom: Judge.NO,
        isLastChatList: Judge.NO,
        scrollUpLock: Lock.UnLock,
        scrollDownLock: Lock.UnLock,
        showQuote: false,
        comment: '',
        userInfo:{
            friends: [],
            phone_number: '',
            user_id: '',
            user: ''
        },
        signal: 0,
        imgLoadList: [],

        db: null,
        dbname: null,
        dbversion: null,
        isUseMd: false
    }),
    getters: {
        positionId(): string {
            return this.activeFriend.user_id + this.activeFriend.chat_table
        }
    },
    actions: {
        setWs(payload: WebSocket) {
            this.ws = payload
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
        setActiveFriend(payload: Friend) {
            this.activeFriend = payload
        },
        setReloadChatData(payload: boolean) {
            this.reloadChatData = payload
        },
        setDb(payload: any) {
            this.db = payload.db
            this.dbname = payload.dbName
            this.dbversion = payload.dbVersion
        }
    }
})