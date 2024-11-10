<template>
    <div class="tips">
        <el-popover placement="bottom" :width="150" trigger="click">
            <template #reference>
                <el-icon :size="20" style="margin-left: 10px;"><MoreFilled /></el-icon>
            </template>

            <div class="tips-container">
                <div>
                    <div class="pop-item" @click="localClickAddFriend">
                        <span><el-icon><Avatar /></el-icon></span>
                        <span class="pop-item-text">添加好友</span>
                    </div>
                    <!-- <el-icon :size="20" style="margin-left: 10px;"><ChatSquare /></el-icon> -->
                </div>
            </div>
        </el-popover>
    </div>
</template>

<script lang="ts" setup>
import { MoreFilled, Avatar } from '@element-plus/icons-vue'
import { defineEmits } from 'vue'
const emit = defineEmits(['addFriend'])


function localClickAddFriend() {
    emit('addFriend')
    
}

</script>

<style lang="scss" scoped>
.pop-item {
    display: flex;
    align-items: center;
}
.pop-item-text {
    margin-left: 10px;
}
</style>