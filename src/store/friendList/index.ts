export default {
    namespaced: true,
    state() {
        return {
            count: 0
        }
    },
    mutations: {
        increment(state: any) {
            state.count++
        }
    },
    getters: {
        doubleCount(state: any) {
            return state.count * 2
        }
    },
    actions: {
        increment({ commit = (params: any) => {} }) {
            setTimeout(() => {
                commit('increment')
            }, 3000);
        }
    }
}