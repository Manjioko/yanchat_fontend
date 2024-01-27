import { createStore } from 'vuex'
import friendList from './friendList'
import test from './storeTest'
import dataBase from './dataBase'

export default createStore({
    modules: {
        friendList,
        test,
        dataBase
    }, // 这里可以添加其他模块
})