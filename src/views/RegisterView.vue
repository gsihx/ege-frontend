<template>
  <div class="register-container">
    <div class="register-card">
      <h2>Регистрация</h2>
      <p>Создайте новый аккаунт для доступа к заданиям</p>

      <div class="form-group">
        <label for="username">Придумайте логин:</label>
        <input 
          id="username"
          v-model="username" 
          type="text" 
          placeholder="Например, student_2026" 
        />
      </div>

      <div class="form-group">
        <label for="password">Придумайте пароль:</label>
        <input 
          id="password"
          v-model="password" 
          type="password" 
          placeholder="Не менее 6 символов" 
        />
      </div>

      <div class="form-group">
        <label for="confirmPassword">Повторите пароль:</label>
        <input 
          id="confirmPassword"
          v-model="confirmPassword" 
          type="password" 
          placeholder="Введите пароль еще раз" 
          @keyup.enter="handleRegister"
        />
      </div>

      <button @click="handleRegister" class="register-btn">Зарегистрироваться</button>
      
      <p class="footer-text">
        Уже есть аккаунт? <router-link to="/login">Войти</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const handleRegister = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    // ВАЖНО: Мы убрали слово data и закрываем скобку axios.post только в самом конце
    const response = await axios.post('https://backend-production-bf52.up.railway.app/api/register', {
      username: username.value,
      password: password.value
    });
    
    if (response.status === 201) {
      // При успешной регистрации перенаправляем на страницу входа
      window.location.href = '/login';
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Ошибка при регистрации. Проверьте бэкенд.';
  } finally {
    loading.value = false;
  }
};
</script>
<style scoped>
.register-container { display: flex; justify-content: center; align-items: center; min-height: 80vh; }
.register-card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); width: 100%; max-width: 420px; text-align: center; }
h2 { margin-bottom: 10px; }
p { color: #666; margin-bottom: 25px; }
.form-group { text-align: left; margin-bottom: 20px; }
label { display: block; margin-bottom: 5px; font-weight: bold; }
input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
.register-btn { width: 100%; padding: 12px; background-color: #42b983; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; transition: background 0.3s; }
.register-btn:hover { background-color: #3aa876; }
.footer-text { margin-top: 20px; font-size: 14px; }
</style>