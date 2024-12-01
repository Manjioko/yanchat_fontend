import { createApp } from 'vue'
import App from './App.vue'
import router from './router/router.js'
// import { store, key } from '@/store'
import 'element-plus/theme-chalk/index.css'
import 'highlight.js/styles/github-dark.css'
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import VConsole from 'vconsole'
import VueDragResize from 'vue-drag-resize'
import { createPinia } from 'pinia'
import { getHost, getWsHost } from './utils/getHost'

const Pinia = createPinia()

if (process.env.NODE_ENV === 'development') {
    const vConsole = new VConsole();
}

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

// ios 浏览器禁止双指放大
window.onload = function() {
    // 阻止双指放大
    document.addEventListener('gesturestart', function(event) {
        event.preventDefault();
    });

    // 阻止双指缩小
    // document.addEventListener('touchmove', function(event:any) {
    //     console.log('阻止双指缩小 ====', event.target.className)
    //     if (event.target.className && ['chat-box-local', 'chat-box-remote', 'video-style', 'video video-self', 'el-image__inner el-image__preview', 'pr-message'].includes(event.target.className)) {
    //         return
    //     }
    //     event.preventDefault();
    // }, { passive: false });


    if (window.visualViewport) {
        const initialHeight = window.visualViewport.height;
    
        window.visualViewport.addEventListener('resize', (e: any) => {
            const currentHeight = window?.visualViewport?.height;
            const keyboardHeight = initialHeight - (currentHeight || 0);
            if (keyboardHeight > 0) {
                console.log('键盘已打开');
                // document.body.style.height = `${window.innerHeight - keyboardHeight}px`;
                // window.scrollTo(0, 0);
                document.addEventListener('touchmove', touchMove, { passive: false })
            } else {
                console.log('键盘已关闭');
                // document.body.style.height = '100%';
                // document.removeEventListener('touchmove', touchMove)
                document.removeEventListener('touchmove', touchMove)
            }
        });
    }


    // document.addEventListener('focusin', () => {
    //     if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
    //     }
    // })

    // document.addEventListener('focusout', () => {
    //     if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
    //     }
    // })

}


function touchMove (event: any) {
    console.log('手指移动到的位置 ====', event.target.className)
    if (event.target.className && ['chat-box-local', 'chat-box-remote', 'video-style', 'video video-self', 'el-image__inner el-image__preview', 'pr-message'].includes(event.target.className)) {
        return
    }
    event.preventDefault();
}