import {VideoCallOfferer} from '@/components/VideoCallOfferer/store'
import { storeToRefs } from 'pinia'
import { VideoConfig } from '@/interface/video'
import { h } from 'vue'
import { ElNotification, NotificationHandle } from 'element-plus'
import { MainStore } from '@/view/Main/store'


const { userInfo: user_info } = storeToRefs(MainStore())

const {
    showOfferer,
    showAnwserer,
    videocallOfferData,
    videocallAnwserData
} = storeToRefs(VideoCallOfferer())

export function centerVideoCallOffer(chatData: VideoConfig) {
    // console.log('视频通话开始了 -> ', chatData)
    videocallOfferData.value = chatData
    showAnwserer.value = true
}
export function centerVideoCallAnwser(chatData: VideoConfig) {
    // console.log('视频通话开始了 -> ', chatData)
    videocallAnwserData.value = chatData
    // showOfferer.value = true
}

export function destroyVideoCallOfferer() {
    showOfferer.value = false
}

export function destroyVideoCallAnwserer() {
    showAnwserer.value = false
}

export function centerVideoCallRequest(chatData: VideoConfig) {
    // videocallOfferData.value = chatData
    // showAnwserer.value = true
    console.log('请求数据是 ->', chatData)
    const id = chatData.user_id
    const friends = user_info.value?.friends ?? []
    console.log('好友是 -》 ', friends)
    const userName =
        friends.find((i: { user_id: any }) => i.user_id === id)?.user ??
        ''
    const rejectfn = (notify: NotificationHandle) => {
        videocallOfferData.value = {
            ...chatData,
            // 拒绝接通
            reject: true
        }
        showAnwserer.value = true

        notify?.close()
    }
    const notify = ElNotification({
        message: h('div', { class: 'custom-notification' }, [
            h(
                'div',
                { class: 'custom-notification-title' },
                `好友 ${userName} 请求与你视频通话`
            ),
            h('div', { class: 'custom-notification-box' }, [
                h(
                    'a',
                    {
                        class: 'custom-notification-button-confirm',
                        onClick: () => {
                            // sendRequestConfig.data = 'ok'
                            // props.socket.send(JSON.stringify(sendRequestConfig))
                            console.log('ok')
                            videocallOfferData.value = chatData
                            showAnwserer.value = true
                            notify.close()
                        }
                    },
                    '确定'
                ),
                h(
                    'a',
                    {
                        class: 'custom-notification-button-cancel',
                        onClick: () => {
                            // videocallOfferData.value = {
                            //     ...chatData,
                            //     // 拒绝接通
                            //     reject: true
                            // }
                            // showAnwserer.value = true

                            // notify.close()
                            rejectfn(notify)
                        }
                    },
                    '取消'
                )
            ])
        ]),
        duration: 0,
        showClose: false,
        customClass: 'custom-notification-class',
        position: 'bottom-right',
        icon: h('img', {
            src: require('../../../assets/video_notify.png'),
            class: 'notify-img'
        })
    })

    // 1 分钟后自动拒绝
    setTimeout(() => {
        if (!videocallOfferData.value) {
            rejectfn(notify)
        }
    }, 1000 * 60)
}

export function centerVideoCallResponse(chatData: VideoConfig) {
    videocallAnwserData.value = chatData
}

// 结束通话中转
export function centerVideoCallLeave(chatData: VideoConfig) {
    if (chatData.from === 'offerer') {
        videocallOfferData.value = chatData
        return
    }
    videocallAnwserData.value = chatData
}

export function handleVideoCallStart() {
    // console.log('点击了视频通话 -> ', data)
    showOfferer.value = true
}