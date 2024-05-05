import { receivedFriendAddSuccessSingle } from '@/components/friendsList/Methods/index'
import { handleWithdrawUtils } from '@/components/chatWindow/Methods/withDraw'
import { MainStore } from '@/view/Main/store'
import { ChatWindowStore } from '@/components/chatWindow/store'
import { handleUploadTipsSuccess, handleUploadTipsFailed } from '@/components/sendFoot/Methods'
// import { dbAdd } from '@/view/Main/Methods/indexDB'
const mainStore = MainStore()
const chatWindowStore = ChatWindowStore()
// 处理消息通知
export function handleTips(tips: { data: Tips[] }) {
    if (!tips.data || !Array.isArray(tips.data)) return
    // 添加好友信息到通知栏，并存入数据库中
    // const addFriendsList = tips.data.filter((item: any) => item.messages_type === 'addFriend')
    // store?.commit('global/clearTips')
    chatWindowStore.clearTips()
    // for (const item of addFriendsList) {
    //     const to_user_id = JSON.parse(item.messages_box || '{}').to_user_id || ''
    //     if (!to_user_id) continue
    //     // store.commit('global/addTips', item)
    //     chatWindowStore.addTips(item)
    // }

    // 处理其他即时消息，不做长久存储
    // const otherList: any = tips.data.filter((item: any) => item.messages_type !== 'addFriend')
    // console.log('其他消息 -> ', otherList)
    for (const item of tips.data) {
        switch (item.messages_type) {
            case 'addFriend':
                {
                    const to_user_id = JSON.parse(item.messages_box || '{}').to_user_id || ''
                    if (!to_user_id) continue
                    // store.commit('global/addTips', item)
                    chatWindowStore.addTips(item)
                }
                break
            case 'withdraw':
                // store.commit('global/withdrewTips', item)
                console.log('撤回消息 -> ', item)
                handleWithdrawUtils(item)
                break
            case 'addFriendRecieved':
                {
                    console.log('好友确认更新 ->', item)
                    receivedFriendAddSuccessSingle()
                }
                break
            case 'uploadSuccess':
                {
                    // dbAdd('tips_message', item)
                    // saveTips(item, '上传消息保存到数据库成功', '上传消息保存到数据库失败')
                    // handleUploadTipsSuccess(item)
                    handleUploadTipsSuccess(item)
                }
                break
            case 'uploadFailed':
                {
                    // dbAdd('tips_message', item)
                    // saveTips(item, '上传消息保存到数据库成功', '上传消息保存到数据库失败')
                    handleUploadTipsFailed(item)
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
        // store?.state.global.ws?.send(JSON.stringify(params))
        mainStore.ws?.send(JSON.stringify(params))
    }
    
}

// function saveTips(data: any, tips_success?: string, text_error?: string) {
//     dbAdd('tips_messages', data)
//     .then((res) => {
//         console.log(tips_success || '保存数据到数据库成功 -> ', res)
//     })
//     .catch((err: string) => {
//         console.log(text_error || '保存数据到数据库失败 -> ', err)
//     })
// }
