import debounce from '@/utils/debounce'
import { saveChatWindowPosition } from '@/view/Main/Methods/savePosition'
import { getChatFromServer } from '@/components/chatWindow/Methods/getData'
import { ChatWindowStore } from '@/components/chatWindow/store'
import { storeToRefs } from 'pinia'
// import { IsSwitchFriend, Locked } from '@/interface/global'
// import { DESC } from '@/interface/indexDB'
// import { MainStore } from '@/view/Main/store'

// const {  } = storeToRefs(MainStore())

const { scrollData, boxScrollTop, scrollUpLock, scrollDownLock } = storeToRefs(ChatWindowStore())

const scrollOffsetAntiShakeFn = debounce(saveChatWindowPosition, 500)
// 滚动条事件处理
// 创建一个防抖实例函数
const scrollAntiShakeFn = debounce(getChatFromServer)
export async function scrollEvent(val: { scrollTop: number }) {
    // console.log('handleScroll scrollUpLock -> ', scrollUpLock)
    if (!scrollData.value?.el) {
        console.log('scrollData 没值2 -> ', scrollData.value)
        return
    }
    boxScrollTop.value = val.scrollTop
    scrollOffsetAntiShakeFn()
    // if (!scrollData.value?.el) return
    if (Math.floor(val.scrollTop) === 0 && scrollUpLock.value === 'UnLock') {
        scrollAntiShakeFn('No', 'prev')
    }
    if (
        val.scrollTop + scrollData.value.el.clientHeight + 5 >=
        scrollData.value.el.scrollHeight &&
        scrollDownLock.value === 'UnLock'
    ) {
        // console.log('滚到了底部，需要获取数据了')
        scrollAntiShakeFn('No', 'next')
    }
}