import { throttle } from '@/utils/debounce'
import { saveChatWindowPosition } from '@/components/chatWindow/Methods/savePosition'
import { getChatFromServer } from '@/components/chatWindow/Methods/getData'
import { ChatWindowStore } from '@/components/chatWindow/store'
import { storeToRefs } from 'pinia'
import { SearchTextStore } from '@/components/searchText/store'

const { scrollData, boxScrollTop, scrollUpLock, scrollDownLock } = storeToRefs(ChatWindowStore())

const { searchTextLock } = storeToRefs(SearchTextStore())

const scrollOffsetAntiShakeFn = throttle(saveChatWindowPosition, 500)
// 滚动条事件处理
// 创建一个防抖实例函数
const scrollAntiShakeFn = throttle(getChatFromServer, 500)
// const refreshPage = throttle(refreshFn, 50)
export async function scrollEvent(val: { scrollTop: number }) {
    boxScrollTop.value = val.scrollTop
    if (!scrollData.value?.el) {
        // console.log('scrollData 没值 -> ', scrollData.value)
        return
    }
    // 搜索文字锁定状态下不允许滚动
    if (searchTextLock.value === 'Yes') return searchTextLock.value = 'No'

    
    // scrollOffsetAntiShakeFn()
    if (Math.floor(val.scrollTop) < 300 && scrollUpLock.value === 'UnLock') {
        console.log('滚到了顶部，需要获取数据了')
        scrollAntiShakeFn('No', 'prev')
    }
    if (val.scrollTop + scrollData.value.el.clientHeight + 5 >=
        scrollData.value.el.scrollHeight) {
            console.log('滚到了底部，需要获取数据了')
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