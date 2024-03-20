import vstore from '@/store'
import { DESC, DbOpenOptions } from '@/interface/indexDB'
import { Box, UserInfo, Friend, Tips } from '@/interface/global'
import typeIs from './type'


// indexDB 打开数据库
export function dbOpen(options: DbOpenOptions): Promise<IDBDatabase> {
    // const store = useStore()
    const { dbName,  oldDb = null, config } = options
    const version = localStorage.getItem('dbVersion') ? JSON.parse(localStorage.getItem('dbVersion') as string) : 2
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
            console.log('错误 -> ', event, dbName, newVersion || version)
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
            localStorage.setItem('dbVersion', JSON.stringify(result.version))
            resolve(result)
        }
        request.onupgradeneeded = event => {

            const result = (event.target as IDBOpenDBRequest).result
            const db = result
            config.forEach((table: any) => {
                console.log('table -> ', table, db.objectStoreNames)
                if (!db.objectStoreNames.contains(table.name)) {
                    const store = db.createObjectStore(table.name, table.key ? { keyPath: table.key } : { autoIncrement: true })
                    // console.log('store -> ', store)
                    table.indexList.forEach((item: { name: string, unique: boolean }) => {
                        store.createIndex(item.name, item.name, { unique: item.unique })
                    })
                }
            })
            
            localStorage.setItem('dbVersion', JSON.stringify(result.version))
        }
    })
}

// 数据库新增数据
export function dbAdd<T>(tableName: String, data: T[]):Promise<string> {
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
            }

            // 事务失败
            tran.onerror = (err: Event) => {

                const target = err.target as IDBRequest
                console.log('事务失败 -> ', target)
                reject(target.error?.message)
            }

            store.onerror = (err: Event) => {
                const target = err.target as IDBRequest
                console.log('store 失败 -> ', target)
                reject(target.error?.message)
            }

        } else {
            const tran = vstore.state.dataBase.db.transaction([tableName], 'readwrite')
            const store = tran.objectStore(tableName)
            store.add(data)
            // 事务完成
            tran.oncomplete = (res: Event) => {
                resolve(res.type)
            }

            // 事务失败
            tran.onerror = (err: Event) => {

                const target = err.target as IDBRequest
                reject(target.error?.message)
            }
        }
    })
}

// 默认搜索是模糊搜索
export function dbRead<T>(tableName: String, field: string, searchStr: string | number): Promise<T[]> {
    return new Promise((resolve, reject) => {
        if (!vstore.state.dataBase.db || !tableName) return
        const store = vstore.state.dbbase.db
            .transaction([tableName], 'readonly')
            .objectStore(tableName)

        const data:T[] = []
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

// 读取所有数据
export function dbReadAll<T>(tableName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
        if (!vstore.state.dataBase.db) return reject('数据库报错: db 不存在')
        try {
            const store = vstore.state.dataBase.db
            .transaction([tableName], 'readonly')
            .objectStore(tableName)
            if (!store) return
            const request = store.getAll()
            request.onsuccess = (res: Event) => {
                const target = res.target as IDBRequest
                resolve(target.result || [])
            }
            request.onerror = (err: Event) => {
                reject(err.type)
            }
        } catch(err) {
            reject(`数据库报错: ${err}`)
        }
    })
}

// 默认搜索是模糊搜索
export function dbReadSome(tableName: string, offset: number = 0): Promise<Box[]> {
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

        const reOffset = offset - 1 // 为什么要减去 1？ 因为 offset 值已经取过了，正确的取值应该从 offset 之前的一位开始
        const offsetLimit = reOffset! - 10 > 0 ? reOffset! - 10 : 0
        handler(offsetLimit, reOffset!)
        console.log('offset ->', reOffset, offsetLimit)
    })
}

