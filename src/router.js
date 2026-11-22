import { createRouter, createWebHashHistory } from 'vue-router'
import { session } from './core/session.js'
import { steps } from './core/content.js'
import CoverPage from './views/CoverPage.vue'
import QuizPage from './views/QuizPage.vue'
import PhotoPage from './views/PhotoPage.vue'
import LoadingPage from './views/LoadingPage.vue'
import ResultPage from './views/ResultPage.vue'

export const routes = [
  { path: '/', name: 'cover', component: CoverPage, meta: { page: 0, title: '定制你的画像' } },
  ...steps.map(step => ({
    path: '/quiz/' + step.key, name: step.route, component: QuizPage,
    props: { step }, meta: { page: step.index, title: step.title },
  })),
  { path: '/photo', name: 'photo', component: PhotoPage, meta: { page: 4, title: '如何记录此刻的你' } },
  { path: '/loading', name: 'loading', component: LoadingPage, meta: { page: 5, title: '正在拼出你的专属海报' } },
  { path: '/result', name: 'result', component: ResultPage, meta: { page: 6, title: '揭晓你的青年画像' } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]
export const router = createRouter({ history: createWebHashHistory(), routes })
router.beforeEach(to => {
  const missing = steps.find(s => !session.answers[s.key])
  if (missing && to.meta.page > missing.index) return { name: missing.route, replace: true }
  if (to.meta.page >= 5 && !session.photoConfirmed) return { name: 'photo', replace: true }
})
router.afterEach(to => { document.title = to.meta.title + ' · 盛乐青年' })

