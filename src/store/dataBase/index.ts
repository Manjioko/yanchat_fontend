import { Module } from "vuex"
import { RootState } from "../index"

export interface DataBaseState {
    db: any,
    dbname: string | null,
    dbversion: string | null
}

const DataBase:Module<DataBaseState, RootState> = {
    namespaced: true,
    state() {
        return {
            db: null,
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

export default DataBase