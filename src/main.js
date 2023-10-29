import { createApp } from 'vue'
import App from './App.vue'
import router from './router/router.js'
import axios from 'axios'
import 'element-plus/theme-chalk/index.css'
import 'highlight.js/styles/github-dark.css'
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
// import ContextMenu from '@imengyu/vue3-context-menu'
sessionStorage.setItem('baseUrl', '/api')
sessionStorage.setItem('wsBaseUrl', 'ws://192.168.9.99:9999')
axios.defaults.withCredentials = true
window.$axios = axios
const app = createApp(App)
app.use(router)
// app.use(ContextMenu)
app.mount('#app')

// 查看浏览器是否支持 Notification
if ('Notification' in window) {
    // 浏览器支持 Web Notifications API
    if (Notification.permission === 'default') {
        Notification.requestPermission().then(function (permission) {
            if (permission === 'granted') {
                // 用户已授权
                console.log('用户已授权')
            } else {
                // 用户拒绝了权限请求
                console.log('用户拒绝了权限请求')
            }
        })
    }
} else {
    console.log('浏览器不支持 Web Notifications API');
}