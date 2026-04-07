import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // Состояние (данные)
  const token = ref(localStorage.getItem('token') || null)
  const username = ref(localStorage.getItem('username') || null)
  const userId = ref(localStorage.getItem('user_id') || null)

  // Геттер: автоматически вычисляет, залогинен юзер или нет
  const isAuthenticated = computed(() => !!token.value)

  // Действия (функции для изменения данных)
  function login(userData) {
    token.value = userData.token
    username.value = userData.username
    userId.value = userData.user_id

    localStorage.setItem('token', userData.token)
    localStorage.setItem('username', userData.username)
    localStorage.setItem('user_id', userData.user_id)
  }

  function logout() {
    token.value = null
    username.value = null
    userId.value = null

    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('user_id')
    
    // Перенаправляем на логин (опционально здесь или в компоненте)
    window.location.href = '/login'
  }

  return { token, username, userId, isAuthenticated, login, logout }
})