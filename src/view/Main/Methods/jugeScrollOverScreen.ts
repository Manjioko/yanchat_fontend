import { MainStore } from "../store"
import { FootSendStore } from "@/components/sendFoot/store"
import { Judge } from "@/interface/global"
import { deleteActionFriendPositionData } from '../Methods/positionOperator'
// import typeIs from "@/utils/type"
import { storeToRefs } from "pinia"
import { ChatWindowStore } from "@/components/chatWindow/store"

const mainStore = MainStore()
const footSendStore = FootSendStore()

const chatWindowStore = ChatWindowStore()

const { goToBottom, receivedShowGotoBottom } = storeToRefs(footSendStore)
// const {   } = storeToRefs(mainStore)

const { scrollData } = storeToRefs(chatWindowStore)
const { isLastChatList, chatBox } = storeToRefs(chatWindowStore)



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

        // 判断是否到底,计算量和应用较大，将它包裹在一个独立的作用域里，防止内存占用过大
        {
            const bar = scrollData.value?.scrollBar?.wrapRef
            if (bar) {
                if (bar.scrollTop && bar.clientHeight && bar.scrollHeight) {
                    if (bar.scrollTop + bar.clientHeight >= bar.scrollHeight) {
                        console.log('已经到底了😂')
                        goToBottom.value = Judge.NO
                        // 一旦到底了, 就不需要定位，不然可能会出现问题
                        deleteActionFriendPositionData()
                    }
                }
            }
        }

    }
}