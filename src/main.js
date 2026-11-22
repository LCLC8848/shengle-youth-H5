import { createApp } from 'vue'
import 'vant/es/button/style'
import 'vant/es/switch/style'
import 'vant/es/uploader/style'
import 'vant/es/popup/style'
import './style.css'
import App from './App.vue'
import { router } from './router.js'

createApp(App).use(router).mount('#app')

