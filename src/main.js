import { createApp } from 'vue'
import App from './App.vue'
import router from './router/router.js'
import axios from 'axios'
import 'element-plus/theme-chalk/index.css'
import 'highlight.js/styles/github-dark.css'
// import VueSimpleContextMenu from 'vue-simple-context-menu';
// import 'vue-simple-context-menu/dist/vue-simple-context-menu.css';
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import ContextMenu from '@imengyu/vue3-context-menu'

window.$axios = axios
const app = createApp(App)
app.use(router)
app.use(ContextMenu)
// app.component('vue-simple-context-menu', VueSimpleContextMenu);
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