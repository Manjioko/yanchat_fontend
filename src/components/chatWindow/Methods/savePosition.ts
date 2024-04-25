import { ChatWindowStore } from '@/components/chatWindow/store'
import { jugeScrollOverScreen } from './jugeScrollOverScreen'
import { cutChatBox } from './cutChatBox'
import { setActionFriendPositionData } from './positionOperator'
const chatWindowStore = ChatWindowStore()

// 保存聊天窗口
export function saveChatWindowPosition() {
    const chatWindowRect =
        chatWindowStore.scrollData.scrollBar?.wrapRef?.getBoundingClientRect()
    const chatWindowEl = chatWindowStore.scrollData.scrollBar.wrapRef
    const children = chatWindowStore.scrollData.chatListDiv?.children
    if (!children || !chatWindowRect || !chatWindowEl) return
    const chatDivList: HTMLElement[] = [...children] as HTMLElement[]
    const canSaw: string | number [] = []
    const ary = elementFilter(chatDivList, chatWindowEl)
    ary.forEach((el) => {
        const idx = el.dataset.checkIndex
        if (idx) {
            const id = chatWindowStore.chatBox[Number(idx)]?.id
            id && canSaw.push(id)
        }
    })

    if (!canSaw.length) return

    const firstId = canSaw.shift()
    const lastId = canSaw.pop()

    if (!firstId ||  !lastId) {
        console.log('extendFirst 或 extendLast 不存在')
        // deleteActionFriendPositionData()
        return
    }
    const saveData: Position = {
        first: Number(firstId) - Math.ceil(chatWindowStore.scrollSafeLength / 2),
        last: Number(lastId) + Math.ceil(chatWindowStore.scrollSafeLength / 2),
        use: Number(firstId)
    }
    // 存储位置信息
    setActionFriendPositionData(saveData)
    // console.log('定位信息 -> ', saveData)
    // 判断聊天记录向下滚动是否超过了一个屏幕
    jugeScrollOverScreen(ary)
    // 计算多余的聊天记录，如果数量过多，需要裁掉一部分，节省内存
    cutChatBox(ary)
}


function elementFilter(elList: HTMLElement[], container: HTMLElement): HTMLElement[] {
    if (!elList.length) return []
    const { top, bottom } = container.getBoundingClientRect()
    const mid = elList.length === 1 ? 0 : Math.ceil(elList.length / 2)
    const midEl = elList[mid]
    const { top: midTop, bottom: midBottom } = midEl.getBoundingClientRect()

    // 在顶部的情况
    if (midTop < top && midBottom < bottom) {
        const newElList = elList.slice(mid)
        // console.log('newElList length -> ', newElList.length)
        return newElList.length <= 1 ? newElList : elementFilter(newElList, container)
    }

    // 在底部的情况
    if (midTop > top && midBottom > bottom) {
        const newElList = elList.slice(0, mid)
        return newElList.length <= 1 ? newElList : elementFilter(newElList, container)
    }

    // 在显示范围内的情况
    // 分两步走，1 向左遍历 2 向右遍历，找出所有在显示氛围内的元素
    
    // 第一种情况
    let idx = mid - 1 
    const leftAry = []
    while(idx >= 0) {
        const rect = elList[idx].getBoundingClientRect()
        if (rect.bottom > top && rect.top < bottom) {
            leftAry.unshift(elList[idx])
        }
        idx--
    }

    // 第二种情况
    idx = mid
    const rightAry = []
    while(idx < elList.length) {
        const rect = elList[idx].getBoundingClientRect()
        if (rect.bottom > top && rect.top < bottom) {
            rightAry.push(elList[idx])
        }
        idx++
    }
    return [...leftAry, ...rightAry]
}