// 精准搜索
export function dbReadByIndex<T>(tableName: string, indexName: string, searchStr: string | number): Promise<T> {
    return new Promise((resolve, reject) => {
        const transaction = vstore.state.dataBase.db.transaction([tableName], 'readonly')
        const store = transaction.objectStore(tableName)
        const index = store.index(indexName)
        const request = index.get(searchStr)

        request.onsuccess = (e: Event) => {
            // const { result } = e.target as IDBOpenDBRequest
            // // console.log('result -> ', result)
            // if (result) {
            //     resolve(request.result)
            // }
            resolve(request.result)
        }
        request.onerror = (err: Event) => {
            reject(err.type)
        }
    })
}

// 精确指定 offset 读取 10 条数据(可以指定从头读还是从尾读)
export function dbReadRange(tableName: string, offset: number, desc: DESC = DESC.UP, size:number = 10): Promise<Box[]> {
    console.log('获取数据 参数 -> ', desc, offset)
    return new Promise((resolve, reject) => {
        if (typeIs(vstore.state.dataBase.db) !== 'IDBDatabase') return reject('数据库不存在,请检查数据库是否打开')
        const store = (vstore.state.dataBase.db as IDBDatabase)
            .transaction([tableName], 'readonly')
            .objectStore(tableName)
        const box:Box[] = []
        let time:number = 0
        const bound = desc === DESC.DOWN ? IDBKeyRange.lowerBound(offset, true) : IDBKeyRange.upperBound(offset, true)
        const curReq = store.openCursor(bound, desc)
        curReq.onsuccess = (e: Event) => {
            const cur = (e.target as IDBRequest).result
            if (cur) {
                if (time < size) {
                    desc === DESC.UP ? box.unshift(cur.value) : box.push(cur.value)
                    time++
                    cur.continue()
                } else {
                    resolve(box)
                }
            } else {
                resolve(box)
            }
        },
        curReq.onerror = (err: Event) => {
            const target = err.target as IDBRequest
            reject(target.error?.message)
        }
    })
}

// 范围数据(通过 offset 区间读取数据)
export function dbReadRangeByArea(tableName: string, lowerOffset: number, upperOffset: number): Promise<Box[]> {
    return new Promise((resolve, reject) => {
        if (typeIs(vstore.state.dataBase.db) !== 'IDBDatabase') return reject('数据库不存在,请检查数据库是否打开')
        const store = (vstore.state.dataBase.db as IDBDatabase)
            .transaction([tableName], 'readonly')
            .objectStore(tableName)
        const box:Box[] = []
        console.log('offset -> ', lowerOffset, upperOffset)
        const lower = lowerOffset >= 0 ? lowerOffset : 0
        const upper = upperOffset >= 0 ? upperOffset : 0
        const curReq = store.openCursor(IDBKeyRange.bound(lower, upper, false, false))
        curReq.onsuccess = (e: Event) => {
            const cur = (e.target as IDBRequest).result
            if (cur) {
                box.push(cur.value)
                cur.continue()
            } else {
                resolve(box)
            }
        },
        curReq.onerror = (err: Event) => {
            const target = err.target as IDBRequest
            reject(target.error?.message)
        }
    })
}

// 不通过 offset 获取数据(默认获取最新的 10 条)
export function dbReadRangeNotOffset(tableName: string, desc: DESC = DESC.UP, size: number = 10): Promise<Box[]> {
    return new Promise((resolve,reject) => {
        if (typeIs(vstore.state.dataBase.db) !== 'IDBDatabase') return reject('数据库不存在,请检查数据库是否打开')
        const store = (vstore.state.dataBase.db as IDBDatabase)
            .transaction([tableName], 'readonly')
            .objectStore(tableName)

        const handler = (offset: number) => {
            const cursorEvent = store.openCursor(IDBKeyRange.upperBound(offset), desc)
            const data: Box[] = []
            let time: number = 0
            cursorEvent.onsuccess = (res: Event) => {
                const cursor = (res.target as IDBRequest).result
                if (cursor) {
                    if (time < size) {
                        desc === DESC.UP ? data.unshift(cursor.value) : data.push(cursor.value)
                        time++
                        cursor.continue()
                    } else {
                        resolve(data)
                    }
                } else {
                    // console.log('没数据了 ->', data)
                    resolve(data)
                }
            }
            cursorEvent.onerror = (err: Event) => {
                const target = err.target as IDBRequest
                reject(target.error?.message)
            }
        }

        const keyCursorRequest = store.openKeyCursor(null, 'prev')
        keyCursorRequest.onsuccess = (res: Event) => {
            const result = (res.target as IDBRequest).result
            if (result) {
                handler(result.primaryKey)
            } else {
                resolve([])
            }
        }

        keyCursorRequest.onerror = (err: Event) => {
            const target = err.target as IDBRequest
            reject(target.error?.message)
        }
        
    })
}

