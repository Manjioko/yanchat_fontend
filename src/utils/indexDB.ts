import vstore from '@/store'
import { DbOpenOptions } from '@/interface/indexDB'
import { Box } from '@/interface/global'

export function dbOpen(options: DbOpenOptions) {

    // const store = useStore()
    const { dbName, version = 1, indexList = [], tableNameList = [], oldDb = null } = options
    return new Promise((resolve, reject) => {
        let newVersion: number | null = null
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
        request.onsuccess = event => {
            const result = (event.target as IDBOpenDBRequest).result
            console.log('数据库打开成功', result)
            vstore.commit('dataBase/setDb', {
                db: result,
                dbName: dbName,
                dbVersion: newVersion || version,
            })
            resolve(result)
            // console.log('vstore -> ',vstore)
        }
        request.onupgradeneeded = event => {

            const result = (event.target as IDBOpenDBRequest).result
            // console.log('成功2 ->', result)
            const db = result
            tableNameList.forEach((table: string) => {
                const store = db.createObjectStore(table, { keyPath: 'id' })
                console.log('store -> ', store)
                indexList.forEach((item: { name: string, unique: boolean }) => {
                    store.createIndex(item.name, item.name, { unique: item.unique })
                })
            })

            // resolve(event.target.result)
        }
    })
}

export function dbAdd(tableName: String, data: Box[]) {
    return new Promise((resolve, reject) => {
        if (!vstore.state.dataBase.db || !data) return
        if (Array.isArray(data)) {
            console.log('tablename -> ', tableName)
            const tran = vstore.state.dataBase.db.transaction([tableName], 'readwrite')
            const store = tran.objectStore(tableName)

            data.forEach(item => {
                // console.log('data is -> ', item)
                store.add(item)
            })

            // 事务完成
            tran.oncomplete = (res: Event) => {
                resolve(res.type)
            };

            // 事务失败
            tran.onerror = (err: Event) => {

                const target = err.target as IDBRequest
                reject(target.error?.message)
            }

        } else {
            const request = vstore.state.dbbase.db
                .transaction([tableName], 'readwrite')
                .objectStore(tableName)
                .add(data)
            request.onsuccess = function (res: Event) {
                resolve(res.type)
            }
            request.onerror = (err: Event) => {
                reject(err.type)
            }
        }
    })
}

// 默认搜索是模糊搜索
export function dbRead(tableName: String, field: string, searchStr: string | number) {
    return new Promise((resolve, reject) => {
        if (!vstore.state.dataBase.db || !tableName) return
        const store = vstore.state.dbbase.db
            .transaction([tableName], 'readonly')
            .objectStore(tableName)

        const data:Box[] = []
        const reg = new RegExp(`${searchStr.toString()}`)
        const cursorEvent = store.openCursor()
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

export function dbReadAll(tableName: string): Promise<Box[]> {
    return new Promise((resolve, reject) => {
        // if (!vstore.state.dataBase.db || !tableName) return
        const store = vstore.state.dataBase.db
            .transaction([tableName], 'readonly')
            .objectStore(tableName)

        const request = store.getAll()
        request.onsuccess = (res: Event) => {
            const target = res.target as IDBRequest
            // console.log('数据是 -> ', target.result)
            resolve(target.result || [])
        }
        request.onerror = (err: Event) => {
            reject(err.type)
        }
    })
}

export function dbReadSome(tableName: string, offset: number = 0, oldOffset:number = 0): Promise<Box[]> {
    return new Promise((resolve, reject) => {
        const store = vstore.state.dataBase.db
            .transaction([tableName], 'readonly')
            .objectStore(tableName)

        const handler = (startIndex: number, endIndex: number) => {
            if (startIndex === endIndex) return resolve([])
            const cursorEvent = store.openCursor(IDBKeyRange.bound(startIndex, endIndex, true, false))
            const data: Box[] = []
            cursorEvent.onsuccess = (res: Event) => {
                const cursor = (res.target as IDBRequest).result
                if (cursor) {
                    // console.log(cursor.value, field, cursor.value[field].match(reg))
                    data.push(cursor.value)
                    cursor.continue()
                } else {
                    console.log('没数据了 ->', data)
                    resolve(data)
                }
            }
            cursorEvent.onerror = (err: Event) => {
                reject(err.type)
            }
        }
        // oldOffset < offset
        if (offset === 0) {
            const keyCursorRequest = store.openKeyCursor(null, 'prev')
            keyCursorRequest.onsuccess = (res: Event) => {
                const result = (res.target as IDBRequest).result
                let reOffset: number | null = null
                let offsetLimit: number | null = null
                console.log('target ->', res.target)
                reOffset = result?.primaryKey || 0
                offsetLimit = reOffset! - 10 > 0 ? reOffset! - 10 : 0
                handler(offsetLimit, reOffset!)
            }
        } else {
            const reOffset = offset - 1 // 为什么要减去 1？ 因为 offset 值已经取过了，正确的取值应该从 offset 之前的一位开始
            const offsetLimit = reOffset! - 10 > 0 ? reOffset! - 10 : 0
            handler(offsetLimit, reOffset!)
            console.log('offset ->', reOffset, offsetLimit)
        }
    })
}

// 精准搜索
export function dbReadByIndex(tableName: string, indexName: string, searchStr: string | number) {
    return new Promise((resolve, reject) => {
        const transaction = vstore.state.dataBase.db.transaction([tableName], 'readonly')
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
        request.onsuccess = function (res: Event) {
            resolve(res.type)
        }
        request.onerror = (err: Event) => {
            reject(err.type)
        }
    })
}

// 更新数据库字段
export function dbUpdate(tableName: string, data: Box) {
    return new Promise((resolve, reject) => {
        if (!vstore.state.dataBase.db || !data) return

        const transaction = vstore.state.dataBase.db.transaction([tableName], 'readwrite')
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