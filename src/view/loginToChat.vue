<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import antiShake from '@/utils/antiShake'
let router = ref('')
// 用户输入的电话号码
let phone = ref('')
// 用户输入的密码
let pw = ref('')
// 密码错误锁
let pwErr = ref(false)
// 重复登录锁
let repeatErr = ref(false)
onMounted(() => {
    router.value = useRouter()
})
const delayToShowErr = antiShake(() => {
    pwErr.value = true
}, 300)
const delayToShowRepeatErr = antiShake(() => {
    repeatErr.value = true
}, 300)
async function login() {
    if (phone.value && pw.value) {
        // 发送登录请求
        const res = await window.$axios({
            method: 'post',
            url: process.env.VUE_APP_LOGIN,
            data: {
                phone_number: phone.value,
                password: pw.value
            }
        })
        const { status, data } = res
        if (status !== 200) return

        console.log('data -> ', data)

        // 重复登录
        if (data === 'repeat') {
            repeatErr.value = false
            delayToShowRepeatErr()
            return
        }

        // 密码错误
        if (data === 'pw_err') {
            pwErr.value = false
            delayToShowErr()
            return
        } else {
            pwErr.value = false
        }

        // 服务器无法处理的错误
        if (data !== 'err') {
            sessionStorage.setItem('user_info', JSON.stringify(data))
            // 保存 user_id 到 sessionStorage
            sessionStorage.setItem('user_id', data.user_id)
            router.value.push({ name: 'Chat' })
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
    // 校验手机号码
    if(!(/^1[34578]\d{9}$/.test(phone.value))){
        ElMessage({
            message: `${phone.value}: 电话号格式有误`,
            type: 'error',
        })
        return
    }

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

        // 保存 user_id 到 sessionStorage
        sessionStorage.setItem('user_id', data.user_id)
        router.value.push({ name: 'Chat' })
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
                    <div v-if="pwErr" class="pw-err">密码错误！</div>
                    <div v-if="repeatErr" class="pw-err">重复登录！</div>
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
    position: relative;
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
}
.pw-err {
    text-align: end;
    font-size: 12px;
    color: #ff6767;
    margin-top: 6px;
    // margin-right: 6px;
    position: absolute;
    right: 15px;
}
</style>