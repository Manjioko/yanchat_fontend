
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    { path: '/', name: 'Login', component: () => import('../view/loginToChat.vue') },
    { path: '/chat', name: 'Chat', component: () => import('../view/Main/mainIndex.vue') }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})
// 路由拦截
router.beforeEach((to, from, next) => {
    const user_info = sessionStorage.getItem('user_info')
    if (to.path === '/chat') {
        if (!user_info) return next('/')
    }
    if (to.path === '/') {
        if (user_info) return next('/chat')
    }

    const fx = routes.findIndex(r => r.path === to.path)

    if (fx === -1) {
        return next('/')
    }

    next()
})
export default router;