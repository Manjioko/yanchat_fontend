
import to from 'await-to-js'
import { request, api } from '@/utils/api'
import { UserInfo } from '@/interface/global'
import { updateDatabase } from '@/view/Main/Methods/indexDB'
import { MainStore } from '@/view/Main/store'
import { storeToRefs } from 'pinia'
import { setUserInfo } from '@/view/Main/Methods/userInfoOperator'
import { A_getUserInfo } from '@/api'
import { FriendsListStore } from '@/components/friendsList/store'
const mainstore = MainStore()
const { userInfo } = storeToRefs(FriendsListStore())

// 点击添加好友 同意按钮后会触发这个函数
export async function localClickAddFriend(friData: any) {
    const getUserInfo: UserInfo = userInfo.value
    const [err, res] = await to(request({
        method: 'post',
        url: api.addFri,
        // url: api.addFriTest, // 好友添加功能更改,这里是测试用的 API
        data: {
            phone_number: getUserInfo.phone_number,
            friend_phone_number: friData.friend_phone_number
        }
    }))
    if (err) {
        console.log('添加好友错误: ', err)
        return
    }
    console.log('好友请求回来了 -> ', res, res?.data)
    // 返回错误
    if (!res?.data?.friends) return

    // 更新用户信息
    const userInfoRes = await A_getUserInfo({ phone_number: getUserInfo.phone_number, get_friends: true })
    setUserInfo(userInfoRes.data[0] as UserInfo)
    // 更改版本号,重新更新数据库
    await updateDatabase(mainstore.db)
    if (userInfoRes.data) {
        const userInfo = userInfoRes.data[0] as UserInfo
        setUserInfo(userInfo)
    }
}


// 远程客户端同意好友申请后，本地会接受到信号，会触发这个函数
export async function receivedFriendAddSuccessSingle() {
    const user_info = userInfo.value

    // 更新用户信息
    const userInfoRes = await A_getUserInfo({ phone_number: user_info.phone_number, get_friends: true })
    // 这里多此一举的动作，是为了更新数据库时，可能新建最新的好友表
    // 然后再根据 updateUserInfo 把最新的版本号更新到远程数据库
    setUserInfo(userInfoRes.data[0] as UserInfo)
    // 更改版本号,重新更新数据库
    await updateDatabase(mainstore.db)
    if (userInfoRes.data) {
        const userInfo = userInfoRes.data[0] as UserInfo
        setUserInfo(userInfo)
    }
}