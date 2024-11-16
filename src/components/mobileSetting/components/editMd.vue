<template>
    <!-- <div>md</div> -->
     <div class="md-container">
        <div class="md-title">
            <div class="md-status">
                使用状态:  <span class="md-status-text"> {{ mdStatus }}</span>
            </div>
        </div>
        <div class="md">
            <div class="text md-no" @click="handleNoMd">不使用Markdown</div>
            <div class="text md-yes" @click="handleUseMd">使用Markdown</div>
        </div>
     </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FriendsListStore } from '../../friendsList/store'
import { storeToRefs } from 'pinia'
import * as API from '../../appSetting/api'
import router from '@/router/router';
// import to from 'await-to-js'

const friendsListStore = FriendsListStore()

const { userInfo: user_info } = storeToRefs(friendsListStore)

const md = sessionStorage.getItem('is_use_md') || user_info.value.is_use_md

const mdStatus = ref('使用Markdown')

if (md === 'true' || md === '1') {
    mdStatus.value = '使用Markdown'
} else {
    mdStatus.value = '不使用Markdown'
}

function handleUseMd() {
    API.getMarkDownStatus({
        user_id: user_info.value.user_id,
        is_use_md: true
    })
    mdStatus.value = '使用Markdown'
    sessionStorage.setItem('is_use_md', 'true')
    setTimeout(() => {
        router.replace('/chat')
    }, 2000);
    // window.location.reload()
}

function handleNoMd() {
    API.getMarkDownStatus({
        user_id: user_info.value.user_id,
        is_use_md: false
    })
    mdStatus.value = '不使用Markdown'
    sessionStorage.setItem('is_use_md', 'false')

    setTimeout(() => {
        router.replace('/chat')
    }, 2000);
    // window.location.reload()
}


</script>



<style scoped lang="scss">
.md-container {
    padding: 16px;
    background: #f4f4f4;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.md-status {
    background: #fff;
    padding: 16px;
    color: #ddd;
    border-radius: 8px;
}

.md-title {
    flex: 1;
}

.md {
    margin-bottom: 16px;
}


.text {
    background: #fff;
    padding: 10px;
    text-align: center;
    font-size: 18px;
    border-radius: 8px;
    margin: 16px 0;
}

.md-no {
    // border: 1px solid #409eff;
    color: #fa7b7b;
}

.md-yes {
    background: #409eff;
    color: #fff;
}

.md-status-text {
    // color: #409eff;
    font-size: 18px;
    font-weight: 500;
    color: black;
}
</style>