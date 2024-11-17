<template>
    <div
        ref="mediaIcon"
        class="media-icon"
        :class="{
            'media-icon-self': user === 1,
            'media-icon-other': user === 0,
            'show-bottom': showBottom,
        }"
    >
        <div
            v-if="!showBottom"
            class="triangle-down"
            :class="{ 'show-self': user === 1 }"
        >
        </div>
        <span class="m-icon" v-if="user === 1">
            <div class="m-icon-box" @click="handleBack">
                <div class="m-icon-text">撤回</div>
                <el-icon><Back /></el-icon>
            </div>
        </span>
        <span class="m-icon">
            <div class="m-icon-box" @click="handleQuote">
                <div class="m-icon-text">引用</div>
                <el-icon><Connection /></el-icon>
            </div>
        </span>
        <span class="m-icon">
            <div class="m-icon-box"  @click="handleDelete">
                <div class="m-icon-text">删除</div>
                <el-icon color="#f00"><Delete /></el-icon>
            </div>
        </span>
        <div v-if="showBottom" class="triangle-up" :class="{'show-other': user === 0}"></div>
    </div>
</template>



<script lang="ts" setup>
import { Back, Delete, Connection } from '@element-plus/icons-vue'
import { defineEmits, onMounted, ref } from 'vue'

const emit = defineEmits(['withdraw', 'deleted', 'quote'])

const mediaIcon = ref()

const props = defineProps({
    dataIndex: Number,
    user: Number,
})

let showBottom = ref(false)

onMounted(() => {
    const rect = mediaIcon.value.getBoundingClientRect()
    // console.log('props -> ', mediaIcon.value.getBoundingClientRect())
    if (rect && rect.top < 50) {
        console.log('showBottom -> ', true)
        showBottom.value = true
    }
})

function handleBack() {
    emit('withdraw', props.dataIndex)
}

function handleDelete() {
    emit('deleted', props.dataIndex)
}

function handleQuote() {
    emit('quote', props.dataIndex)
}
</script>

<style scoped lang="scss">
.media-icon {
    display: flex;
    display: flex;
    background: #ddd;
    padding: 10px;
    position: absolute;
    top: -80px;
    border-radius: 8px;
    min-width: 200px;
}
.media-icon-self {
    justify-content: flex-end;
    right: 0;
}
.media-icon-other {
    justify-content: flex-start;
    left: 0;
}

.m-icon {
    margin: 0 8px;
}
.show-bottom {
    top: unset !important;
    bottom: -80px;
    z-index: 1;
}


.triangle-up{
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid #ddd;
  position: absolute;
    top: -7px;
    left: 80%;
    z-index: 1;

}

.triangle-down{
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #ddd;
  position: absolute;
    bottom: -7px;
    left: 10%;
    z-index: 1;

}

.m-icon-box {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: 0 8px;
}
.m-icon-text {
    margin-bottom: 8px;
    color: #333;
}

.show-self {
    left: unset !important;
    right: 10%;
}
.show-other {
    left: 10% !important;
}
</style>