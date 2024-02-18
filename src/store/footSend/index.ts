export default {
    namespaced: true,
    state() {
        return {
            goToBottom: false
        }
    },
    mutations: {
        setGotoBottomState(state: any, payload: any) {
            state.goToBottom = payload
        }
    }
}