<template>
  <div class="login-container">
    <div class="login-card">
      <h2>Вход в систему</h2>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">Имя пользователя</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            placeholder="Введите логин" 
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Пароль</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="Введите пароль" 
            required
          />
        </div>

        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Вход...' : 'Войти' }}
        </button>
      </form>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="auth-footer">
        <p>Нет аккаунта? 
          <router-link to="/register">Зарегистрироваться</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  error.ref = '';
  isLoading.value = true;

  try {
    const response = await axios.post('http://https://backend-production-bf52.up.railway.app:5000/api/login', {
      username: username.value,
      password: password.value
    });

    // Сохраняем данные в localStorage
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('is_admin', response.data.is_admin);
    localStorage.setItem('username', response.data.username);

    // Переходим на главную панель
    router.push({ name: 'dashboard' });
  } catch (err) {
    if (err.response && err.response.data) {
      error.value = err.response.data.error || 'Ошибка входа';
    } else {
      error.value = 'Не удалось связаться с сервером';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box; /* Чтобы padding не раздувал ширину */
}

button {
  width: 100%;
  padding: 0.75rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
}

button:disabled {
  background-color: #a8d5c2;
}

.error-message {
  color: #e74c3c;
  background-color: #fdeaea;
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 1rem;
  text-align: center;
}

.auth-footer {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
}

.auth-footer a {
  color: #42b983;
  text-decoration: none;
  font-weight: bold;
}

.auth-footer a:hover {
  text-decoration: underline;
}
</style>