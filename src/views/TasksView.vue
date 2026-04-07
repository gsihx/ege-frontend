<template>
  <div class="tasks-container">
    <h1>Тренажер ЕГЭ</h1>

    <div class="actions-panel">
      <div class="filters">
        <div class="filter-group">
          <label>Предмет:</label>
          <select v-model="selectedSubject" @change="fetchTasks">
            <option value="Математика">Математика</option>
            <option value="Информатика">Информатика</option>
            <option value="Русский язык">Русский язык</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Вариант из базы:</label>
          <select v-model="selectedVariant" @change="fetchTasks">
            <option value="Все">Все задачи</option>
            <option value="1">Вариант 1</option>
            <option value="2">Вариант 2</option>
            <option value="3">Вариант 3</option>
            <option value="4">Вариант 4</option>
            <option value="5">Вариант 5</option>
          </select>
        </div>
      </div>

      <div class="generator-section">
        <button @click="fetchRandomExam" class="gen-btn">
          🎲 Сгенерировать КИМ
        </button>
      </div>
    </div>

    <div v-if="isRandomExam" class="timer-panel" :class="{ 'timer-low': timeLeft < 600 }">
      <div class="timer-content">
        <span class="timer-label">⏱ Осталось времени:</span>
        <span class="timer-clock">{{ formatTime(timeLeft) }}</span>
      </div>
    </div>

    <div v-if="loading" class="status-msg">
      <div class="spinner"></div> Загрузка заданий...
    </div>

    <div v-else-if="tasks && tasks.length > 0" class="tasks-list">
      <div 
        v-for="task in tasks" 
        :key="task.id" 
        :class="['task-card', { 'is-solved': solvedTaskIds.includes(task.id) }]"
      >
        <div class="task-header">
          <div class="header-left">
            <span class="subject-badge" :class="getSubjectClass(task.subject)">{{ task.subject }}</span>
          </div>
          <div class="header-right">
            <span class="info-text">
              {{ isRandomExam ? 'Случайный КИМ' : `Вариант ${task.variant_number}` }} | Задание №{{ task.task_number }}
            </span>
          </div>
        </div>
        
        <div class="task-body">
          <div class="task-content">{{ task.content }}</div>
          
          <div v-if="task.image_url" class="image-container">
            <img 
              :src="'http://192.168.0.98:5000' + task.image_url" 
              alt="Иллюстрация к заданию" 
              class="task-image"
            />
          </div>
        </div>

        <div class="task-actions">
          <input 
            v-model="userAnswers[task.id]" 
            type="text" 
            placeholder="Введите ответ" 
            class="answer-input"
            :disabled="solvedTaskIds.includes(task.id)"
            @keyup.enter="checkAnswer(task.id)"
          />
          <button @click="checkAnswer(task.id)" class="check-btn" :disabled="solvedTaskIds.includes(task.id)">
            {{ solvedTaskIds.includes(task.id) ? 'Решено' : 'Проверить' }}
          </button>
        </div>

        <div v-if="results[task.id] !== undefined" 
             :class="['result-msg', results[task.id] ? 'correct' : 'incorrect']">
          {{ results[task.id] ? '✅ Верно! Прогресс сохранен.' : '❌ Неверно, попробуйте еще раз.' }}
        </div>
      </div>

      <div v-if="isRandomExam" class="finish-section">
        <button @click="finishExam" class="finish-btn">Завершить экзамен</button>
      </div>
    </div>

    <div v-else class="status-msg">
      По вашему запросу ничего не найдено.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import api from '@/services/api.js'
import { useRouter } from 'vue-router'

const router = useRouter()
const tasks = ref([])
const solvedTaskIds = ref([])
const loading = ref(true)
const isRandomExam = ref(false)
const selectedSubject = ref('Математика')
const selectedVariant = ref('Все')
const userAnswers = ref({})
const results = ref({})
const timeLeft = ref(235 * 60)
const timerInterval = ref(null)

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
}

const startTimer = () => {
  if (timerInterval.value) clearInterval(timerInterval.value)
  timerInterval.value = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
      localStorage.setItem('exam_time_left', timeLeft.value)
    } else {
      finishExam()
    }
  }, 1000)
}

const stopTimer = () => {
  clearInterval(timerInterval.value)
  localStorage.removeItem('exam_time_left')
  localStorage.removeItem('is_exam_mode')
}

const fetchSolvedTasks = async () => {
  try {
    const response = await api.get('/user_solved_tasks')
    solvedTaskIds.value = response.data.solved_task_ids || []
  } catch (error) {
    console.error('Ошибка прогресса:', error)
  }
}

const fetchTasks = async () => {
  loading.value = true
  isRandomExam.value = false
  stopTimer()
  try {
    const response = await api.get(`/tasks?subject=${selectedSubject.value}&variant=${selectedVariant.value}`)
    tasks.value = response.data.tasks || response.data
    await fetchSolvedTasks()
  } catch (error) {
    console.error(error)
    tasks.value = []
  } finally {
    loading.value = false
  }
}

const fetchRandomExam = async () => {
  loading.value = true
  isRandomExam.value = true
  solvedTaskIds.value = []
  results.value = {}
  userAnswers.value = {}
  
  try {
    const response = await api.get(`/generate_exam?subject=${selectedSubject.value}`)
    tasks.value = response.data.tasks || response.data
    
    timeLeft.value = 235 * 60
    localStorage.setItem('exam_time_left', timeLeft.value)
    localStorage.setItem('is_exam_mode', 'true')
    startTimer()
  } catch (error) {
    alert("Ошибка генерации КИМ")
    isRandomExam.value = false
  } finally {
    loading.value = false
  }
}

