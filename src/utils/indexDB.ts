import vstore from '@/store'
import { DbOpenOptions } from '@/interface/indexDB'

export function dbOpen(options: DbOpenOptions) {
   
    // const store = useStore()
    const { dbName, version, indexList = [], tableNameList = [], oldDb = null } = options
    return new Promise((resolve, reject) => {
        let newVersion
        if (oldDb) {
            try {
                newVersion = oldDb.version + 1
                oldDb.close()
            } catch (error) {
                console.log('关闭旧数据库失败 -> ', error)
            }
        }
        const request = window.indexedDB.open(dbName, newVersion || version)
        request.onerror = event => {
            console.log('错误 -> ', event)
            reject(event)
        }
        request.onsuccess = event  => {
            const result = (event.target as IDBOpenDBRequest).result
            console.log('成功 -> ', result)
            resolve(result)
            // store.commit('namespeced/setDb', {
            //     db: event.target.result,
            //     dbName: dbName,
            //     dbVersion: newVersion || version,
            // })
        }
        request.onupgradeneeded = event => {
            
            const result = (event.target as IDBOpenDBRequest).result
            console.log('成功2 ->', result)
            const db = result
            tableNameList.forEach((table: string) => {
                const store = db.createObjectStore(table,{ keyPath: 'id' })
                indexList.forEach((item: {name: string, unique: boolean}) => {
                    store.createIndex(item.name, item.name, { unique: item.unique })
                })
            })
            
            // resolve(event.target.result)
        }
    })
}

export function dbAdd(tableName:String, data:any[]) {
    return new Promise((resolve, reject) => {
        if (!vstore.state.test.db || !data) return
        if (Array.isArray(data)) {
            const tran = vstore.state.dbbase.db.transaction([tableName], 'readwrite')
            const store = tran.objectStore(tableName)
            
            data.forEach(item => {
                store.add(item)
            })

            // 事务完成
            tran.oncomplete = (res: Event) => {
                resolve(res.type)
            };

            // 事务失败
            tran.onerror = (err: Event) => {
                reject(err.type)
            }
            
        } else {
            const request = vstore.state.dbbase.db
            .transaction([tableName], 'readwrite')
            .objectStore(tableName)
            .add(data)
            request.onsuccess = function(res: Event) {
                resolve(res.type)
            }
            request.onerror = (err: Event) => {
                reject(err.type)
            }
        }
    })
}

// 默认搜索是模糊搜索
export function dbRead(tableName: String, field: string, searchStr: string|number) {
    return new Promise((resolve, reject) => {
        if (!vstore.state.dbbase.db || !tableName) return
        const store = vstore.state.dbbase.db
        .transaction([tableName], 'readonly')
        .objectStore(tableName)

        const data: any = []
        const reg = new RegExp(`${searchStr.toString()}`)
        const cursorEvent =  store.openCursor()
        cursorEvent.onsuccess = (res: Event) => {
            const cursor = (res.target as IDBRequest).result
            if (cursor) {
                // console.log(cursor.value, field, cursor.value[field].match(reg))
                let filter
                if (typeof cursor.value[field] !== 'string') {
                    filter = cursor.value[field].toString().match(reg)?.[0]
                } else {
                    filter = cursor.value[field].match(reg)?.[0]
                }
                if (filter) {
                    data.push(cursor.value)
                }
                cursor.continue()
            } else {
                // console.log('没数据了',data)
                resolve(data)
            }
        }
        cursorEvent.onerror = (err: Event) => {
            reject(err.type)
        }
    })
}

// 精准搜索
export function dbReadByIndex(tableName: string, indexName: string, searchStr: string|number) {
    return new Promise((resolve, reject) => {
        const transaction = vstore.state.dbbase.db.transaction([tableName], 'readonly')
        const store = transaction.objectStore(tableName)
        const index = store.index(indexName)
        const request = index.get(searchStr)
    
        request.onsuccess = (e: Event) => {
            const { result } = e.target as IDBOpenDBRequest
            // console.log('result -> ', result)
            if (result) {
                resolve(result)
            }
        }
        request.onerror = (err: Event) => {
            reject(err.type)
        }
    })
}

// 删除数据库字段
export function dbDelete(tableName: string, key: number) {
    return new Promise((resolve, reject) => {
        if (!vstore.state.dbbase.db || !key) return
        const request = vstore.state.dbbase.db
        .transaction([tableName], 'readwrite')
        .objectStore(tableName)
        .delete(key)
        request.onsuccess = function(res: Event) {
            resolve(res.type)
        }
        request.onerror = (err: Event) => {
            reject(err.type)
        }
    })
}

// 更新数据库字段
export function dbUpdate(tableName: string, data: any) {
    return new Promise((resolve, reject) => {
        if (!vstore.state.dbbase.db || !data) return
        
        const transaction = vstore.state.dbbase.db.transaction([tableName], 'readwrite')
        const objectStore = transaction.objectStore(tableName)

        // 使用 key 参数来指定键
        const request = objectStore.put(data)

        request.onsuccess = function (event: Event) {
            console.log('更新成功 -> ', event)
            resolve(event.type);
        }

        request.onerror = function (error: Event) {
            console.log('更新失败 -> ', error)
            reject(error.type)
        }
    })
}