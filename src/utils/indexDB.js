import { useStore } from 'vuex'
const store = useStore()

export function dbOpen(options) {
   
    // const store = useStore()
    const { dbName = 'yanchat', version = 1, indexList = [], tableNameList = [], oldDb = null } = options
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
            console.log('错误 -> ', event.target.error)
            reject(event.target.error)
        }
        request.onsuccess = event => {
            console.log('成功 -> ', event.target.result)
            resolve(event.target.result)
            // store.commit('namespeced/setDb', {
            //     db: event.target.result,
            //     dbName: dbName,
            //     dbVersion: newVersion || version,
            // })
        }
        request.onupgradeneeded = event => {
            console.log('成功2 ->', event.target.result)
            const db = event.target.result
            tableNameList.forEach(table => {
                const store = db.createObjectStore(table,{ keyPath: 'id' })
                indexList.forEach(item => {
                    store.createIndex(item.name, item.name, { unique: item.unique })
                })
            })
            
            // resolve(event.target.result)
        }
    })
}

export function dbAdd(tableName, data) {
    return new Promise((resolve, reject) => {
        if (!store.state.test.db || !data) return
        if (Array.isArray(data)) {
            const tran = store.state.test.db.transaction([tableName], 'readwrite')
            const store = tran.objectStore(tableName)
            
            data.forEach(item => {
                store.add(item)
            })

            // 事务完成
            tran.oncomplete = res => {
                resolve(res.type)
            };

            // 事务失败
            tran.onerror = err => {
                reject(err.type)
            }
            
        } else {
            const request = store.state.test.db
            .transaction([tableName], 'readwrite')
            .objectStore(tableName)
            .add(data)
            request.onsuccess = function(res) {
                resolve(res.type)
            }
            request.onerror = err => {
                reject(err.type)
            }
        }
    })
}

// 默认搜索是模糊搜索
export function dbRead(tableName, field, searchStr) {
    return new Promise((resolve, reject) => {
        if (!store.state.test.db || !tableName) return
        const store = store.state.test.db
        .transaction([tableName], 'readonly')
        .objectStore(tableName)

        const data = []
        const reg = new RegExp(`${searchStr.toString()}`)
        const cursorEvent =  store.openCursor()
        cursorEvent.onsuccess = res => {
            const cursor = res.target.result
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
        cursorEvent.onerror = err => {
            reject(err.type)
        }
    })
}

// 精准搜索
export function dbReadByIndex(tableName, indexName, searchStr) {
    return new Promise((resolve, reject) => {
        const transaction = store.state.test.db.transaction([tableName], 'readonly')
        const store = transaction.objectStore(tableName)
        const index = store.index(indexName)
        const request = index.get(searchStr)
    
        request.onsuccess = e => {
            const { result } = e.target
            // console.log('result -> ', result)
            if (result) {
                resolve(result)
            }
        }
        request.onerror = err => {
            reject(err.type)
        }
    })
}

// 删除数据库字段
export function dbDelete(tableName, key) {
    return new Promise((resolve, reject) => {
        if (!store.state.test.db || !key) return
        const request = store.state.test.db
        .transaction([tableName], 'readwrite')
        .objectStore(tableName)
        .delete(key)
        request.onsuccess = function(res) {
            resolve(res.type)
        }
        request.onerror = err => {
            reject(err.type)
        }
    })
}

// 更新数据库字段
export function dbUpdate(tableName, data) {
    return new Promise((resolve, reject) => {
        if (!store.state.test.db || !data) return;
        
        const transaction = store.state.test.db.transaction([tableName], 'readwrite');
        const objectStore = transaction.objectStore(tableName);

        // 使用 key 参数来指定键
        const request = objectStore.put(data);

        request.onsuccess = function (event) {
            console.log('更新成功 -> ', event);
            resolve(event.type);
        };

        request.onerror = function (error) {
            console.log('更新失败 -> ', error);
            reject(error.type);
        };
    });
}