import { createApp } from 'vue'

const app = createApp({})
const eventBus = app.config.globalProperties.$eventBus = new app()

export default eventBus