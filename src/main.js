import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'
import router from './router'

// import {i18n} from './locales/i18n.js'
// createApp(App).use(i18n).mount('#app') // 注入国际化函数$t


createApp(App).use(ElementPlus).use(router).mount('#app')
