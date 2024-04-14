
import { defineStore } from "pinia"

export interface CommentQuoteState {
    showQuote: boolean
    comment: string

}
export const CommentQuoteStore = defineStore('components/comentQuote', {
    state: (): CommentQuoteState => ({
        showQuote: false,
        comment: '',
    }),
    actions: {}
})