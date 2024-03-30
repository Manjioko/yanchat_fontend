import { Module } from "vuex"
import { RootState } from "../index"

export interface ChatWindowState {
    scrollBar: any
    chatListEle: any
    scrollData: any
}

const ChatWindow:Module<ChatWindowState, RootState> = {
    namespaced: true,
    state() {
        return {
            scrollBar: null,
            chatListEle: null,
            scrollData: {}
        }
    },
    mutations: {
        setScrollBar(state: any, payload: any) {
            state.scrollBar = payload
        },
        setChatListEle(state: any, payload: any) {
            state.chatListEle = payload
        },
        setScrollData(state: any, payload: any) {
            state.scrollData = payload
        }
    }
}

export default ChatWindow