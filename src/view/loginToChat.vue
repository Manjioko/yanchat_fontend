<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
let router = ref('')
let phone = ref('')
let pw = ref('')
let showErr = ref(false)
let showloginErr = ref(false)
onMounted(() => {
    router.value = useRouter()
})
async function login() {
    if (phone.value && pw.value) {
        const res = await  window.$axios({
            method: 'post',
            url: process.env.VUE_APP_LOGIN,
            data: {
                phone_number: phone.value,
                password: pw.value
            }
        })
        const { status, data} = res
        console.log(status, data)
        if (status !== 200) return

        if (data === 'ok') {
            // sessionStorage.setItem('id', `${phone.value}//client2`)
            // router.value.push({ name: 'Chat' })
            showloginErr.value = false
            return
        }
        showloginErr.value = true
    }
}

async function register() {
   const res = await  window.$axios({
        method: 'post',
        url: process.env.VUE_APP_REGISTER,
        data: {
            phone_number: phone.value,
            password: pw.value
        }
    })
    const { status, data} = res
    console.log(status, data)
    if (status === 200) {
        if (data === 'exist') {
            showErr.value = true
            return
        }
        showErr.value = false
    } 
}

</script>
<template>
    <main class="container">
        <section>
            <div class="err-tip" v-show="showErr">
                已存在该账号，请直接登陆即可
            </div>
            <div class="err-tip" v-show="showloginErr">
                账号不存在，请注册后使用
            </div>
        </section>
        <section class="login">
            <div class="login-text">
                <span class="login-id">手机号:</span>
                <input type="text" placeholder="请输入你的手机号"  v-model="phone" class="input" />
            </div>
            <div class="login-text">
                <span class="login-id">密码:</span>
                <input type="password" placeholder="请输入密码" v-model="pw" class="input" />
            </div>
        </section>
        <section>
            <div>
                <button class="login-in" @click="login">登陆</button>
                <button class="login-register" @click="register">注册</button>
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
    width: 130px;
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
.login-register {
    width: 130px;
    height: 45px;
    outline: none;
    border: #ddd;
    background: #ffffff;
    box-shadow: 0px 3px 6px 0px rgb(89 107 169 / 31%);
    border-radius: 3px;
    margin: 10px;
    cursor: pointer;
    color: #2F88FF;
    font-size: 18px;
    font-weight: 600;
}
.err-tip {
    color: red;
    font-size: 12px;
    opacity: 0.6;
    font-weight: 600;
}
</style>