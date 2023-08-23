import { createApp } from 'vue'
import App from './App.vue'
import router from './router/router.js'
import axios from 'axios'
import 'element-plus/theme-chalk/index.css'
window.$axios = axios
const app = createApp(App)
app.use(router)
app.mount('#app')