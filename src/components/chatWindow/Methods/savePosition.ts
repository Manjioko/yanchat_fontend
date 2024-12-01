import { ChatWindowStore } from '@/components/chatWindow/store'
import { jugeScrollOverScreen } from './jugeScrollOverScreen'
import { cutChatBox } from './cutChatBox'
import { setActionFriendPositionData, clearActionFriendPositionData } from './positionOperator'
const chatWindowStore = ChatWindowStore()

// 保存聊天窗口
export function saveChatWindowPosition() {
    const chatWindowRect =
        chatWindowStore.scrollData.scrollBar?.wrapRef?.getBoundingClientRect()
    const chatWindowEl = chatWindowStore.scrollData.scrollBar.wrapRef
    const children = chatWindowStore.scrollData.chatListDiv?.children
    if (!children || !chatWindowRect || !chatWindowEl) return
    const chatDivList: HTMLElement[] = [...children] as HTMLElement[]
    const canSaw: Box [] = []
    const ary = elementFilter(chatDivList, chatWindowEl)
    ary.forEach((el) => {
        const idx = el.dataset.checkIndex
        if (idx) {
            const time_id = chatWindowStore.chatBox[Number(idx)]?.time_id
            time_id && canSaw.push(chatWindowStore.chatBox[Number(idx)])
        }
    })

    // console.log('chatDivList -> ', ary, canSaw)

    if (!canSaw.length) return

    let firstId = canSaw.shift()
    let lastId = canSaw.pop()

    if (firstId && !lastId) {
        lastId = firstId
    }
    if (!firstId && lastId) {
        firstId = lastId
    }

    if (!firstId && !lastId) {
        console.log('extendFirst 或 extendLast 不存在')
        // deleteActionFriendPositionData()
        clearActionFriendPositionData()
        return
    }

    // flex_length 在不同长度的设备中和不同聊天记录的长度中，会表现出不同的长度
    // 所以需要做一个基准处理，即使用px像素为准，并且测量出占长度最小的聊天记录
    // 动态计算 flex_length 的长度,其中，最小的聊天记录为 64px
    const windowHeight = chatWindowRect.height
    const flex_length = Math.ceil(windowHeight / 64)

    const saveData: Position = {
        first: firstId?.time_id || 0,
        last: lastId?.time_id || 0,
        flex_length
    }

    // 更新定位数据
    console.log('定位信息 -> ', saveData)
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