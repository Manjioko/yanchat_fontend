export default {
    namespaced: true,
    state() {
        return {
            count: 0
        }
    },
    mutations: {
        increment(state) {
            state.count++
        }
    },
    getters: {
        doubleCount(state) {
            return state.count * 2
        }
    },
    actions: {
        increment({ commit }) {
            setTimeout(() => {
                commit('increment')
            }, 3000);
        }
    }
}