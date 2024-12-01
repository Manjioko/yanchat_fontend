// import { MainStore } from "../store"
// import { Locked } from "@/interface/global"
import { ChatWindowStore } from "@/components/chatWindow/store"
import { nextTick } from "vue"

// const mainStore = MainStore()
const chatWindowStore = ChatWindowStore()


export function cutChatBox(elList: HTMLElement[]) {
    if (!elList.length) return


    const screenFirstIndex = elList[0].dataset.checkIndex
    if (!screenFirstIndex) return

    const screenLength = elList.length

    // const boxLength = MainStore().chatBox.length
    const isOver4 = Number(screenFirstIndex) > screenLength * 4

    if (isOver4) {
        console.log('顶部数据超过窗口距离的 4 倍了', Math.ceil(2 / 3 * Number(screenFirstIndex)), screenFirstIndex)
        chatWindowStore.chatBox = chatWindowStore.chatBox.slice(Math.ceil(2 / 3 * Number(screenFirstIndex)))
        // 一旦裁剪完毕，一定记得将锁设置为解锁
        nextTick(() => {
            chatWindowStore.scrollUpLock = 'UnLock'
        })
    }
}