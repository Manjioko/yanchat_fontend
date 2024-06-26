import { createApp } from 'vue'
import App from './App.vue'
import router from './router/router.js'
// import { store, key } from '@/store'
import 'element-plus/theme-chalk/index.css'
import 'highlight.js/styles/github-dark.css'
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import VueDragResize from 'vue-drag-resize'
import { createPinia } from 'pinia'
import { getHost, getWsHost } from './utils/getHost'

const Pinia = createPinia()


// sessionStorage.setItem('wsBaseUrl', 'wss://192.168.9.99')
// sessionStorage.setItem('baseUrl', 'https://192.168.9.99')
// console.log('cookie的值是 -> ', document.cookie)
sessionStorage.setItem('baseUrl', getHost())
sessionStorage.setItem('wsBaseUrl', getWsHost())
const app = createApp(App)
app.component('vue-drag-resize', VueDragResize)
// app.use(store, key)
app.use(router)
app.use(Pinia)
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
