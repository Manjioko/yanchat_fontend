export default {
    namespaced: true,
    state() {
        return {
            db: null || IDBDatabase,
            dbname: null,
            dbversion: null,
        }
    },
    mutations: {
        setDb(state: any, payload: any) {
            state.db = payload.db
            state.dbname = payload.dbName
            state.dbversion = payload.dbVersion
        }
    }
}