// import { Box } from "@/interface/global"
import { Module } from "vuex"
import { Friend, Tips } from "@/interface/global"
import { RootState } from "../index"
export interface GlobalState {
    ws: WebSocket | null
    tips: Tips[]
    centerFn: Function | null
    activeFriend: Friend | null,
    reloadChatData: boolean
}
const Global:Module<GlobalState, RootState> =  {
    namespaced: true,
    state() {
        return {
            ws: null,
            tips: [],
            centerFn: null,
            activeFriend: null,
            reloadChatData: false
        }
    },
    mutations: {
        setWs(state: GlobalState, payload: WebSocket) {
            state.ws = payload
        },
        setTips(state: GlobalState, payload: Tips[]) {
            state.tips = payload
        },
        addTips(state: GlobalState, payload: Tips) {
            state.tips.push(payload)
        },
        clearTips(state: GlobalState) {
            state.tips = []
        },
        setCenterFn(state: GlobalState, payload: Function) {
            state.centerFn = payload
        },
        setActiveFriend(state: GlobalState, payload: Friend) {
            state.activeFriend = payload
        },
        setReloadChatData(state: GlobalState, payload: boolean) {
            state.reloadChatData = payload
        }
    }
}

export default Global