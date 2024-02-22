// import { Box } from "@/interface/global"
export default {
    namespaced: true,
    state() {
        return {
            goToBottom: false,
            pongSaveCacheData: []
        }
    },
    mutations: {
        setGotoBottomState(state: any, payload: any) {
            state.goToBottom = payload
        },
        setPongSaveCacheData(state: any, payload: Array<any>) {
            state.pongSaveCacheData = payload
        }
    }
}