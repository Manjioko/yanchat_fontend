<template>
    <div class="tips">
        <el-popover placement="bottom" :width="400" trigger="click">
            <template #reference>
                <el-badge :is-dot="!!tipsShowList.length" class="badge-item">
                    <el-icon :size="20" style="margin-left: 10px;"><ChatSquare /></el-icon>
                </el-badge>
            </template>

            <div class="tips-container">
                <section v-for="(item, idx) in tipsShowList" :key="idx">
                    <!-- 新增好友 -->
                    <div v-if="item.messages_type === 'addFriend'" class="tips-list">
                        <div class="tips-title">{{ item.messages_box.msg }}</div>
                        <div>
                            <el-button type="primary" link size="small" @click="handleAddFriend(item)">同意</el-button>
                            <el-button type="danger" link size="small" @click="handleDelete(item)">拒绝</el-button>
                        </div>
                    </div>
                </section>
            </div>
        </el-popover>
    </div>
</template>

<script lang="ts" setup>
import { ChatSquare } from '@element-plus/icons-vue'
import { useStore } from 'vuex'
import { computed, ComputedRef, watchEffect, ref, Ref } from 'vue'
import { dbAdd, dbReadAll } from '@/utils/indexDB'
// import { Tips } from '@/interface/global'
const store = useStore()

const ws: ComputedRef<any> = computed(() => store.state.global.ws)
const dbName: ComputedRef<any> = computed(() => store.state.dataBase.dbname)
const tips: ComputedRef<any[]> = computed(() => store.state.global.tips)
const tipsShowList: Ref<any[]> = ref([])
watchEffect(() => {
    if (dbName.value) {
        dbReadAll('tips_messages')
        .then((res: any) => {
            res?.forEach((item: any) => {
                const exist = tipsShowList.value.find((v: any) => v.messages_id === item.messages_id)
                if (!exist) {
                    item.messages_box = JSON.parse(item.messages_box)
                    tipsShowList.value.push(item)
                }
            })
        })
        .catch((err: string) => {
            console.log('读取 tips_messages 数据库失败 -> ', err)
        })

        if (tips.value.length) {
            dbAdd('tips_messages', [...JSON.parse(JSON.stringify(tips.value))])
            .then(() => {
                console.log('成功将 Tips 信息保存到数据库中！')
            })
            .catch((err: string) => {
                console.log('将 Tips 信息保存到数据库中失败了 -> ', err)
            })
            .finally(() => {
                dbReadAll('tips_messages')
                .then((res: any) => {
                    // console.log('tips_messages2 -> ', res)
                    res?.forEach((item: any) => {
                        const exist = tipsShowList.value.find((v: any) => v.messages_id === item.messages_id)
                        if (!exist) {
                            item.messages_box = JSON.parse(item.messages_box)
                            tipsShowList.value.push(item)
                        }
                    })
                })
                .catch((err: string) => {
                    console.log('读取 tips_messages 数据库失败 -> ', err)
                })
                store.commit('global/setTips', [])
                const user_id = sessionStorage.getItem('user_id') || ''
                console.log('ws -> ', ws)
                // 清空消息
                ws.value?.send(JSON.stringify({
                    tips: 'clear',
                    to_id: user_id
                }))
            })
        }
        // store.commit('global/setTips', [])
    }
})

// 同意添加好友
function handleAddFriend(item: any) {
    console.log('同意添加好友 -> ', item)
}

// 拒绝添加好友
function handleDelete(item: any) {
    console.log('拒绝添加好友 -> ', item)
}
</script>

<style lang="scss" scoped>
.badge-item {
    display: flex;
    align-items: center;
    justify-content: center;
}
.tips-list {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    border-bottom: 1px solid #ddd;
    ::v-deep .el-button {
        padding: 0 !important;
    }
}
.tips-title {
    font-size: 16px;
    font-weight: 600;
    width: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
// .reject {
//     color: #F56C6C;
// }
</style>