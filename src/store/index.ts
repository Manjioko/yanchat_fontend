import { Store, createStore } from 'vuex'
import friendList from './friendList'
import test from './storeTest'
import dataBase from './dataBase'
import chatWindow from './chatWindow'
import footSend from './footSend'
import global from './global'

export default createStore({
    modules: {
        friendList,
        test,
        dataBase,
        chatWindow,
        footSend,
        global
    }, // 这里可以添加其他模块
}) as Store<any>