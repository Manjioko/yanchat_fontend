// import { Box } from "@/interface/global"
export default {
    namespaced: true,
    state() {
        return {
            ws: null,
            tips: [],
            centerFn: null,
        }
    },
    mutations: {
        setWs(state: any, payload: any) {
            state.ws = payload
        },
        setTips(state: any, payload: any) {
            state.tips = payload
        },
        addTips(state: any, payload: any) {
            state.tips.push(payload)
        },
        clearTips(state: any) {
            state.tips = []
        },
        setCenterFn(state: any, payload: any) {
            state.centerFn = payload
        }
    }
}