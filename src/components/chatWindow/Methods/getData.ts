// import { Box, IsSwitchFriend, Position, Locked, Judge } from "@/interface/global"
// import { DESC } from '@/interface/indexDB'
import { getActionFriendPositionData } from '@/components/chatWindow/Methods/positionOperator'
import { scrollChatBoxToBottom } from "@/view/Main/Methods/mainMethods"
// import { MainStore } from "@/view/Main/store"
import { FootSendStore } from "@/components/sendFoot/store"
import { FriendsListStore } from "@/components/friendsList/store"
import { ChatWindowStore } from "../store"
// import { FriendsListStore } from "@/components/friendsList/store"
import { storeToRefs } from "pinia"
import { nextTick } from "vue"
import {
    dbReadRange,
    dbReadRangeNotOffset,
    dbReadRangeByArea,
    dbGetLastPrimaryKey,
    dbAdd
} from '@/view/Main/Methods/indexDB'
import {
    // deleteActionFriendPositionData,
    clearActionFriendPositionData
} from '@/components/chatWindow/Methods/positionOperator'
import * as API from '../api'
import { saveChatWindowPosition, VisualEl } from './savePosition'
// import { elementFilter } from '@/components/chatWindow/Methods/savePosition'

const { scrollData, boxScrollTop, isLastChatList, scrollUpLock, scrollDownLock, chatBox, scrollSafeLength, scrollBar
    // imgLoadList
} = storeToRefs(ChatWindowStore())
const { isShowGoToNewBtn, isGetGoToNewSingle } = storeToRefs(FootSendStore())
const { activeFriend, userInfo } = storeToRefs(FriendsListStore())
// const { activeFriend } = storeToRefs(FriendsListStore())


export async function getChatFromServer(
    isSwitchFriend: IsSwitchFriend,
    rollingDeriction: DESC
) {
    if (isSwitchFriend === 'Yes') {
        console.log('切换了好友')
        // 现在好友切换，会将多余数据加载，所以如果存在滚动元素，肯定会将滚动数据加载
        // 所以在数据处理之前，一定要将上下锁定
        scrollUpLock.value = 'Locked'
        scrollDownLock.value = 'Locked'
        firstTimeGetChatData()
    } else {
        console.log('不是切换好友')
        normalGetChatData(rollingDeriction)
    }
}

// 首次点击获取数据
async function firstTimeGetChatData() {
    handlePositionAfterFirstTimeGetChatData()
}

// 从数据库拿数据
interface FirstTimeGetChatDataFromDataBase {
    chatData: Box[]
    lastId: number | undefined
}
async function handlePositionAfterFirstTimeGetChatData() {
    const { chatData, lastId }: FirstTimeGetChatDataFromDataBase =
        await firstTimeGetChatDataFromDataBase()
    const position:Position = getActionFriendPositionData()
    if (position) {
        const dataIndex = chatBox.value.findIndex(
            item => item.time_id === position.first
        )
        const children = scrollData.value.chatListDiv?.children
        if (dataIndex === -1 || !children) return
        const chatDivList: HTMLElement[] = [...children] as HTMLElement[]
        const div: HTMLElement = chatDivList[dataIndex]
        if (div) {
            div.scrollIntoView()
            // 这里虽然有定位信息,但如果获取的聊天记录时最后一个记录的话,需要锁住滚动获取数据,并把位置信息删除
            if (lastId && chatData.length && lastId === chatData[chatData.length - 1].time_id) {
                console.log('到底了 -> ', lastId)
                // 向下锁 锁死
                scrollDownLock.value = 'Locked'
                isLastChatList.value = 'Yes'

                if (!scrollData?.value?.el) return

                // 数据到底的情况下，判断是否需要滚动到最后一个元素
                saveChatWindowPosition()
                const ve = new VisualEl()
                const lastvisualEl =  ve.getLastEl()
                let isNeedScrollBottom = false

                if (lastvisualEl) {
                    const elMap = ve.getElMap()
                    if (elMap.has(lastvisualEl)) {
                        const data = elMap.get(lastvisualEl)
                        if (data?.time_id && data?.time_id === lastId) {
                            clearActionFriendPositionData()
                            isNeedScrollBottom = true
                            scrollChatBoxToBottom()
                        }
                    }
                }

                
                // 数据到底的情况下，判断是否需要显示 "回到最新" 按钮
                const { scrollTop, clientHeight, scrollHeight } = scrollData.value.el
                if (scrollTop + clientHeight < scrollHeight - 10 && !isNeedScrollBottom) {
                    // 用于显示 "回到最新" Tip 按钮
                    isShowGoToNewBtn.value = 'Yes'
                }
            } else {
                console.log('没有到底')
                isShowGoToNewBtn.value = 'Yes'
                scrollDownLock.value = 'UnLock'
            }
        }
    } else {
        scrollChatBoxToBottom()
        isLastChatList.value = 'Yes'
    }

    // 释放锁
    scrollUpLock.value = 'UnLock'

    // 如果聊天记录已经全部获取完毕后，需要上锁，防止再次无效获取
    // 为什么要注释这里？因为新版可以通过服务器获取到对应更早的聊天记录了
    // if (chatData?.length === 0) scrollUpLock.value = 'Locked'
}

