<script setup>

// import { ref } from 'vue'

// const count = ref(0)

</script>
<template>
    <main class="main">
        <section class="chat-window">
            <section class="text-show"></section>
            <section class="text-send">
                <input type="text">
                <button>
                    <span>发送</span>
                </button>
            </section>
        </section>
    </main>
</template>
<style lang="scss" scoped>
.main {
    background-color: #F5F6FA;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}
.chat-window {
    width: 70vw;
    height: 85vh;
    min-width: 600px;
    max-width: 1000px;
    max-height: 875px;
    background-color: #fff;
    display: flex;
    flex-direction: column;
}
.text-show {
    flex: 1;
}
.text-send {
    height: 7vh;
    display: flex;
    input {
        flex: 1;
    }
}
</style>