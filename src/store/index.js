import { createStore } from 'vuex'
import friendList from './friendList'
import test from './storeTest'
import dataBase from './dataBase'
import chatWindow from './chatWindow'

export default createStore({
    modules: {
        friendList,
        test,
        dataBase,
        chatWindow
    }, // 这里可以添加其他模块
})