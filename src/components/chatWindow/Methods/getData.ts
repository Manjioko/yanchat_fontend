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
import { nextTick, watchEffect } from "vue"
import {
    dbReadRange,
    dbReadRangeNotOffset,
    dbReadRangeByArea,
    dbGetLastPrimaryKey
} from '@/view/Main/Methods/indexDB'
import { deleteActionFriendPositionData, clearActionFriendPositionData } from '@/components/chatWindow/Methods/positionOperator'

const { scrollData, boxScrollTop, isLastChatList, scrollUpLock, scrollDownLock, chatBox, scrollSafeLength, imgLoadList } = storeToRefs(ChatWindowStore())
const { goToBottom } = storeToRefs(FootSendStore())
const { activeFriend, userInfo } = storeToRefs(FriendsListStore())
// const { activeFriend } = storeToRefs(FriendsListStore())

export async function getChatFromServer(
    isSwitchFriend: IsSwitchFriend,
    rollingDeriction: DESC
) {
    if (isSwitchFriend === 'Yes') {
        firstTimeGetChatData()
    } else {
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
            item => item.id === position?.use
        )
        const children = scrollData.value.chatListDiv?.children
        if (dataIndex === -1 || !children) return
        const chatDivList: HTMLElement[] = [...children] as HTMLElement[]
        const div: HTMLElement = chatDivList[dataIndex]
        if (div) {
            mediaDelayPosition(chatData, () => {
                div.scrollIntoView()
                // 这里虽然有定位信息,但如果获取的聊天记录时最后一个记录的话,需要锁住滚动获取数据,并把位置信息删除
                if (lastId && chatData.length && lastId === chatData[chatData.length - 1].id) {
                    // console.log('到底了 -> ', lastId)
                    // 向下锁 锁死ß
                    scrollDownLock.value = 'Locked'
                    isLastChatList.value = 'Yes'

                    if (!scrollData?.value?.el) return

                    const { scrollTop, clientHeight, scrollHeight } = scrollData.value.el
                    if (scrollTop + clientHeight < scrollHeight - 10) {
                        // 用于显示 "回到最新" Tip 按钮
                        goToBottom.value = 'Yes'
                    }
                } else {
                    goToBottom.value = 'Yes'
                }
            })
        }
    } else {
        // 随便设置值，后期需要优化
        mediaDelayPosition(chatData, () => {
            scrollChatBoxToBottom()
            isLastChatList.value = 'Yes'
        })
    }

    // 释放锁
    scrollUpLock.value = 'UnLock'

    // 如果聊天记录已经全部获取完毕后，需要上锁，防止再次无效获取
    if (chatData?.length === 0) scrollUpLock.value = 'Locked'
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
    // 将递归改成 for 方式，尽可能避免多次获取数据，导致内存溢出
    const chat_table = activeFriend.value.chat_table
    for (let i = 0; i < time; i++) {
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
                actionFriendPostionData?.first || 0,
                actionFriendPostionData?.last || 0
            )
            // 如果数据为空，尝试从头获取
            if (data.length === 0) {
                clearActionFriendPositionData()
                data = await dbReadRangeNotOffset(
                    chat_table,
                    'prev' as DESC,
                    scrollSafeLength.value
                )
            }
            // console.log('获取聊天记录 首次获取 1 ->', chatData, position[mainStore.positionId].first, position[mainStore.positionId].last)
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
        const lastId = await dbGetLastPrimaryKey(chat_table)
        // console.log('获取聊天记录 首次获取 ->', chatData)
        const resChatData = handleChatData(chatData || [])

        chatBox.value.unshift(...resChatData)
        await nextTick()
        // console.log('scroll -> ',  scrollData.value.el.scrollHeight, scrollData.value.el.clientHeight, chatData[chatData.length - 1].id, lastId)
        // 为了防止获取到的数量不够滚动距离,这里做个递归处理,设置安全滚动距离
        if (
            scrollData?.value?.el?.scrollHeight === scrollData?.value?.el?.clientHeight &&
            chatData.length &&
            chatData.length < scrollSafeLength.value &&
            chatData[chatData.length - 1].id !== lastId
        ) {
            scrollSafeLength.value += Math.ceil(scrollSafeLength.value / 2)
            clearActionFriendPositionData()
            console.log('数量不够')
        } else {
            return {
                chatData,
                lastId
            }
        }
    }
    const lastId = await dbGetLastPrimaryKey(chat_table)

    // console.log('获取聊天记录 首次获取 空 ->')
    return {
        chatData: [],
        lastId
    }
}

