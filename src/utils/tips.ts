import {  useStore } from '@/store'
import { updateUserInfo } from '@/utils/friends'
import { Tips } from '@/interface/global'
import { handleWithdraw } from '@/utils/withdraw'
const store = useStore()
// 处理消息通知
export function handleTips(tips: { data: Tips[] }) {
    if (!tips.data || !Array.isArray(tips.data)) return
    // 添加好友信息到通知栏，并存入数据库中
    const addFriendsList = tips.data.filter((item: any) => item.messages_type === 'addFriend')
    store.commit('global/clearTips')
    for (const item of addFriendsList) {
        const to_user_id = JSON.parse(item.messages_box || '{}').to_user_id || ''
        if (!to_user_id) continue
        store.commit('global/addTips', item)
    }

    // 处理其他即时消息，不做长久存储
    const otherList = tips.data.filter((item: any) => item.messages_type !== 'addFriend')
    // console.log('其他消息 -> ', otherList)
    for (const item of otherList) {
        switch (item.messages_type) {
            case 'withdraw':
                // store.commit('global/withdrewTips', item)
                console.log('撤回消息 -> ', item)
                handleWithdraw(item)
                break
            case 'addFriendRecieved':
                {
                    console.log('好友确认更新 ->', item)
                    updateUserInfo()
                }
                break
            default:
                break
        }
    }
    if (tips.data.length > 0) {
        // 处理完tips后，需要清空服务器端的消息
        const user_id = sessionStorage.getItem('user_id') || ''
        // 清空消息
        const params: Tips = {
            messages_type: 'clear',
            to_id: user_id
        }
        store.state.global.ws?.send(JSON.stringify(params))
    }
    
}