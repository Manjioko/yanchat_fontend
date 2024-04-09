import { MainStore } from "@/view/Main/store"
import { storeToRefs } from "pinia"

const { imgLoadList } = storeToRefs(MainStore())

// 处理图片加载完成事件
export function handleLoadedEvent(chat_id: string) {
    if (imgLoadList.value.length) {
        const fdidx = imgLoadList.value.findIndex(f => f === chat_id)
        if (fdidx !== -1) {
            imgLoadList.value.splice(fdidx, 1)
        }
    }
}