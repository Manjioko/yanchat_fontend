export interface DbOpenOptions {
    dbName: string
    version: number
    indexList?: any[]
    tableNameList?: string[]
    oldDb?: IDBDatabase | null
}