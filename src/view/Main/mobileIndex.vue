<template>
     <div class="mobile-container">
        <header v-show="tabActive === 'friend'" class="header-title">
            <div v-show="activeFriend.chat_table" @click="handleBack">
                <el-icon>
                    <ArrowLeftBold />
                </el-icon>
                <!-- <tipsMessages /> -->
            </div>
            <div class="header-title-text">{{ activeFriend.user || '燕言' }}</div>
            <div v-show="!activeFriend.chat_table">
                <!-- <el-icon>
                    <MoreFilled />
                </el-icon> -->
                <!-- <tipsMessages /> -->
                 <More @addFriend="localClickAddFriend" />
            </div>
        </header>
        <main class="chat-window" v-show="tabActive === 'friend'">
            <ChatWindow v-show="activeFriend.chat_table"/>
            <!-- <section class="zero-friend" v-else>还未选择聊天好友</section> -->
            <div v-show="!activeFriend.chat_table" class="friends-list">
                <friendsList ref="friendsListRef"  :mobile-mode="true" />
            </div>


            <div style="position: relative;">
                <!-- <comentQuote v-if="showQuote" :show-input-quote="true" /> -->
                <SendFoot v-if="activeFriend.chat_table" :mobile-mode="true" />
            </div>
        </main>
        <section class="chat-window" v-show="tabActive === 'me'">
            <!-- TODO... -->
             <MobileSetting />
        </section>
        <footer v-show="!activeFriend.chat_table">
            <div class="footer">
                <!-- <img src="../../assets/setting.png" alt="setting" /> -->
                <div class="tab-item" @click="whoActive('friend')">
                    <el-icon size="20" style="padding-bottom: 6px;" :color="tabActive === 'friend' ? '#2F88FF' : '#000'" >
                        <ChatRound />
                    </el-icon>
                    <span :style="tabActive === 'friend' ? 'color: #2F88FF' : '#000'">好友</span>
                </div>
                <div class="tab-item" @click="whoActive('me')">
                    <el-icon size="20" style="padding-bottom: 6px;" :color="tabActive === 'me' ? '#2F88FF' : '#000'" >
                        <User />
                    </el-icon>
                    <span :style="tabActive === 'me' ? 'color: #2F88FF' : '#000'">我的</span>
                </div>
            </div>
        </footer>
     </div>
</template>

<script setup lang="ts">
import ChatWindow from '@/components/chatWindow/chatWindowIndex.vue';
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import friendsList from '@/components/friendsList/friendsListIndex.vue'
import { FriendsListStore } from '@/components/friendsList/store'
const friendsListStore = FriendsListStore()
const { activeFriend } = storeToRefs(friendsListStore)
import { ChatRound, User, ArrowLeftBold } from '@element-plus/icons-vue'
import SendFoot from '@/components/sendFoot/sendFootIndex.vue'
import More from '@/components/mobileMore/moreIndex.vue'
import MobileSetting from '@/components/mobileSetting/moIndex.vue'
// import { CommentQuoteStore } from '@/components/comentQuote/store'
// import comentQuote from '@/components/comentQuote/comentQuoteIndex.vue'

// const { showQuote } = storeToRefs(CommentQuoteStore())
// import tipsMessages from '@/components/tipsMessages/tipsMessagesIndex.vue'


const friendsListRef = ref()

const tabActive = ref('friend')
function whoActive(tab: string) {
    tabActive.value = tab
}

function handleBack() {
    // tabActive.value = 'friend'
    friendsListRef.value.clearFriend()
}


function localClickAddFriend() {
    friendsListRef.value.showAddFriendDialog()
}
</script>

<style scoped lang="scss">
.mobile-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}
.header-title {
    -webkit-tap-highlight-color: transparent;
    background: #fcfcfc;
    text-align: center;
    padding: 16px;
    // color: #2F88FF;
    font-weight: 500;
    font-size: 18px;
    display: flex;
    border-bottom: 1px solid #f4f4f4;
    .header-title-text {
        flex: 1;
    }
}
.zero-friend {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #999999;
    background-color: #f8f8f86e;
}
.chat-window {
    flex: 1;
    background-color: #f4f4f4;
    display: flex;
    flex-direction: column;
    border-radius: 0 5px 5px 0;
    overflow: hidden;
    // border-radius: 5px;
    // box-shadow: 0px 1px 6px 6px rgba(221, 223, 230, 0.31);

    :deep .f-container {
        background-color: #f4f4f4;
        .f-friends {
            background-color: #fff;
        }
        .i-img {
            width: 45px;
            height: 45px;
            border-radius: 8px;
        }

        .i-name {
            font-size: 16px;
            font-weight: 500;
        }
    }
    :deep .text-show {
        background-color: #fff;
    }
}

.footer {
    background: #fcfcfc;
    display: flex;
    justify-content: space-around;
    padding: 8px;
    height: 50px;
    border-top: .5px solid #ddd;
    font-size: 16px;
    font-weight: 500;
    user-select: none;
}
.tab-item {
    -webkit-tap-highlight-color: transparent;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #000;
    // background-color: red;
    width: 120px;
}
.friends-list {
    height: 100%;
    user-select: none;
}
</style>