<template>
     <div class="tips-containers">
        <main class="tips-main">
            <section v-for="(item, idx) in tipsShowList" :key="idx">
                <!-- 新增好友 -->
                <div v-if="item.messages_type === 'addFriend'" class="tips-list">
                    <div class="tips-title">{{ item.messages_box.msg }}</div>
                    <div class="tips-btn">
                        <el-button type="primary" link size="small" @click="handleAddFriend(item, idx)">同意</el-button>
                        <el-button type="danger" link size="small" @click="handleDelete(item, idx)">拒绝</el-button>
                    </div>
                </div>
            </section>
        </main>
        <footer>
            <div class="text cancel-text" @click="handleClose">返回</div>
            <!-- <div class="text save-text">保存</div> -->
        </footer>
     </div>

</template>

<script setup lang="ts">
// import { ChatSquare } from '@element-plus/icons-vue'
import { ref, Ref } from 'vue'
import { dbReadAll, dbDeleteByIndex } from '@/view/Main/Methods/indexDB'
import { localClickAddFriend } from '@/components/friendsList/Methods/index'
import { MainStore } from '@/view/Main/store'
// import { ChatWindowStore } from '@/components/chatWindow/store'
import { storeToRefs } from 'pinia'
import router from '@/router/router'
const mainStore = MainStore()
// const chatWindowStore = ChatWindowStore()
const { ws, dbname:dbName } = storeToRefs(mainStore)
// const { tips } = storeToRefs(chatWindowStore)

const tipsShowList: Ref<Tips[]> = ref([])

function loadTips() {
    if (dbName.value) {
        dbReadAll('tips_messages')
        .then((res: any) => {
            res?.forEach((item: Tips) => {
                const exist = tipsShowList.value.find((v: Tips) => v.messages_id === item.messages_id)
                if (!exist) {
                    item.messages_box = JSON.parse(item.messages_box)
                    if (item.messages_type === 'addFriend') {
                        tipsShowList.value.push(item)
                    }
                }
            })
        })
        .catch((err: string) => {
            console.log('读取 tips_messages 数据库失败 -> ', err)
        })
    }
}

loadTips()

// 同意添加好友
function handleAddFriend(item: Tips, idx: number) {
    console.log('同意添加好友 -> ', item)
    localClickAddFriend(item.messages_box)
    .then(() => {
        const params: Tips = {
            messages_type: 'addFriendRecieved',
            messages_box: item.messages_box,
            to_id: item.messages_box.friend_user_id
        }
        ws.value?.send(JSON.stringify(params))
        dbDeleteByIndex('tips_messages', 'messages_id', item.messages_id || '')
        .then(() => {
            console.log('删除 tips_messages 数据库成功！')
        })
        .catch((err: string) => {
            console.log('删除 tips_messages 数据库失败 -> ', err)
        })
        .finally(() => {
            tipsShowList.value.splice(idx, 1)
        })
        // tipsShowList.value.splice(idx, 1)
        
    })
}

// 拒绝添加好友
function handleDelete(item: Tips, idx: number) {
    console.log('拒绝添加好友 -> ', item)
    dbDeleteByIndex('tips_messages', 'messages_id', item.messages_id || '')
    .then(() => {
        console.log('删除 tips_messages 数据库成功！')
    })
    .catch((err: string) => {
        console.log('删除 tips_messages 数据库失败 -> ', err)
    })
    .finally(() => {
        tipsShowList.value.splice(idx, 1)
    })
}
function handleClose() {
    router.replace('/chat')
}
</script>



<style scoped lang="scss">
.tips-containers {
    background-color: #f4f4f4;
    height: 100%;
    display: flex;
    flex-direction: column;
    // padding: 16px;
}
.tips-list {
    display: flex;
    // align-items: center;
    // justify-content: space-between;
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    margin: 16px;
    box-shadow: 1px 1px 3px #ddd;

    ::v-deep .el-button {
        padding: 0 !important;
    }
}
.tips-title {
    font-size: 16px;
    font-weight: 600;
    width: 70%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}


.text {
    background: #fff;
    padding: 10px;
    text-align: center;
    font-size: 18px;
    border-radius: 8px;
    margin: 16px;
}

.cancel-text {
    // border: 1px solid #409eff;
    color: #fa7b7b;
}

.save-text {
    background: #409eff;
    color: #fff;
}
.tips-btn {
    padding: 8px;
}
.tips-main {
    flex: 1;
    overflow: auto;
}
</style>