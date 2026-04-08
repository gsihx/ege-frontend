import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router' // <-- Он сам подтянет свои настройки и охранника из index.js

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
