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

    window.addEventListener('resize', () => {
        if (window.outerWidth > 600) {
            console.log('pc');
            switchPage.value = 'PC';
        } else {
            console.log('mobile');
            switchPage.value = 'MOBILE';
        }
    })
})
</script>

<style scoped>
</style>