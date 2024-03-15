export interface DbOpenOptions {
    dbName: string
    version?: number
    indexList?: any[]
    tableNameList?: string[]
    oldDb?: IDBDatabase | null,
    newTables?: any[] // 用于新增拓展的表
}

export enum DESC {
    UP = 'prev',
    DOWN = 'next'
}