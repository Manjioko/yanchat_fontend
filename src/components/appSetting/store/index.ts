import { defineStore } from 'pinia'
// import { ScrollData } from '@/interface/chatWindow'
// import { Box } from '@/interface/global'

export interface AppSettingState {
    avatarRefresh: string
}

export const AppSettingStore = defineStore('components/appSetting', {
    state:(): AppSettingState => ({
        avatarRefresh: ''
    })
})