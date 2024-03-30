import { Store, createStore, useStore as baseUseStore } from 'vuex'
import friendsList, { FriendsListState } from './friendsList'
// import test from './storeTest'
import dataBase, { DataBaseState } from './dataBase'
import chatWindow, { ChatWindowState } from './chatWindow'
import footSend, { FootSendState } from './footSend'
import global, { GlobalState } from './global'
import { InjectionKey } from 'vue'


export interface RootState {}

export default createStore<RootState>({
    modules: {
        friendsList,
        // test,
        dataBase,
        chatWindow,
        footSend,
        global
    }, // 这里可以添加其他模块
})

type Module = {
    global: GlobalState,
    friendsList: FriendsListState,
    dataBase: DataBaseState,
    footSend: FootSendState,
    chatWindow: ChatWindowState
}

export function useStore() {
    return baseUseStore(key)
} 

export const key: InjectionKey<Store<RootState &  Module>> = Symbol()