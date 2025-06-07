import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../components/hiprintViewer.vue')
  },
  {
    path: '/template-designer',
    name: 'TemplateDesigner',
    component: () => import('../views/TemplateDesigner.vue')
  },
  {
    path: '/help',
    name: 'Help',
    component: () => import('../views/HelpPage.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router 