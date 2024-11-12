<template>
    <div style="height: 100%;">
        <mainIndex v-if="switchPage === 'PC'" />
        <mobileIndex v-else-if="switchPage === 'MOBILE'">hello world</mobileIndex>
    </div>
</template>

<script setup lang="ts">
import mainIndex from './pcIndex.vue';
import mobileIndex from './mobileIndex.vue';
import { onMounted, ref } from 'vue';

const switchPage = ref('PC'); 

onMounted(() => {
    if (window.outerWidth < 600) {
        switchPage.value = 'MOBILE';
    }

    if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
        // 当前设备是移动设备
        switchPage.value = 'MOBILE';
        console.log('mobile');
    } else {
        switchPage.value = 'PC';
        console.log('pc');
    }
})
</script>

<style scoped>
</style>