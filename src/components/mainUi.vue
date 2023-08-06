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
                    <img src="../assets/send.png" alt="send">
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
    box-sizing: border-box;
    padding: 8px;
    input {
        flex: 1;
    }
    button {
        width: 140px;
        background: #2F88FF;
        outline: none;
        display: flex;
        justify-content: center;
        align-items: center;
        border: none;
        span {
            font-size: 18px;
            color: #FFFFFF;
        }
        img {
            width: 18px;
            height: 18px;
            margin-left: 12px;
        }
    }
}
</style>