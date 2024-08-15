import { defineStore } from "pinia"

export interface GlobalState {
    ws: WebSocket | null
    signal: number

    db: any | null
    dbname: string | null
    dbversion: number | null,
    isUseMd: boolean,
    fullScreen: boolean
    // AIContext: Array<any>

}
export const MainStore = defineStore('view/Main', {
    state: (): GlobalState => ({
        ws: null,
        signal: 0,

        db: null,
        dbname: null,
        dbversion: null,
        isUseMd: false,
        fullScreen: false,
        // AIContext: []
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