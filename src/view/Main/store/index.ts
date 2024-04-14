import { defineStore } from "pinia"

export interface GlobalState {
    ws: WebSocket | null
    signal: number

    db: any | null
    dbname: string | null
    dbversion: number | null,
    isUseMd: boolean

}
export const MainStore = defineStore('view/Main', {
    state: (): GlobalState => ({
        ws: null,
        signal: 0,

        db: null,
        dbname: null,
        dbversion: null,
        isUseMd: false
    }),
    actions: {
        setWs(payload: WebSocket) {
            this.ws = payload
        },
        setDb(payload: any) {
            this.db = payload.db
            this.dbname = payload.dbName
            this.dbversion = payload.dbVersion
        }
    }
})