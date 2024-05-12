
import { defineStore } from "pinia"

export interface SearchTextState {
    searchTextLock: Judge

}
export const SearchTextStore = defineStore('components/searchText', {
    state: (): SearchTextState => ({
        searchTextLock: 'No',
    }),
    actions: {}
})