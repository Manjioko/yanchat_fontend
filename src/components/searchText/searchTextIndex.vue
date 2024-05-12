<template>
    <div class="container" :style="{ display: show ? 'block' : 'none'}">
        <header class="f-header">
            <el-input
                v-model="searchText"
                placeholder="搜索聊天内容"
                :suffix-icon="Search"
                clearable
            />
        </header>
        <main>
            <div v-for="chat in chatData" :key="chat.chat_id">
                <div class="chat-text" v-html="chat.text" @click="gotoPosition(chat)"></div>
                <el-divider />
            </div>
        </main>
    </div>
</template>

<script lang="ts" setup>
import { Search } from '@element-plus/icons-vue'
import { ref, watch, nextTick, defineExpose, Ref } from 'vue'
import { dbRead } from '@/view/Main/Methods/indexDB'
import debounce from '@/utils/debounce'
import { FriendsListStore } from '../friendsList/store'
import { ChatWindowStore } from '../chatWindow/store'
import { storeToRefs } from 'pinia'
import { setActionFriendPositionData } from '../chatWindow/Methods/positionOperator'
import { getChatFromServer } from '../chatWindow/Methods/getData'
import { SearchTextStore } from './store'
import { FootSendStore } from '../sendFoot/store'

const searchTextStore = SearchTextStore()
const { searchTextLock } = storeToRefs(searchTextStore)

const friendStore = FriendsListStore()
const chatWindowStore = ChatWindowStore()
const { activeFriend } = storeToRefs(friendStore)
// const { scrollSafeLength } = storeToRefs(chatWindowStore)
const { isLastChatList, scrollUpLock, scrollDownLock, scrollSafeLength } = storeToRefs(chatWindowStore)
const { isShowGoToNewBtn, chatBoxCacheList } = storeToRefs(FootSendStore())


const searchText = ref('')

const show = ref(false)

function showSearch() {
    show.value = !show.value
}

// 聊天内容
const chatData: Ref<Box[]> = ref([])

watch(() => searchText.value, () => {
    deb()
})
// 输入内容
function handleSearch () {
    if (searchText.value) {
        dbRead(activeFriend.value.chat_table, 'text', searchText.value)
        .then((res: any) => {
            
            res.forEach((chat: Box) => {
                const textIndex = chat.text.indexOf(searchText.value)
                const textNewPosition = textIndex - 10 > 0 ? textIndex - 10 : 0
                const newText = textNewPosition > 0 ?  '...' + chat.text.slice(textNewPosition) : chat.text.slice(textNewPosition)
                chat.text = newText.replace(
                    searchText.value,
                    '<span style="color: red; background-color: #ffeb00;">'
                        + searchText.value
                        + '</span>'
                    )
            })

            chatData.value = res as Box[]
        })
        .catch(err => {
            console.log('err -> ', err)
        })
    } else {
        chatData.value = []
    }
}
const deb = debounce(handleSearch, 1000)

// 跳转到指定位置
function gotoPosition (row: Box) {
    if (row.id) {
        setActionFriendPositionData({
            use: row.id,
            first: row.id - (scrollSafeLength.value / 2) > 0 ? row.id - (scrollSafeLength.value / 2) : 0,
            last: row.id + (scrollSafeLength.value / 2 || 10)
        })
        // chatBox.value = []
        nextTick(() => {
            // 加个搜索文字锁，防止重复请求
            searchTextLock.value = 'Yes'


            // 重置锁
            scrollUpLock.value = 'UnLock'
            scrollDownLock.value = 'UnLock'
            // 记录的结尾标识也需要重置
            isLastChatList.value = 'No'
            // 存在回到最新提示的也需要重置
            isShowGoToNewBtn.value = 'No'
            // 未显示内容需要重置
            chatBoxCacheList.value = []
            

            getChatFromServer('Yes', 'prev')
        })
    }
}


defineExpose({
    showSearch
})

</script>
<style lang="scss" scoped>
.container {
    height: 92vh;
    width: 250px;
    max-height: 700px;
    margin-left: 13px;
    border-radius: 5px;
    overflow: auto;
    background-color: #fff;
    padding: 8px;
    box-sizing: border-box;
}

.f-header {
    padding-bottom: 10px;
    border-bottom: 1px solid #ddd;
}

.chat-text {
    margin: 8px;
    word-wrap: break-word;
    font-size: 13px;
    color: #454545;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    &:hover {
        background-color: #f5f6fa;
        cursor: pointer;
        border-radius: 5px;
    }
}
:deep(.el-divider--horizontal) {
    margin: 8px 0;
}
</style>