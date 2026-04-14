import axios from 'axios';

// 1. Создаем базовый экземпляр Axios
const api = axios.create({
  baseURL: 'https://ege-api2-gsihx.amvera.io'
});

// 2. ПЕРЕХВАТЧИК ЗАПРОСОВ (Request Interceptor)
// Он срабатывает ПЕРЕД тем, как любой запрос уйдет на бэкенд
api.interceptors.request.use(
  (config) => {
    // Пытаемся достать токен из памяти браузера
    const token = localStorage.getItem('token');

    // Если токен есть, приклеиваем его к заголовку Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. ПЕРЕХВАТЧИК ОТВЕТОВ (Response Interceptor)
// Он срабатывает, когда бэкенд присылает ответ
api.interceptors.response.use(
  (response) => {
    // Если всё хорошо (статус 200, 201), просто отдаем данные компоненту
    return response;
  },
  (error) => {
    // Если сервер ответил ошибкой 401 (Токен истек, неверный или отсутствует)
    if (error.response && error.response.status === 401) {
      console.warn('Токен истек или недействителен. Выполняем выход...');

      // Очищаем старые данные сессии
      localStorage.removeItem('token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');

      // Перенаправляем пользователя на страницу входа
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 4. ОБЯЗАТЕЛЬНЫЙ ЭКСПОРТ
// Именно эту переменную (api) импортируют твои компоненты Vue
export default api;
