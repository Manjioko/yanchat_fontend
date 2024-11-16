<template>
<div class="nick">
    <!-- <div class="nick-title">修改昵称:</div> -->
    <div class="nick-top">
        <el-input class="nick-input" :placeholder="placeholder" v-model="nickName">
        </el-input>
    </div>

    <div class="nick-footer">
        <div class="text cancel-text" @click="handleClose">取消</div>
        <div class="text save-text" @click="saveNickName">保存</div>
    </div>
</div>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import { FriendsListStore } from '../../friendsList/store'
import { storeToRefs } from 'pinia'
import * as API from '../../appSetting/api'
import to from 'await-to-js'
import { setUserInfo } from '@/view/Main/Methods/userInfoOperator'
import { ElMessage } from 'element-plus'
import { onBeforeRouteLeave } from 'vue-router'
import router from '@/router/router'


const friendsListStore = FriendsListStore()
const { userInfo: user_info } = storeToRefs(friendsListStore)

const placeholder = ref(user_info.value.user)
const user_id = sessionStorage.getItem('user_id')


// 保存昵称
const nickName = ref('')
async function saveNickName() {
    console.log('user_info.value -> ', user_info.value)
    if (!nickName.value) return console.log('昵称为空')
    const [err, res] = await to(API.saveNickName({
            nick_name: nickName.value,
            phone_number: user_info.value.phone_number
        }))
    if (err) {
        ElMessage.error('修改昵称失败')
        return
    }
    if (res.status === 200 && res.data !== 'err') {
        ElMessage({
            message: '昵称修改成功',
            type: 'success',
        })
        placeholder.value = nickName.value
        nickName.value = ''
        const [err, res] = await to(API.getFriends({
                user_id: user_id || '',
                get_user_info: true
            }))
        if (err) return
        handleNickNameChange(res.data)
    }
}

function handleNickNameChange(fri: any) {
    user_info.value = fri
    setUserInfo(fri)

    setTimeout(() => {
        router.replace('/chat')
    }, 2000);
}


function handleClose() {
    router.replace('/chat')
}

onBeforeRouteLeave(() => {
    return true
})


</script>


<style scoped lang="scss">
.nick {
    padding: 16px;
    background: #f4f4f4;
    height: 100%;
    display: flex;
    flex-direction: column;
}
.nick-top {
    flex: 1;
}
.nick-footer {
    margin-bottom: 16px;
}
.nick-input {
    // padding: 18px;
    :deep .el-input__wrapper {
        border-radius: 8px;
        .el-input__inner {
            height: 50px;
            line-height: 50px;
            border-radius: 20px;
            font-size: 24px;
        }
    }
}

.text {
    background: #fff;
    padding: 10px;
    text-align: center;
    font-size: 18px;
    border-radius: 8px;
    margin: 16px 0;
}

.cancel-text {
    // border: 1px solid #409eff;
    color: #fa7b7b;
}

.save-text {
    background: #409eff;
    color: #fff;
}
</style>