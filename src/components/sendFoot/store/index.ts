import { defineStore } from 'pinia'
import { Box, Judge } from '@/interface/global'

export interface FootSendState {
    goToBottom: Judge
    pongSaveCacheData: Box[]
}

export const FootSendStore = defineStore('components/sendFoot', {
    state:(): FootSendState => ({
        goToBottom: Judge.NO,
        pongSaveCacheData: []
    }),
    actions: {
        setGotoBottomState(payload: any) {
            this.goToBottom = payload
        },
        setPongSaveCacheData(payload: Array<Box>) {
            this.pongSaveCacheData = payload
        }
    }
})