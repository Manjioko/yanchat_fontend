export interface DbOpenOptions {
    dbName: string
    version: number
    oldDb?: IDBDatabase | null,
    config: any[]
}

export enum DESC {
    UP = 'prev',
    DOWN = 'next'
}