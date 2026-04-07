import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import LoginView from '../views/LoginView.vue'
import TasksView from '../views/TasksView.vue'
import AdminView from '../views/AdminView.vue'
import RegisterView from '../views/RegisterView.vue' // Импорт компонента регистрации

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/',
      redirect: '/dashboard' // Автоматический редирект на дашборд
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register', // Маршрут для регистрации
      name: 'register',
      component: RegisterView
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: TasksView
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView
    }
  ]
})

// Глобальная защита маршрутов (Navigation Guard)
router.beforeEach((to) => {
  const isAuthenticated = !!localStorage.getItem('token');
  const isAdmin = localStorage.getItem('is_admin') === 'true';

  // 1. Если пользователь не вошел и пытается зайти куда-то, кроме логина или регистрации
  if (to.name !== 'login' && to.name !== 'register' && !isAuthenticated) {
    return { name: 'login' };
  } 
  
  // 2. Если авторизованный пользователь пытается зайти на страницу входа или регистрации
  if ((to.name === 'login' || to.name === 'register') && isAuthenticated) {
    return { name: 'dashboard' };
  }

  // 3. Защита админ-панели
  if (to.path === '/admin' && !isAdmin) {
    alert('Доступ запрещен: требуются права администратора');
    return { name: 'dashboard' };
  }

  // Если проверки пройдены, разрешаем переход
  return true;
})

export default router