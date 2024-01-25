import { createStore } from 'vuex'
import friendList from './friendList'
import test from './storeTest'

export default createStore({
    modules: {
        friendList,
        test
    }, // 这里可以添加其他模块
})