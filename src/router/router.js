
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', name:'Login', component: () => import('../view/loginToChat.vue') },
  { path: '/chat', name: 'Chat', component: () => import('../view/mainUi.vue') }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;