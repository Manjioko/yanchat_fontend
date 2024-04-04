import { MainStore } from "../store"
import { FootSendStore } from "@/components/sendFoot/store"
import { Judge } from "@/interface/global"
import { storeToRefs } from "pinia"

const mainStore = MainStore()
const footSendStore = FootSendStore()

const { goToBottom } = storeToRefs(footSendStore)
const { isLastChatList, receivedShowGotoBottom, chatBox } = storeToRefs(mainStore)



export function jugeScrollOverScreen(elList: HTMLElement[]) {
    if (!elList.length || !elList[elList.length - 1].dataset.checkIndex) return
    const box = chatBox.value
    const screenHeight = elList.length
    const safeNumber = box.length - Number(elList[elList.length - 1].dataset.checkIndex)
    // 判断是否超过了一个屏幕
    if (safeNumber && safeNumber > screenHeight) {

        if (goToBottom.value === Judge.NO && isLastChatList.value === Judge.YES) {
            console.log('超过一个屏幕的距离')
            receivedShowGotoBottom.value = Judge.YES
        }
    }

    // 判断是否到底
    if (
        (box.length - 1) === Number(elList[elList.length - 1].dataset.checkIndex)
        &&
        isLastChatList.value === Judge.YES
    ) {
        console.log('已经到底了😂')
        goToBottom.value = Judge.NO
    }
}