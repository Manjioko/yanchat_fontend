import { defineStore } from 'pinia'
// import { Box, Judge } from '@/interface/global'

export interface FootSendState {
    isShowGoToNewBtn: Judge
    chatBoxCacheList: Box[]
    isGetGoToNewSingle: Judge
}

export const FootSendStore = defineStore('components/sendFoot', {
    state:(): FootSendState => ({
        isShowGoToNewBtn: 'No',
        chatBoxCacheList: [],
        isGetGoToNewSingle: 'No',
    }),
    actions: {
        setGotoBottomState(payload: any) {
            this.isShowGoToNewBtn = payload
        },
        setPongSaveCacheData(payload: Array<Box>) {
            this.chatBoxCacheList = payload
        }
    }
})