// 平常滚动获取数据
async function normalGetChatData(rollingDeriction: DESC) {
    // 看下之前的 定位记录存不存在
    console.log(
        `向哪个方向处理 -> ${rollingDeriction === 'next' ? '向下' : '向上'}`
    )
    if (rollingDeriction === 'next') {
        handlePositionAfterGetChatDataFromDown()
    } else {
        handlePositionAfterGetChatDataFromUp()
    }
}

async function firstTimeGetChatDataFromDataBase(time: number = 5): Promise<FirstTimeGetChatDataFromDataBase> {
    console.log('firstTimeGetChatDataFromDataBase -> ', time)
    // 将递归改成 for 方式，尽可能避免多次获取数据，导致内存溢出
    const chat_table = activeFriend.value.chat_table
    // 这个置空的情况不希望触发滚动事件
    // 因为这样会导致重复执行 getChatFromServer 函数
    chatBox.value = []
    const actionFriendPostionData = getActionFriendPositionData()
    const chatData: Box[] = []
    if (actionFriendPostionData) {
        // 这里获取的数据可能为空，Position 记录的信息可能会被 `删除` `撤回` `数据库操作错误`
        // 导致记录与实际情况有出入，所以这里获取为空时，需要尝试将 Position 信息删除，并从头获取
        let data = []
        data = await dbReadRangeByArea(
            chat_table,
            actionFriendPostionData.first,
            actionFriendPostionData.last
        )

        // console.log('获取聊天记录 首次获取 0000 ->', data)
        // 如果数据为空，尝试从头获取
        if (data.length === 0) {
            
            clearActionFriendPositionData()
            data = await dbReadRangeNotOffset(
                chat_table,
                'prev' as DESC,
                scrollSafeLength.value
            )
        }
        console.log('获取聊天记录 首次获取 1 ->', chatData)
        chatData.push(...data)
    } else {
        const data = await dbReadRangeNotOffset(
            chat_table,
            'prev' as DESC,
            scrollSafeLength.value
        )
        // console.log('获取聊天记录 首次获取 2 ->', chatData)
        chatData.push(...data)
    }
    const lastId = await dbGetLastPrimaryKey(chat_table, 'next')
    const firstId = await dbGetLastPrimaryKey(chat_table, 'prev')

    if (!chatData.length || chatData[0].time_id === firstId) {
        const server_id = chatData?.[0]?.server_id
        const remoteData = await getChatDataFromRemote(chat_table, server_id)
        chatData.unshift(...remoteData)
        console.log('尝试从服务器获取聊天记录 -> ',server_id, remoteData)
    }
    
    const resChatData = handleChatData(chatData || [])

    // console.log('resChatData ===', resChatData, firstId, lastId)

    chatBox.value.unshift(...resChatData)
    await nextTick()
    return {
        chatData: resChatData || [],
        lastId
    }
}

// 媒体文件延迟定位处理
// function mediaDelayPosition(chatData: Box[], cb: Function) {
//     chatData.forEach((d: Box) => {
//         if (d.type.includes('video') || d.type.includes('image')) {
//             if (!imgLoadList.value.includes(d.chat_id)) {
//                 imgLoadList.value.push(d.chat_id)
//             }
//         }
//     })

//     if (imgLoadList.value.length) {
//         const isAllLoadedStop = watchEffect(() => {
//             if (imgLoadList.value.length === 0) {
//                 cb()
//                 isAllLoadedStop()
//             }
//         })
//     } else {
//         cb()
//     }
// }

async function handlePositionAfterGetChatDataFromDown() {
    // if (!scrollDownLock) return

    // 从服务器拉取聊天记录
    // 决定拉数据前，上锁，防止重复操作
    scrollDownLock.value = 'Locked'

    const chat_table = activeFriend.value.chat_table
    const offset = chatBox.value.length ? chatBox.value[chatBox.value.length - 1].time_id : 0
    // console.log('最后一个box数据 -> ', chatBox.value[chatBox.value.length - 1])
    const chatData: Box[] = []
    // chatData.push(...await dbReadRange(chat_table, position[chat_table].offset, isFromDown ? 'next' : 'prev'))
    chatData.push(...(await dbReadRange(chat_table, offset as number, 'prev')))
    const lastId = await dbGetLastPrimaryKey(chat_table, 'next')
    console.log('获取聊天记录 向下 -> ', chatData.length)
    const tmpScrollTopValue = boxScrollTop.value
    const resChatData = handleChatData(chatData || [])
    chatBox.value.push(...resChatData)
    nextTick(() => {
        // mediaDelayPosition(chatData, () => {
        // })
        scrollData.value.scrollBar.setScrollTop(tmpScrollTopValue)
        if (!chatData.length || lastId === chatData[chatData.length - 1]?.time_id) {
            console.log('donwn 到底了 ->', lastId)
            isLastChatList.value = 'Yes'
            scrollDownLock.value = 'Locked'
            // deleteActionFriendPositionData()

            // 滚动到底部时，应该负责关掉回到最新按钮
            isShowGoToNewBtn.value = 'No'
            isGetGoToNewSingle.value = 'No'
            
        }
    })

    // 释放锁
    scrollDownLock.value = 'UnLock'

    // 如果聊天记录已经全部获取完毕后，需要上锁，防止再次无效获取
    if (chatData?.length === 0) scrollDownLock.value = 'Locked'
}