// 媒体文件延迟定位处理
function mediaDelayPosition(chatData: Box[], cb: Function) {
    chatData.forEach((d: Box) => {
        if (d.type.includes('video') || d.type.includes('image')) {
            if (!imgLoadList.value.includes(d.chat_id)) {
                imgLoadList.value.push(d.chat_id)
            }
        }
    })

    if (imgLoadList.value.length) {
        const isAllLoadedStop = watchEffect(() => {
            if (imgLoadList.value.length === 0) {
                cb()
                isAllLoadedStop()
            }
        })
    } else {
        cb()
    }
}

async function handlePositionAfterGetChatDataFromDown() {
    // if (!scrollDownLock) return

    // 从服务器拉取聊天记录
    // 决定拉数据前，上锁，防止重复操作
    scrollDownLock.value = 'Locked'

    const chat_table = activeFriend.value.chat_table
    const offset = chatBox.value.length ? chatBox.value[chatBox.value.length - 1].id : 0
    // console.log('最后一个box数据 -> ', chatBox.value[chatBox.value.length - 1])
    const chatData: Box[] = []
    // chatData.push(...await dbReadRange(chat_table, position[chat_table].offset, isFromDown ? 'next' : 'prev'))
    chatData.push(...(await dbReadRange(chat_table, offset as number, 'next')))
    const lastId = await dbGetLastPrimaryKey(chat_table)
    console.log('获取聊天记录 向下 -> ', chatData.length)
    const tmpScrollTopValue = boxScrollTop.value
    const resChatData = handleChatData(chatData || [])
    chatBox.value.push(...resChatData)
    nextTick(() => {
        mediaDelayPosition(chatData, () => {
            scrollData.value.scrollBar.setScrollTop(tmpScrollTopValue)
            if (!chatData.length || lastId === chatData[chatData.length - 1]?.id) {
                console.log('donwn 到底了 ->', lastId)
                isLastChatList.value = 'Yes'
                scrollDownLock.value = 'Locked'
                deleteActionFriendPositionData()
            }
        })
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
    const offset = chatBox.value[0].id
    // 没有定位信息，就不要拉数据了
    if (!offset) return
    const chatData: Box[] = []
    chatData.push(...(await dbReadRange(chat_table, offset as number, 'prev' as DESC)))
    console.log('获取聊天记录 向上 -> ', chatData.length)

    const start_sp = scrollData.value.chatListDiv?.scrollHeight
    const resChatData = handleChatData(chatData || [])
    chatBox.value.unshift(...resChatData)
    nextTick(() => {
        // console.log('scrollData 3 -> ', scrollData)
        mediaDelayPosition(chatData, () => {
            if (start_sp) {
                scrollChatBoxToSomePosition(start_sp)
            }
        })
    })

    // 释放锁
    scrollUpLock.value = 'UnLock'

    // 如果聊天记录已经全部获取完毕后，需要上锁，防止再次无效获取
    if (chatData?.length === 0) scrollUpLock.value = 'Locked'
}

function handleChatData(data: Box[]): Box[] {
    return (
        data.map((i: Box) => {
            // const chatOb = JSON.parse(i.chat)
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
        scrollData.value.scrollBar.setScrollTop(end_sp - start_sp)
    }
}