// 获取最后一条数据 key
export function dbGetLastPrimaryKey(tableName: string): Promise<number | undefined> {
    return new Promise((resolve, reject) => {
        if (typeIs(vstore.state.dataBase.db) !== 'IDBDatabase') return reject('数据库不存在,请检查数据库是否打开')
        const store = (vstore.state.dataBase.db as IDBDatabase)
            .transaction([tableName], 'readonly')
            .objectStore(tableName)
        const keyCursorRequest = store.openKeyCursor(null, 'prev')
        keyCursorRequest.onsuccess = (res: Event) => {
            const result = (res.target as IDBRequest).result
            if (result) {
                resolve(result.primaryKey)
            } else {
                resolve(undefined)
            }
        }

        keyCursorRequest.onerror = (err: Event) => {
            const target = err.target as IDBRequest
            reject(target.error?.message)
        }
    })
}

// 通过 key 删除数据库字段
export function dbDeleteByKey(tableName: string, key: number): Promise<string> {
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

// 通过 index 来删除字段
export function dbDeleteByIndex(tableName: string, indexName: string, searchStr: string): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!vstore.state.dataBase.db || !indexName) return
        const tran = vstore.state.dataBase.db.transaction([tableName], 'readwrite') as IDBTransaction
        const sto = tran.objectStore(tableName) as IDBObjectStore
        const cursor = sto.openCursor() as IDBRequest
        cursor.onsuccess = () => {
            const cur = cursor.result as IDBCursorWithValue
            if (cur) {
                if (cur.value[indexName] === searchStr) {
                    const request = sto.delete(cur.key)
                    request.onsuccess = (res: Event) => {
                        resolve(res.type)
                    }
                    request.onerror = (err: Event) => {
                        reject(err.type)
                    }
                }
                cur.continue()
            } else {
                resolve('success')
            }
        }
        cursor.onerror = (err: Event) => {
            reject(err.type)
        }
    })
}

// 更新数据库字段
export function dbUpdate(tableName: string, data: Box): Promise<string> {
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

export function initDdOperate(userInfo: UserInfo, oldDB?: IDBDatabase): Promise<IDBDatabase> {
    if (oldDB) {
        console.log('准备更新版本号, 更新数据库 -> ', oldDB)
    }
    const friends = JSON.parse(userInfo.friends) || []
    const indexList = [
        { name: 'user_id', unique: false },
        { name: 'id', unique: true },
        { name: 'table_id', unique: false },
        { name: 'user', unique: false },
        { name: 'phone_number', unique: false },
    ]
    // 消息系统表结构
    const tipsTable =  {
        name: 'tips_messages',
        key: null,
        indexList: [
            { name: 'messages_id',unique: true },
            { name: 'messages_box', unique: false },
            { name: 'messages_type', unique: false }
        ]
    }
    const initConfig = friends.map((item: Friend) => ({ name: item.chat_table, key: 'id', indexList }))
    initConfig.push(tipsTable)
    return dbOpen({
        dbName: userInfo.user_id,
        config: initConfig,
        oldDb: oldDB,
    })
}