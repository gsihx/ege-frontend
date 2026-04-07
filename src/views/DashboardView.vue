<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <div class="user-welcome">
        <h1>Личный кабинет</h1>
        <p class="welcome-text">Привет, {{ username }}! Рады видеть тебя снова. 👋</p>
      </div>
      <button @click="handleLogout" class="logout-btn">Выйти</button>
    </div>

    <div class="achievements-section">
      <h3>Твои достижения 🏆</h3>
      <div class="achievements-grid" v-if="achievements.length > 0">
        <div 
          v-for="ach in achievements" 
          :key="ach.id" 
          class="ach-card" 
          :class="{ 'locked': !ach.earned }"
        >
          <div class="ach-icon">{{ ach.icon }}</div>
          <div class="ach-info">
            <span class="ach-name">{{ ach.name }}</span>
            <span class="ach-description">{{ ach.description }}</span>
            <span class="ach-status">{{ ach.earned ? 'Получено!' : 'Заблокировано' }}</span>
          </div>
        </div>
      </div>
      <div v-else class="loading-placeholder">Загрузка достижений...</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <h3>Решено задач</h3>
        <div class="stat-value">{{ solvedTasksCount }}</div>
        <p class="stat-label">всего за всё время</p>
      </div>
      <div class="stat-card">
        <h3>Средний балл</h3>
        <div class="stat-value">{{ averageScore }}%</div>
        <p class="stat-label">на основе пробников</p>
      </div>
    </div>

    <div class="history-section">
      <h3>Последние пробники</h3>
      <div v-if="examHistory.length > 0" class="history-list">
        <div v-for="(exam, index) in examHistory" :key="index" class="history-item">
          <div class="exam-info">
            <span class="exam-subject">{{ exam.subject }}</span>
            <span class="exam-date">{{ formatDate(exam.completed_at) }}</span>
          </div>
          <div class="exam-score-badge">
            <strong>{{ exam.score }}</strong> <span class="divider">/</span> {{ exam.total_tasks }}
          </div>
        </div>
      </div>
      <div v-else class="empty-history">
        <p>Пока нет завершенных экзаменов.</p>
      </div>
    </div>

    <div class="actions">
      <router-link to="/tasks" class="action-btn">К новым задачам! 🎯</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '@/services/api.js';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const username = ref(localStorage.getItem('username') || 'Ученик');
const solvedTasksCount = ref(0);
const examHistory = ref([]);
const achievements = ref([]);

// Считаем средний процент успеха
const averageScore = computed(() => {
  if (examHistory.value.length === 0) return 0;
  const total = examHistory.value.reduce((acc, ex) => acc + (ex.score / ex.total_tasks * 100), 0);
  return Math.round(total / examHistory.value.length);
});

const fetchData = async () => {
  try {
    // Используем относительные пути, так как базовый URL уже в api.js
    const solvedRes = await api.get('/user_solved_tasks');
    solvedTasksCount.value = solvedRes.data.solved_task_ids ? solvedRes.data.solved_task_ids.length : 0;

    const historyRes = await api.get('/user_exam_history');
    examHistory.value = historyRes.data.history || [];

    // ИСПРАВЛЕНО: убран лишний /api/
    const achRes = await api.get('/user_achievements'); 
    achievements.value = achRes.data.achievements || [];
    
  } catch (error) {
    console.error('Ошибка при загрузке данных Dashboard:', error);
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const handleLogout = () => {
  auth.logout();
  router.push('/login');
};

onMounted(fetchData);
</script>

<style scoped>
.dashboard-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px 20px;
  font-family: 'Inter', sans-serif;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
}

.welcome-text { color: #64748b; margin-top: 5px; }

/* ДОСТИЖЕНИЯ */
.achievements-section {
  background: #fff;
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.ach-card {
  display: flex;
  gap: 15px;
  padding: 15px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.ach-card.locked {
  opacity: 0.5;
  filter: grayscale(1);
}

.ach-card:not(.locked):hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.ach-icon { font-size: 24px; }
.ach-info { display: flex; flex-direction: column; }
.ach-name { font-weight: 600; font-size: 14px; color: #1e293b; }
.ach-description { font-size: 12px; color: #64748b; }
.ach-status { font-size: 11px; margin-top: 4px; font-weight: bold; color: #10b981; }

/* СТАТИСТИКА */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: #fff;
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-card h3 { font-size: 16px; color: #1e293b; margin-bottom: 10px; }
.stat-value { font-size: 32px; font-weight: 800; color: #2563eb; }
.stat-label { font-size: 13px; color: #94a3b8; margin-top: 5px; }

/* ИСТОРИЯ */
.history-section {
  background: #fff;
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f1f5f9;
}

.history-item:last-child { border-bottom: none; }
.exam-subject { font-weight: 600; color: #1e293b; display: block; }
.exam-date { font-size: 12px; color: #94a3b8; }
.exam-score-badge { font-size: 16px; color: #1e293b; }
.exam-score-badge strong { color: #2563eb; font-size: 18px; }
.divider { color: #cbd5e1; margin: 0 4px; }

/* КНОПКИ */
.logout-btn {
  background: #fee2e2;
  color: #ef4444;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.logout-btn:hover { background: #fecaca; }

.action-btn {
  display: block;
  width: 100%;
  text-align: center;
  background: #2563eb;
  color: #fff;
  padding: 16px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 700;
  transition: background 0.2s;
}

.action-btn:hover { background: #1d4ed8; }

.loading-placeholder, .empty-history {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
}
</style>