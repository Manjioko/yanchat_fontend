
import { Friend, Tips, Box } from "@/interface/global"
import { defineStore } from "pinia"
// import { Ref, ref } from "vue"

export interface GlobalState {
    ws: WebSocket | null
    chatBox: Box[], // 用户的聊天信息放在这里
    tips: Tips[]
    centerFn: Function | null
    activeFriend: Friend,
    reloadChatData: boolean,
    scrollSafeLength: number,

    db: any | null,
    dbname: string | null,
    dbversion: number | null,

}
export const MainStore = defineStore('view/Main', {
    state:(): GlobalState => ({
        ws: null,
        chatBox: [],
        tips: [],
        centerFn: null,
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

        db: null,
        dbname: null,
        dbversion: null
    }),
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
        setCenterFn(payload: Function | null) {
            this.centerFn = payload
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