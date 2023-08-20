<template>
    <div class="container">
        <header class="f-header">
            <el-input
                class="w-50 m-2"
                placeholder="搜索"
                :prefix-icon="Search"
            />
            <div>
                <span class="i-plus" @click="dShow = true">+</span>
            </div>
        </header>
        <main class="f-container">
            <section class="f-friends" :class="{'i-active': i.active}" v-for="(i, idx) in firendList" :key="i.id" @click="handleSelect(idx)">
                <img class="i-img" :src="i.avatar" alt="avatar">
                <div class="i-text">
                    <div class="i-name">{{ i.name }}</div>
                    <div class="i-msg">{{ i.message }}</div>
                </div>
                <div class="i-time">{{ i.time }}</div>
            </section>
        </main>
    </div>

    <div>
        <el-dialog v-model="dShow" title="添加好友" width="30%" center>
            <div class="d-text">
                <el-input
                    placeholder="输入好友手机号码"
                />
            </div>
            <template #footer>
            <span class="dialog-footer">
                <el-button @click="dShow = false">取消</el-button>
                <el-button type="primary" @click="dShow = false">
                确定
                </el-button>
            </span>
            </template>
        </el-dialog>
    </div>
</template>
<script setup>
import { ref } from 'vue';
import { Search } from '@element-plus/icons-vue'
const firendList = ref([
    {
        name: '燕子',
        id: '123',
        time: '14:32',
        message: '我在吃榴莲',
        avatar: require('../assets/avatar1.png'),
        active: false
    },
    {
        name: '银河队长',
        id: '13445',
        time: '22:12',
        message: '我已经毁灭半人马星座了，勿 call',
        avatar: require('../assets/avatar2.png'),
        active: false
    },
])

let dShow = ref(false)
function handleSelect(idx) {
    // console.log(idx)
    firendList.value.forEach((item, i) => {
        if (i === idx) {
            item.active = true
            return
        }

        item.active = false
    })
}
</script>
<style lang="scss" scoped>
    .container {
        display: flex;
        flex-direction: column;
        background-color: #fff;
        height: 92vh;
        width: 260px;
        border-right: 2px solid #F5F6FA;
        border-radius: 5px 0px 0px 5px;
        
    }
    .f-header {
        display: flex;
        box-sizing: border-box;
        padding: 20px 10px;
        align-items: center;
        background-color: #F5F6FA;
        justify-content: center;
        border-top-left-radius: 5px;

        :deep .el-input__wrapper {
            box-shadow: none;
        }
        :deep .el-input__inner {
            font-size: 12px;
        }
    }
    .i-plus {
        width: 26px;
        height: 26px;
        display: block;
        text-align: center;
        line-height: 26px;
        background: #fff;
        margin-left: 10px;
        border-radius: 3px;
        font-size: 18px;
        color: #B0AFB4;
        cursor: pointer;
    }
    .w-50.m-2 {
        height: 26px;
    }
    .f-friends {
        display: flex;
        align-items: center;
        box-sizing: border-box;
        padding: 10px 20px;
        border-bottom: 1px solid #F5F6FA;
    }
    .i-img {
        width: 35px;
        height: 35px;
    }
    .i-text {
        margin-left: 15px;
        flex: 1;
    }
    .i-name {
        font-size: 14px;
        color: #333333;
        width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .i-msg {
        font-size: 12px;
        color: #999999;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 140px;
        margin-top: 8px;
    }
    .i-time {
        font-size: 12px;
        color: #999999;
    }
    .i-active {
        background-color: #E8F2FF;;
    }
</style>