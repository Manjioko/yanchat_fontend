// import { Box } from "@/interface/global"
export default {
    namespaced: true,
    state() {
        return {
            ws: null,
        }
    },
    mutations: {
        setWs(state: any, payload: any) {
            state.ws = payload
        },
    }
}