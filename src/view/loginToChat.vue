<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
let router = ref('')
let phone = ref('')
let pw = ref('')
// let showErr = ref(false)
// let showloginErr = ref(false)
onMounted(() => {
    router.value = useRouter()
})
async function login() {
    if (phone.value && pw.value) {
        const res = await window.$axios({
            method: 'post',
            url: process.env.VUE_APP_LOGIN,
            data: {
                phone_number: phone.value,
                password: pw.value
            }
        })
        const { status, data } = res
        console.log(status, data)
        if (status !== 200) return

        if (data !== 'err') {
            sessionStorage.setItem('user_info', JSON.stringify(data))
            // sessionStorage.setItem('id', `${phone.value}//client2`)
            router.value.push({ name: 'Chat', query: { user_id: data.user_id } })
            // showloginErr.value = false
            return
        }
        ElMessageBox.confirm(
            '当前用户尚未注册，是否自动注册并登录？',
            'Warning',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
                center: true,
            }
        ).then(() => {
            register(data)
        }).catch(err => {
            console.log(err)
        })
    }
}

async function register() {
    const res = await window.$axios({
        method: 'post',
        url: process.env.VUE_APP_REGISTER,
        data: {
            phone_number: phone.value,
            password: pw.value
        }
    })
    const { status, data } = res
    // console.log(status, data)
    if (status === 200) {
        if (data === 'exist') {
            return
        }
        sessionStorage.setItem('user_info', JSON.stringify(data))
        ElMessage({
            message: `${phone.value} 已经成功注册！`,
            type: 'success',
        })
        router.value.push({ name: 'Chat', query: { user_id: data.user_id } })
    }
}

</script>
<template>
    <main class="container">
        <section class="login-box">
            <div class="welcome">
                欢迎登录
            </div>
            <section class="login">
                <div class="login-text">
                    <span class="login-id">手机号:</span>
                    <input type="text" placeholder="请输入你的手机号" v-model="phone" class="input" />
                </div>
                <div class="login-text">
                    <span class="login-id">密码:</span>
                    <input type="password" placeholder="请输入密码" v-model="pw" class="input" />
                </div>
            </section>
            <section class="forget-pw">
                <div>忘记密码？</div>
            </section>
            <section>
                <div>
                    <button class="login-in" @click="login">登录/注册</button>
                    <!-- <button class="login-register" @click="register">注册</button> -->
                </div>
            </section>
        </section>
    </main>
</template>

<style lang="scss" scoped>
.container {
    background-image: url('../assets/login_bg.png');
    background-size: 100% 100%;
    background-repeat: no-repeat;
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
}

.login-text {
    box-sizing: border-box;
    padding: 10px;
}

.input {
    padding: 10px;
    margin: 0 10px;
    // outline: none;
    font-size: 13px;
    border: 1px solid #CCCCCC;
    border-radius: 4px;
    width: 19rem;
}

.login-id {
    font-size: 14px;
    font-weight: 500;
    display: block;
    margin: 10px;
    color: #999999;
}

.login-in {
    width: 21rem;
    height: 45px;
    outline: none;
    border: navajowhite;
    border-radius: 28px;
    background: #2F88FF;
    box-shadow: 0px 3px 6px 0px rgba(221, 223, 230, 0.31);
    margin: 10px;
    cursor: pointer;
    color: #fff;
    font-size: 14px;
    font-weight: 400;
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

.login-box {
    width: 25rem;
    height: 30rem;
    background: #FFFFFF;
    box-shadow: 0px 14px 51px 0px rgba(103, 125, 100, 0.33);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-right: 11rem;
}

.welcome {
    font-size: 37px;
    box-sizing: border-box;
    color: #2F88FF;
    padding-bottom: 2rem;
}

.forget-pw {
    display: flex;
    width: 20rem;
    box-sizing: border-box;
    font-size: 13px;
    color: #2F88FF;
    font-weight: 500;
    padding: 20px 0;
}</style>