export default {
    namespaced: true,
    state() {
        return {
            scrollBar: null,
            chatListEle: null,
            scrollData: {}
        }
    },
    mutations: {
        setScrollBar(state: any, payload: any) {
            state.scrollBar = payload
        },
        setChatListEle(state: any, payload: any) {
            state.chatListEle = payload
        },
        setScrollData(state: any, payload: any) {
            state.scrollData = payload
        }
    }
}