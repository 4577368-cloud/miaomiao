import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Login from '../views/Login.vue'
import { supabase } from '../utils/supabase'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { title: '登录' }
    },
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      component: Dashboard,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard/overview'
        },
        {
          path: 'overview',
          name: 'Overview',
          component: () => import('../views/Overview.vue'),
          meta: { title: '数据看板' }
        },
        {
          path: 'services',
          name: 'Services',
          component: () => import('../views/ServiceList.vue'),
          meta: { title: '服务管理' }
        },
        {
          path: 'users',
          name: 'Users',
          component: () => import('../views/UserList.vue'),
          meta: { title: '用户管理' }
        },
        {
          path: 'sitters',
          name: 'Sitters',
          component: () => import('../views/SitterList.vue'),
          meta: { title: '宠托师管理' }
        },
        {
          path: 'coupons',
          name: 'Coupons',
          component: () => import('../views/CouponList.vue'),
          meta: { title: '优惠券管理' }
        },
        {
          path: 'announcements',
          name: 'Announcements',
          component: () => import('../views/AnnouncementList.vue'),
          meta: { title: '系统公告' }
        }
      ]
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (to.meta.requiresAuth && !session) {
    next('/login')
  } else if (to.path === '/login' && session) {
    next('/')
  } else {
    next()
  }
})

export default router
