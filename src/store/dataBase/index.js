export default {
    namespaced: true,
    state() {
        return {
            db: null,
            dbname: null,
            dbversion: null,
        }
    },
    mutations: {
        setDb(state, payload) {
            state.db = payload.db
            state.dbname = payload.dbName
            state.dbversion = payload.dbVersion
        }
    }
}