import { Store, createStore } from 'vuex'
import friendList from './friendList'
import test from './storeTest'
import dataBase from './dataBase'
import chatWindow from './chatWindow'
import footSend from './footSend'

export default createStore({
    modules: {
        friendList,
        test,
        dataBase,
        chatWindow,
        footSend
    }, // 这里可以添加其他模块
}) as Store<any>