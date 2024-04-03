
import { Friend, Tips } from "@/interface/global"
import { defineStore } from "pinia"
// import { Ref, ref } from "vue"

export interface GlobalState {
    ws: WebSocket | null
    tips: Tips[]
    centerFn: Function | null
    activeFriend: Friend | null,
    reloadChatData: boolean
}
export const MainStore = defineStore('view/Main', {
    state:(): GlobalState => ({
        ws: null,
        tips: [],
        centerFn: null,
        activeFriend: null,
        reloadChatData: false
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
        setActiveFriend(payload: Friend | null) {
            this.activeFriend = payload
        },
        setReloadChatData(payload: boolean) {
            this.reloadChatData = payload
        }
    }
})