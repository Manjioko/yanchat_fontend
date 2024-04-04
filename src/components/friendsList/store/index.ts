import { defineStore } from 'pinia'
import { RefreshMessage } from '@/interface/global'

export interface FriendsListState {
    friendsList: any[],
    fresh: boolean,
    freshTextTip: RefreshMessage,
    freshDeleteTextTip: RefreshMessage
}
export const FriendsListStore = defineStore('components/friendsList', {
    state:(): FriendsListState => ({
        friendsList: [],
        fresh: false,
        freshTextTip: {
            chat: null
        },
        freshDeleteTextTip: {
            chat: null
        }
    }),
    actions: {
        updateFriendsList(payload: any) {
            if (Array.isArray(payload)) {
                console.log('state 更新好友列表 -> ', payload)
                this.friendsList = payload
            }
        },
        addFriendsList(payload: any) {
            const exist = this.friendsList.find((v: any) => v.user_id === payload.user_id)
            if (exist) return
            this.friendsList.push(payload)
        },
        clearFriendsList() {
            this.friendsList = []
        },
        setRefreshFriendData(payload: boolean) {
            this.fresh = payload
        }
    }
})