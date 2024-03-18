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
                state.friendsList = payload
            }
        },
        addFriendsList(state: any, payload: any) {
            state.friendsList.push(payload)
        },
        clearFriendsList(state: any) {
            state.friendsList = []
        }
    }
}