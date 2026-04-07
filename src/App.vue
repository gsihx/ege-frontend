<template>
  <div id="app">
    <nav v-if="showNavbar" class="navbar">
      <div class="nav-container">
        <router-link to="/dashboard" class="logo">ЕГЭ Профи</router-link>
        <div class="nav-links">
          <router-link to="/dashboard">Личный кабинет</router-link>
          <router-link to="/tasks">Банк задач</router-link>
          
          <router-link v-if="isAdmin" to="/admin" class="admin-link">Админ-панель</router-link>
          
          <button @click="logout" class="logout-btn">Выйти</button>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watchEffect } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const isAdmin = ref(false);

// Скрываем навигацию на странице логина
const showNavbar = computed(() => route.path!== '/login');

// Следим за состоянием админа (обновляем при монтировании и изменениях)
watchEffect(() => {
  isAdmin.value = localStorage.getItem('is_admin') === 'true';
});

const logout = () => {
  localStorage.clear();
  isAdmin.value = false;
  router.push('/login');
};
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background-color: #f8fafc; font-family: 'Inter', sans-serif; }

.navbar { background: white; border-bottom: 1px solid #e2e8f0; padding: 15px 0; }
.nav-container { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; }
.logo { font-weight: 800; font-size: 20px; text-decoration: none; color: #2563eb; }

.nav-links { display: flex; align-items: center; gap: 20px; }
.nav-links a { text-decoration: none; color: #64748b; font-weight: 600; font-size: 14px; transition: 0.2s; }
.nav-links a.router-link-active { color: #2563eb; }

.admin-link { color: #10b981!important; border: 1px solid #10b981; padding: 5px 12px; border-radius: 6px; }
.admin-link:hover { background: #10b981; color: white!important; }

.logout-btn { background: #fee2e2; color: #ef4444; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.main-content { padding: 20px 0; }
</style>