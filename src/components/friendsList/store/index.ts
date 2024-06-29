import { defineStore } from 'pinia'
// import { RefreshMessage, Friend, UserInfo } from '@/interface/global'

export interface FriendsListState {
    friendsList: any[],
    fresh: boolean,
    freshTextTip: RefreshMessage,
    freshDeleteTextTip: RefreshMessage
    activeFriend: Friend
    userInfo: UserInfo,
    ollama:any,
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
        },
        activeFriend: {
            name: '',
            user_id: '',
            phone_number: '',
            chat_table: '',
            active: false,
            searchActive: false
        },
        userInfo:{
            friends: [],
            phone_number: '',
            user_id: '',
            user: ''
        },
        ollama: null
    }),
    getters: {
        positionId(): string {
            return this.activeFriend.user_id + this.activeFriend.chat_table
        }
    },
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
        },
        setActiveFriend(payload: Friend) {
            this.activeFriend = payload
        },
    }
})
