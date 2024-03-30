import { Tips, Box } from "@/interface/global"
import { request, api } from "@/utils/api"
import { dbDeleteByIndex } from "./indexDB"
import { computed, ComputedRef, watchEffect } from "vue"
import { useStore} from '@/store'
// import typeIs from "./type"

const store = useStore()

export function handleWithdraw(data: Tips) {
    return new Promise((resolve, reject) => {
        if (!data) return resolve(null)
        console.log('撤回消息 -> ', data)
        const { messages_box } = data
        if (messages_box) {
            const dbname: ComputedRef<string> = computed(() => store.state.dataBase.dbname || '')
            const stop = watchEffect(() => {
                if (dbname.value) {
                    const box: Box = JSON.parse(messages_box)
                    dbDeleteByIndex(box.to_table, 'chat_id', box.chat_id)
                    .then(() => {
                        // serverWithdraw(box)
                        // .then(() => {
                        //     if (typeIs(store.state.global.centerFn) === 'Function') {
                        //         console.log('处理下本地的数据 --> ', box)
                        //         store.state.global.centerFn(box, 'deleted')
                        //     }
                        // })
                        store.state.global.centerFn?.(box, 'deleted')
                        resolve(true)
                    })
                    .catch(err => {
                        console.log('撤回失败 -> ', err)
                        reject(err)
                    })
                    .finally(() => {
                        stop()
                    })
                }
            })
        }
    })
}

function serverWithdraw(chatBox:Box): Promise<boolean | string> {
    return new Promise((resolve, reject) => {
        request({
            method: 'post',
            url: api.deleteChat,
            data: {
                chat: {
                    ...chatBox,
                    thumbnail: '', // 缩略图可能很大,撤回并不需要带那么大的东西回后台
                },
            }
        }).then(res => {
            if (res?.data === 'ok') {
                console.log('服务器撤回成功 -> ', res)
                resolve(true)
                // centerDeleted(chatBox.value[idx])
            } else {
                console.log('服务器撤回失败2 -> ', res)
                reject(res)
            }
        }).catch(err => {
            console.log('服务器撤回失败1 -> ', err)
            reject(err)
        })
        
    })
}
export async function deleteLocalDataBaseData(chatBox:Box) {
    new Promise((resolve, reject) => {
        dbDeleteByIndex(chatBox.to_table, 'chat_id', chatBox.chat_id)
        .then((res) => {
            console.log('res ---> ', res, chatBox.chat_id)
            resolve(true)
        })
        .catch(err => {
            console.log('撤回失败 -> ', err)
            reject(err)
        })
    })
}