// 获取数据后处理文件定位
async function handlePositionAfterGetChatDataFromUp() {
    // if (!scrollUpLock.value) return

    // 从服务器拉取聊天记录
    // 决定拉数据前，上锁，防止重复操作
    scrollUpLock.value = 'Locked'

    const chat_table = activeFriend.value.chat_table
    const offset = chatBox.value?.[0]?.time_id
    // 没有定位信息，就不要拉数据了
    if (!offset) return console.log('没有定位信息，就不要拉数据了')
    const chatData: Box[] = []
    const localData = await dbReadRange(chat_table, offset as number, 'next' as DESC)
    if (!localData.length) {
        const server_id = chatBox.value[0].server_id 
        if (server_id) {
            const remoteData = await getChatDataFromRemote(chat_table, server_id)
            chatData.push(...remoteData)
        }
        
    } else {
        chatData.push(...localData)
    }
    // chatData.push(...(await dbReadRange(chat_table, offset as number, 'next' as DESC)))
    console.log('获取聊天记录 向上 -> ', chatData.length, scrollBar.value)
    const start_sp = scrollData.value.chatListDiv?.scrollHeight
    const resChatData = handleChatData(chatData || [])
    // 获取第一个元素
    const ve = new VisualEl()
    const firstvisualEl = ve.getFirstEl()

    chatBox.value.unshift(...resChatData)
    nextTick(() => {
        
        // console.log('scrollData 3 -> ', scrollData)
        // mediaDelayPosition(chatData, () => {
        // })
        scrollBar.value.refresh()

        if (start_sp) {
            // scrollChatBoxToSomePosition(start_sp)
            if (firstvisualEl) {
                scrollChatBoxToSomePositionByElement(firstvisualEl)
                console.log('scrollChatBoxToSomePositionByElement -> ', firstvisualEl)
            } else {
                console.log('没有找到元素')
            }
        }
    })

    // 释放锁
    scrollUpLock.value = 'UnLock'

    // 如果聊天记录已经全部获取完毕后，需要上锁，防止再次无效获取
    if (chatData?.length === 0) scrollUpLock.value = 'Locked'
}

function handleChatData(data: Box[]): Box[] {
    return (
        data.filter(item => item).map((i: Box) => {
            if (userInfo.value.user_id === i.user_id) {
                i.user = 1
            } else {
                i.user = 0
            }

            return {
                // ...i,
                ...i
            }
        }) ?? []
    )
}

function scrollChatBoxToSomePosition(start_sp: number) {
    const end_sp = scrollData.value.chatListDiv?.scrollHeight
    if (end_sp) {
        console.log('scrollChatBoxToSomePosition -> ', end_sp - start_sp, scrollBar.value.scrollerHeight + scrollBar.value.maxScrollY)
        scrollData.value.scrollBar.setScrollTop(end_sp - start_sp)
    }
}

function scrollChatBoxToSomePositionByElement(el: HTMLElement) {
    console.log('触发了滚动事件', el.textContent, el)
    // window.requestAnimationFrame(() => {
    //     scrollData.value.scrollBar.setScrollTop(9999999)
    // })
    // scrollData.value.scrollBar.setScrollElement(el)
    window.requestAnimationFrame(() => {
        scrollData.value.scrollBar.setScrollElement(el)
    })
}


async function getChatDataFromRemote(chat_table: string, server_id: string = '0'): Promise<Box[]> {
    // const res = await getChatDataFromServer(chat_table, server_id)
    const position:Position = getActionFriendPositionData()
    const limit = position?.flex_length && position.flex_length > 10 ? position.flex_length : 30
    const params= {
        chat_table,
        limit,
        offset: Number(server_id),
        position: 'desc',
        user_id: userInfo.value.user_id
    }
    const data = await API.getChatData(params)

    console.log('getChatDataFromRemote -> ', params)
    // console.log('getChatDataFromRemote -> ', data.data.data)
    const firstId = await dbGetLastPrimaryKey(chat_table, 'prev')
    if (data.status === 200) {
        let index = 1;
        const result = data.data.data.map((item: any) => {
            const d: Box = {
                ...JSON.parse(item.chat),
                loading: false,
                time_id:  (firstId || Date.now() * (-1)) + index++
            }
            return d
        }).reverse()
        saveRemoteDataToDataBase(result)
        return result
    }
    return []
}

async function saveRemoteDataToDataBase(result: Box[]) {
    console.log('保存的数据 -> ', result)
    const chat_table = activeFriend.value.chat_table
    for(let i = 0; i < result.length; i++) {
        await dbAdd(chat_table, result[i])
    }
}