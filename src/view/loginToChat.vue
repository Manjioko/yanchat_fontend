<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
let router = ref('')
let myId = ref('')
let otherId = ref('')
onMounted(() => {
    router.value = useRouter()
})
function login() {
    if (myId.value && otherId.value) {
        sessionStorage.setItem('id', `${myId.value}//${otherId.value}`)
        router.value.push({ name: 'Chat' })
    }
}

</script>
<template>
    <main class="container">
        <section class="login">
            <div class="login-text">
                <span class="login-id">你的ID:</span>
                <input type="text" v-model="myId" class="input" />
            </div>
            <div class="login-text">
                <span class="login-id">Ta的ID:</span>
                <input type="text" v-model="otherId" class="input" />
            </div>
        </section>
        <section>
            <div>
                <button class="login-in" @click="login">登陆</button>
            </div>
        </section>
    </main>
</template>

<style lang="scss" scoped>
.container {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.login-text {
    box-sizing: border-box;
    padding: 10px;
}

.input {
    padding: 12px;
    margin: 0 10px;
    outline: none;
    font-size: 18px;
    width: 257px;
}

.login-id {
    font-size: 18px;
    font-weight: 600;
    display: block;
    margin: 10px;
}

.login-in {
    width: 285px;
    height: 45px;
    outline: none;
    border: navajowhite;
    // box-shadow: 1px 1px 3px #ddd;
    background: #2F88FF;
    box-shadow: 0px 3px 6px 0px rgba(221, 223, 230, 0.31);
    border-radius: 3px;
    margin: 10px;
    cursor: pointer;
    color: #fff;
    font-size: 18px;
    font-weight: 600;
}
</style>