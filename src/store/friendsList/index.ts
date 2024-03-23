export default {
    namespaced: true,
    state() {
        return {
            friendsList: [],
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
        }
    }
}