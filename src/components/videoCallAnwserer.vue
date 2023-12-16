<!-- 结构部分 -->
<template>
    <VueDragResize :w="600" :h="300" :isResizable="false" :z="99999">
        <h3>Hello World!</h3>
    </VueDragResize>
</template>

<script setup>
import VueDragResize from 'vue-drag-resize'
</script>

<!-- 样式部分 -->
<style lang="scss" scoped></style>