const checkAnswer = async (taskId) => {
  const answer = userAnswers.value[taskId]
  if (!answer || !answer.trim()) return
  try {
    const response = await api.post('/check_answer', {
      task_id: taskId,
      user_answer: answer.trim()
    })
    results.value[taskId] = response.data.correct
    if (response.data.correct && !solvedTaskIds.value.includes(taskId)) {
      solvedTaskIds.value.push(taskId)
    }
  } catch (error) {
    alert('Пожалуйста, войдите в аккаунт для сохранения результата.')
  }
}

const finishExam = async () => {
  const score = tasks.value.filter(t => solvedTaskIds.value.includes(t.id)).length
  try {
    await api.post('/save_exam_result', {
      subject: selectedSubject.value,
      score: score,
      total: tasks.value.length
    })
    stopTimer()
    isRandomExam.value = false
    alert(`Экзамен завершен! Ваш результат: ${score} из ${tasks.value.length}`)
    router.push('/dashboard')
  } catch (e) {
    console.error(e)
    isRandomExam.value = false
    router.push('/dashboard')
  }
}

const getSubjectClass = (subject) => {
  if (subject === 'Математика') return 'badge-math'
  if (subject === 'Информатика') return 'badge-it'
  if (subject === 'Русский язык') return 'badge-ru'
  return ''
}

onMounted(() => {
  const savedExamMode = localStorage.getItem('is_exam_mode')
  if (savedExamMode === 'true') {
    const savedTime = localStorage.getItem('exam_time_left')
    timeLeft.value = savedTime ? parseInt(savedTime) : 235 * 60
    isRandomExam.value = true
    startTimer()
    // Загружаем текущие задачи из режима экзамена (нужно эндпоинт на бэкенде или хранить ID в localStorage)
    fetchTasks() 
  } else {
    fetchTasks()
  }
})

onUnmounted(() => clearInterval(timerInterval.value))
</script>

<style scoped>
.tasks-container { max-width: 900px; margin: 0 auto; padding: 20px; font-family: 'Inter', sans-serif; }
h1 { text-align: center; color: #2c3e50; margin-bottom: 30px; }

.actions-panel { 
  display: flex; justify-content: space-between; align-items: center; 
  background: white; padding: 20px; border-radius: 12px; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.08); margin-bottom: 20px; 
}

.filters { display: flex; gap: 20px; }
.filter-group { display: flex; flex-direction: column; gap: 5px; }
.filter-group select { padding: 8px; border-radius: 6px; border: 1px solid #ddd; outline: none; }

.gen-btn { 
  background: #6e42b9; color: white; border: none; 
  padding: 12px 20px; border-radius: 8px; font-weight: bold; 
  cursor: pointer; transition: 0.3s; 
}
.gen-btn:hover { background: #5a32a3; transform: translateY(-2px); }

.timer-panel { 
  position: sticky; top: 10px; z-index: 100; 
  background: #2c3e50; color: white; padding: 15px; 
  border-radius: 10px; margin-bottom: 25px; text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}
.timer-clock { font-size: 1.6em; font-weight: bold; margin-left: 10px; color: #42b983; font-family: monospace; }
.timer-low .timer-clock { color: #ff5252; animation: blink 1s infinite; }

.task-card { background: white; border-radius: 12px; padding: 25px; margin-bottom: 20px; border: 1px solid #eee; transition: 0.3s; }
.task-card.is-solved { border-left: 8px solid #42b983; background: #f0fff4; }

.task-header { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px; align-items: center; }
.subject-badge { color: white; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; }
.badge-math { background: #f39c12; }
.badge-it { background: #3498db; }
.badge-ru { background: #e91e63; }

.info-text { color: #888; font-size: 14px; }
.task-content { font-size: 17px; line-height: 1.6; white-space: pre-wrap; margin-bottom: 20px; color: #333; }

.image-container { margin: 20px 0; text-align: center; }
.task-image { max-width: 100%; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border: 1px solid #ddd; }

.task-actions { display: flex; gap: 10px; margin-top: 20px; }
.answer-input { flex: 1; padding: 12px; border: 2px solid #eee; border-radius: 8px; font-size: 16px; transition: 0.3s; }
.answer-input:focus { border-color: #42b983; outline: none; }

.check-btn { 
  background: #42b983; color: white; border: none; 
  padding: 10px 25px; border-radius: 8px; cursor: pointer; 
  font-weight: bold; transition: 0.3s; 
}
.check-btn:disabled { background: #bdc3c7; cursor: not-allowed; }

.result-msg { margin-top: 15px; padding: 10px; border-radius: 6px; font-weight: bold; text-align: center; }
.result-msg.correct { background: #d4edda; color: #155724; }
.result-msg.incorrect { background: #f8d7da; color: #721c24; }

.finish-section { text-align: center; margin: 40px 0; }
.finish-btn { background: #ff5252; color: white; border: none; padding: 18px 50px; border-radius: 10px; font-size: 1.2em; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(255,82,82,0.3); }

.status-msg { text-align: center; padding: 40px; color: #7f8c8d; font-size: 1.2em; }
.spinner { border: 4px solid #f3f3f3; border-top: 4px solid #42b983; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; display: inline-block; vertical-align: middle; margin-right: 10px; }

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes blink { 50% { opacity: 0.6; } }
</style>