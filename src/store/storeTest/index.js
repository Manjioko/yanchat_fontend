export default {
    namespaced: true,
    state() {
        return {
            count: 0,
            db: null,
            dbname: null,
            dbversion: null,
        }
    },
    mutations: {
        increment(state) {
            state.count++
        },
        setDb(state, payload) {
            state.db = payload.db
            state.dbname = payload.dbName
            state.dbversion = payload.dbVersion
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