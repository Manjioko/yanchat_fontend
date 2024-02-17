export default {
    namespaced: true,
    state() {
        return {
            scrollBar: null
        }
    },
    mutations: {
        setScrollBar(state: any, payload: any) {
            state.scrollBar = payload
            // console.log('scrollbar -> ', state.scrollBar)
        }
    }
}