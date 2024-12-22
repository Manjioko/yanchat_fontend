import debounce from '@/utils/debounce'
import { saveChatWindowPosition } from '@/components/chatWindow/Methods/savePosition'
import { getChatFromServer } from '@/components/chatWindow/Methods/getData'
import { ChatWindowStore } from '@/components/chatWindow/store'
import { storeToRefs } from 'pinia'
import { SearchTextStore } from '@/components/searchText/store'

const { scrollData, boxScrollTop, scrollUpLock, scrollDownLock } = storeToRefs(ChatWindowStore())

const { searchTextLock } = storeToRefs(SearchTextStore())

const scrollOffsetAntiShakeFn = debounce(saveChatWindowPosition, 500)
// 滚动条事件处理
// 创建一个防抖实例函数
const scrollAntiShakeFn = debounce(getChatFromServer)
export async function scrollEvent(val: { scrollTop: number }) {
    if (!scrollData.value?.el) {
        // console.log('scrollData 没值 -> ', scrollData.value)
        return
    }
    // 搜索文字锁定状态下不允许滚动
    if (searchTextLock.value === 'Yes') return searchTextLock.value = 'No'

    boxScrollTop.value = val.scrollTop
    scrollOffsetAntiShakeFn()
    // if (!scrollData.value?.el) return
    if (Math.floor(val.scrollTop) === 0 && scrollUpLock.value === 'UnLock') {
        console.log('滚到了顶部，需要获取数据了')
        scrollAntiShakeFn('No', 'prev')
    }
    if (
        val.scrollTop + scrollData.value.el.clientHeight + 5 >=
        scrollData.value.el.scrollHeight &&
        scrollDownLock.value === 'UnLock'
    ) {
        console.log('滚到了底部，需要获取数据了')
        scrollAntiShakeFn('No', 'next')
    }
}

export function scrollEventMobile(position: string) {
    if (position === 'top' && scrollUpLock.value === 'UnLock') {
        console.log('滚到了顶部，需要获取数据了')
        scrollAntiShakeFn('No', 'prev')
    }
    if (
        position === 'bottom' &&
        scrollDownLock.value === 'UnLock'
    ) {
        console.log('滚到了底部，需要获取数据了')
        scrollAntiShakeFn('No', 'next')
    }
}