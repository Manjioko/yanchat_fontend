
import to from 'await-to-js'
import { request, api } from '@/utils/api'
import { UserInfo, Friend } from '@/interface/global'
import { initDdOperate } from '@/utils/indexDB'
import store from '@/store'
export async function addFriend(friData: any) {
    const getUserInfo: UserInfo = JSON.parse(sessionStorage.getItem('user_info') || '{}')
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

    const baseUrl = sessionStorage.getItem('baseUrl')
    res.data.friends.forEach((item: Friend) => {
        const friendParams: Friend = {
            name: item.name || item.user as string,
            user_id: item.user_id,
            time: '',
            message: '',
            avatar_url:  `${baseUrl}/avatar/avatar_${item.user_id}.jpg`,
            active: false,
            searchActive: true,
            chat_table: item.chat_table,
            phone_number: item.phone_number,
            user: item.user
        }
        store.commit('friendsList/addFriendsList', friendParams)
    })
    getUserInfo.friends = JSON.stringify(res.data.friends)
    sessionStorage.setItem('user_info', JSON.stringify(getUserInfo))

    // 更改版本号,重新更新数据库
    initDdOperate(getUserInfo, store.state.dataBase.db)
}

export async function updateUserInfo() {
    const user_info = JSON.parse(sessionStorage.getItem('user_info') || '{}')
    const [uerr, udata] = await to(request({
        method: 'post',
        url: api.getUserInfoByPhone,
        data: {
            phone_number: user_info.phone_number,
            get_friends: true
        }
    }))
    if (uerr) {
        console.log('获取用户信息错误: ', uerr)
        return
    }
    // console.log('获取用户信息成功 -> ', udata)
    if (!udata) return
    if (udata.data && udata.data[0]) {
        // 更新好友列表
        const friends = JSON.parse(udata.data[0]?.friends || '[]')
        // store.commit('friendsList/updateFriendsList', friends)
        console.log('更新好友列表 -> ', friends)
        const baseUrl = sessionStorage.getItem('baseUrl')
        friends.forEach((item: Friend) => {
            const friendParams: Friend = {
                name: item.name || item.user as string,
                user_id: item.user_id,
                time: '',
                message: '',
                avatar_url:  `${baseUrl}/avatar/avatar_${item.user_id}.jpg`,
                active: false,
                searchActive: true,
                chat_table: item.chat_table,
                phone_number: item.phone_number,
                user: item.user
            }
            store.commit('friendsList/addFriendsList', friendParams)
        })

        // 更新用户信息
        user_info.friends = JSON.stringify(udata.data[0]?.friends || '[]')
        sessionStorage.setItem('user_info', JSON.stringify(user_info))

        // 更改版本号,重新更新数据库
        initDdOperate(user_info, store.state.dataBase.db)
    }
}