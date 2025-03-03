import { FootSendStore } from "@/components/sendFoot/store"
// import { deleteActionFriendPositionData } from '../Methods/positionOperator'
import { storeToRefs } from "pinia"
import { ChatWindowStore } from "@/components/chatWindow/store"

const footSendStore = FootSendStore()

const chatWindowStore = ChatWindowStore()

const { isShowGoToNewBtn, isGetGoToNewSingle } = storeToRefs(footSendStore)
const { scrollData } = storeToRefs(chatWindowStore)
const { isLastChatList, chatBox } = storeToRefs(chatWindowStore)



export function jugeScrollOverScreen(elList: HTMLElement[]) {
    if (!elList.length || !elList[elList.length - 1].dataset.checkIndex) return
    const box = chatBox.value
    const screenHeight = elList.length
    const safeNumber = box.length - Number(elList[elList.length - 1].dataset.checkIndex)
    // 判断是否超过了一个屏幕
    if (safeNumber && safeNumber > screenHeight) {

        if (isShowGoToNewBtn.value === 'No' && isLastChatList.value === 'Yes') {
            console.log('超过一个屏幕的距离')
            isGetGoToNewSingle.value = 'Yes'
        }
    }

    // 判断是否到底
    if (
        (box.length - 1) === Number(elList[elList.length - 1].dataset.checkIndex)
        &&
        isLastChatList.value === 'Yes'
    ) {

        // 判断是否到底,计算量和应用较大，将它包裹在一个独立的作用域里，防止内存占用过大
        {
            const bar = scrollData.value?.scrollBar?.wrapRef
            if (bar) {
                if (bar.scrollTop && bar.clientHeight && bar.scrollHeight) {
                    if (Math.ceil(bar.scrollTop + bar.clientHeight) >= bar.scrollHeight) {
                        // console.log('已经到底了😂')
                        isShowGoToNewBtn.value = 'No'
                        isGetGoToNewSingle.value = 'No'
                        // 一旦到底了, 就不需要定位，不然可能会出现问题
                        // deleteActionFriendPositionData()
                    }
                }
            }
        }

    }
}