import { defineStore } from 'pinia'
import { Box } from '@/interface/global'

export interface FootSendState {
    goToBottom: boolean
    pongSaveCacheData: Box[]
}

export const sendFootStore = defineStore('components/sendFoot', {
    state:(): FootSendState => ({
        goToBottom: false,
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