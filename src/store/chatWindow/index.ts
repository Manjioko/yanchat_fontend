export default {
    namespaced: true,
    state() {
        return {
            scrollBar: null,
            chatListEle: null
        }
    },
    mutations: {
        setScrollBar(state: any, payload: any) {
            state.scrollBar = payload
        },
        setChatListEle(state: any, payload: any) {
            // console.log('chatListEle -> ', payload)
            state.chatListEle = payload
        }
    }
}