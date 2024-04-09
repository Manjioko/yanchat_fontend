export interface DbOpenOptions {
    dbName: string
    oldDb?: IDBDatabase | null,
    config: any[]
}

export enum DESC {
    UP = 'prev',
    DOWN = 'next'
}