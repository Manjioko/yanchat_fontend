export function openDB(options) {
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

export function dbAdd(db, tableName, data) {
    return new Promise((resolve, reject) => {
        if (!db || !data) return
        const request = db
        .transaction([tableName], 'readwrite')
        .objectStore(tableName)
        .add(data)
        request.onsuccess = function(res) {
            resolve(res.type)
        }
        request.onerror = err => {
            reject(err.type)
        }
    })
}

// 默认搜索是模糊搜索
export function dbRead(db, tableName, field, searchStr) {
    return new Promise((resolve, reject) => {
        if (!db || !tableName) return
        const store = db
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

export function dbReadByIndex(db, tableName, indexName, searchStr) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([tableName], 'readonly')
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

openDB({
    dbName: 'yanchat',
    version: 1,
    indexList: [
        {
            name: 'id',
            unique: true
        }
    ],
    tableNameList: [
        'yanchat_table1',
        'yanchat_table2'
    ],
    oldDb: null
}).then(db => {
    // dbAdd(db, 'yanchat_table1', {id: 2, name: 'fuckworld', type: 'video'})
    // .then(res => {
    //     console.log('success -> ', res)
    // }).catch(err => {
    //     console.log('err -> ', err)
    // })
    console.log('db -> ', db)
    // dbRead(db, 'yanchat_table1', 'id', 1).then(res => {
    //     console.log('res -> ', res)
    // })
    // dbReadByIndex(db, 'yanchat_table1', 'id', 1).then(res => {
    //     console.log('返回值 -> ', res)
    // })
    // if (db) {
    //     openDB({
    //         dbName: 'yanchat',
    //         version: 2,
    //         indexList: [
    //             {
    //                 name: 'id2',
    //                 unique: true
    //             }
    //         ],
    //         tableNameList: [
    //             'yanchat_table3',
    //             'yanchat_table4'
    //         ],
    //         oldDb: db
    //     })
    // }
})