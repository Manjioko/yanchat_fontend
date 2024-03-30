import { RootState } from "../index"
import { Module } from "vuex"

export interface FriendsListState {
    friendsList: any[],
    fresh: boolean
}
const FriendsList:Module<FriendsListState, RootState> = {
    namespaced: true,
    state() {
        return {
            friendsList: [],
            fresh: false
        }
    },
    mutations: {
        updateFriendsList(state: any, payload: any) {
            if (Array.isArray(payload)) {
                console.log('state 更新好友列表 -> ', payload)
                state.friendsList = payload
                state.friendsList = payload
            }
        },
        addFriendsList(state: any, payload: any) {
            const exist = state.friendsList.find((v: any) => v.user_id === payload.user_id)
            if (exist) return
            state.friendsList.push(payload)
        },
        clearFriendsList(state: any) {
            state.friendsList = []
        },
        setRefreshFriendData(state: any, payload: boolean) {
            state.fresh = payload
        }
    }
}

export default FriendsList