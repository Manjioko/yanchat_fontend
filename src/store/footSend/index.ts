import { Module } from "vuex"
import { RootState } from "../index"
import { Box } from "@/interface/global"

// import { Box } from "@/interface/global"
export interface FootSendState {
    goToBottom: boolean
    pongSaveCacheData: Box[]
}
const FootSend:Module<FootSendState, RootState> = {
    namespaced: true,
    state() {
        return {
            goToBottom: false,
            pongSaveCacheData: []
        }
    },
    mutations: {
        setGotoBottomState(state: FootSendState, payload: any) {
            state.goToBottom = payload
        },
        setPongSaveCacheData(state: FootSendState, payload: Array<any>) {
            state.pongSaveCacheData = payload
        }
    }
}

export default FootSend