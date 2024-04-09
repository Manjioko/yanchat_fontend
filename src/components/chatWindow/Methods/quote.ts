import { storeToRefs } from 'pinia'
import { MainStore } from '@/view/Main/store'

const {
    chatBox,
    showQuote,
    comment,
}  = storeToRefs(MainStore())

// windowChat 引用回调
export async function handleQuoteEvent(idx: number) {
    showQuote.value = true
    if (chatBox.value[idx].type !== 'text') {
        comment.value = '[文件] ' + chatBox.value[idx].fileName
    } else {
        comment.value = chatBox.value[idx].text
    }
}

// 关掉引用窗口
export function handleQuoteCloseEvent() {
    comment.value = ''
    showQuote.value = false
}