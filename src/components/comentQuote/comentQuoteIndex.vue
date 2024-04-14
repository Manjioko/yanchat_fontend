<template>
    <section v-if="showInputQuote" class="input-style">
        <div class="quote-style">
            <span class="quote-span">{{ comment }}</span>
            <span>
                <el-icon class="quote-icon" @click="handleClick">
                    <Close />
                </el-icon>
            </span>
        </div>
    </section>
    <section v-else>
        <div class="quote-style-box">
            <span class="quote-span">{{ comment }}</span>
        </div>
    </section>
</template>
<!-- script setup -->
<script setup lang="ts">
import { Close } from '@element-plus/icons-vue'
import { defineProps, watch } from 'vue'
import {handleQuoteCloseEvent } from './Methods/quote'
// import { MainStore } from '@/view/Main/store'
import { CommentQuoteStore } from './store'
import { storeToRefs } from 'pinia'

const { comment } = storeToRefs(CommentQuoteStore())
watch(() => comment.value, () => {
    console.log('comment.value23333333 -> ', comment.value)
})
// const emit = defineEmits(['close'])
defineProps({
    showInputQuote: {
        type: Boolean,
        default: false
    }
})

function handleClick() {
    // emit('close')
    handleQuoteCloseEvent()
}
</script>
<!-- style -->
<style lang="scss" scoped>
.input-style {
    position: absolute;
    top: -28px;
    width: 100%;
}
.quote-style {
    background: rgb(224 224 224 / 32%);
    font-size: 12px;
    color: #555;
    box-sizing: border-box;
    padding: 7px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top-left-radius: 5px;
    border-top-right-radius: 40px;
    width: 50%;
}
.quote-icon {
    vertical-align: middle;
    color: #0000008a;
    cursor: pointer;
}
.quote-span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.quote-style-box {
    background: rgb(224 224 224 / 32%);
    font-size: 11px;
    color: #555;
    box-sizing: border-box;
    padding: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 200px;
    margin-top: 4px;
    border-radius: 3px;
}
</style>
