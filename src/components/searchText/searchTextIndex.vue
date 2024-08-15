<template>
    <div v-if="show" class="container">
        <header class="f-header">
            <el-input
                v-model="searchText"
                placeholder="搜索聊天内容"
                :suffix-icon="Search"
                clearable
                :disabled="activeName !== 'text'"
            />
        </header>
        <main>
            <div>
                <el-tabs v-model="activeName" @tab-click="handleClick">
                    <el-tab-pane label="文本" name="text">
                        <div v-for="chat in textChatData" :key="chat.chat_id">
                            <div class="chat-text" v-html="chat.text" @click="gotoPosition(chat)"></div>
                            <el-divider />
                        </div>
                    </el-tab-pane>
                    <el-tab-pane label="视频" name="media">
                        <div v-for="chat in textChatData" :key="chat.chat_id">
                            <div class="chat-text" @click="gotoPosition(chat)">
                                <img :src="chat.thumbnail" alt="" style="width: 100px;">
                            </div>
                        </div>
                    </el-tab-pane>
                    <el-tab-pane label="图片" name="picture">
                        <div v-for="chat in textChatData" :key="chat.chat_id">
                            <div class="chat-text" @click="gotoPosition(chat)">
                                <img :src="chat.thumbnail" alt="" style="width: 100px;">
                            </div>
                        </div>
                    </el-tab-pane>
                    <el-tab-pane label="文件" name="file">
                        <div v-for="chat in textChatData" :key="chat.chat_id" class="chat-file" @click="gotoPosition(chat)">
                            <div class="chat-file-img">    
                                <img src="../../assets/uploadedFile.png" alt="uploadingZipFile" width="25">
                            </div>
                            <div class="chat-file-name">{{ chat.fileName }}</div>
                        </div>
                    </el-tab-pane>
                </el-tabs>
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
import { MainStore } from '@/view/Main/store'

const searchTextStore = SearchTextStore()
const { searchTextLock } = storeToRefs(searchTextStore)
const { fullScreen } = storeToRefs(MainStore())

const friendStore = FriendsListStore()
const chatWindowStore = ChatWindowStore()
const { activeFriend } = storeToRefs(friendStore)
const { isLastChatList, scrollUpLock, scrollDownLock, scrollSafeLength } = storeToRefs(chatWindowStore)
const { isShowGoToNewBtn, chatBoxCacheList } = storeToRefs(FootSendStore())


const activeName = ref('text')
function handleClick(tab: any) {

    searchText.value = ''
    textChatData.value = []

    if (tab.props.name === 'media') {
        console.log('音视频')
        handleSearch('type', 'video')
        return
    }

    if (tab.props.name === 'picture') {
        console.log('图片')
        handleSearch('type', 'image')
        return
    }

    if (tab.props.name === 'file') {
        console.log('文件')
        handleSearch('type', 'application')
        return
    }
}

const searchText = ref('')

const show = ref(false)

function showSearch() {
    show.value = !show.value
}


const containerHeight = ref(92)
watch(() => fullScreen.value, (val) => {
    if (val) {
        // show.value = false
        containerHeight.value = 100
    } else {
        containerHeight.value = 92
    }
})

// 聊天内容
const textChatData: Ref<Box[]> = ref([])

watch(() => searchText.value, () => {
    deb()
})
// 输入内容
function handleSearch (type: string, str?: string) {
    dbRead(activeFriend.value.chat_table, type || 'text', str || searchText.value || '')
    .then((res: any) => {
        // console.log('res -> ', res)
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
        textChatData.value = res as Box[]
    })
    .catch(err => {
        console.log('err -> ', err)
    })
}
const deb = debounce(handleSearch, 1000)

// 跳转到指定位置
function gotoPosition (row: Box) {
    if (row.id) {
        setActionFriendPositionData({
            use: row.id,
            first: row.id - Math.ceil(scrollSafeLength.value / 2) > 0 ? row.id - Math.ceil(scrollSafeLength.value / 2) : 0,
            last: row.id + Math.ceil(scrollSafeLength.value / 2 || 10)
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
    // height: 92vh;
    height: v-bind('containerHeight + "vh"');
    width: 250px;
    // max-height: 700px;
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
.chat-file {
    display: flex;
    background: #f4f4f4;
    border-radius: 8px;
    padding: 8px;
    margin: 10px 0;
    box-shadow: 2px 2px 1px 1px #fafafa;
    align-items: center;

    .chat-file-img {
        margin-right: 12px;
    }
    .chat-file-name {
        width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
    }
}
</style>