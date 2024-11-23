
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    { path: '/', name: 'Login', component: () => import('../view/Login/loginIndex.vue') },
    { path: '/chat', name: 'Chat', component: () => import('../view/Main/entryRouter.vue') },
    { path: '/nick', name: 'Nick', component: () => import('../components/mobileSetting/components/editNick.vue') },
    { path: '/md', name: 'Md', component: () => import('../components/mobileSetting/components/editMd.vue') },
    { path: '/msg', name: 'Msg', component: () => import('../components/mobileSetting/components/editMsg.vue') }
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