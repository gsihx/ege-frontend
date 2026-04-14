<template>
  <div class="admin-container">
    <div class="admin-card">
      <h2>{{ isEditing ? 'Редактирование задания' : 'Панель администратора' }}</h2>
      <p class="subtitle">
        {{ isEditing ? 'Измените данные и сохраните их' : 'Добавление нового задания в базу данных' }}
      </p>

      <form @submit.prevent="saveTask" class="admin-form">
        <div class="form-row">
          <div class="form-group">
            <label>Предмет:</label>
            <select v-model="currentTask.subject">
              <option value="Математика">Математика</option>
              <option value="Информатика">Информатика</option>
              <option value="Русский язык">Русский язык</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Номер задания (ЕГЭ):</label>
            <input v-model.number="currentTask.task_number" type="number" placeholder="Например, 22" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Вариант:</label>
            <select v-model.number="currentTask.variant_number">
              <option :value="1">Вариант 1</option>
              <option :value="2">Вариант 2</option>
              <option :value="3">Вариант 3</option>
              <option :value="4">Вариант 4</option>
              <option :value="5">Вариант 5</option>
            </select>
          </div>
          <div class="form-group">
            <label>Правильный ответ:</label>
            <input v-model="currentTask.correct_answer" type="text" placeholder="Введите ответ" required />
          </div>
        </div>

        <div class="form-group">
          <label>Текст задания:</label>
          <textarea v-model="currentTask.content" rows="4" placeholder="Введите условие задачи..." required></textarea>
        </div>

        <div class="form-group">
          <label>Изображение (необязательно):</label>
          <div class="file-upload-wrapper">
            <input type="file" @change="handleFileUpload" accept="image/*" class="file-input" id="file-input" />
            <label for="file-input" class="file-label">
              {{ selectedFile ? 'Файл выбран: ' + selectedFile.name : 'Выберите файл изображения' }}
            </label>
          </div>
          
          <div v-if="imagePreview || currentTask.image_url" class="preview-container">
            <img :src="imagePreview || ('https://ege-api2-gsihx.amvera.io' + currentTask.image_url)" class="image-preview" alt="Превью" />
            <button type="button" @click="removeImage" class="remove-btn">Удалить фото</button>
          </div>
        </div>

        <div class="button-group">
          <button type="submit" class="submit-btn" :disabled="isSubmitting">
            {{ isSubmitting ? 'Сохранение...' : (isEditing ? 'Сохранить изменения' : 'Создать задачу') }}
          </button>
          <button v-if="isEditing" type="button" @click="cancelEdit" class="cancel-btn">
            Отмена
          </button>
        </div>
      </form>

      <hr class="divider" />
      
      <div class="tasks-management">
        <h3>Управление задачами</h3>
        <div v-if="isLoadingTasks" class="loading">Загрузка списка...</div>
        <div v-else-if="tasks.length === 0" class="no-tasks">Задач в базе пока нет</div>
        
        <div v-else class="tasks-list">
          <div v-for="task in tasks" :key="task.id" class="task-management-item">
            <div class="task-brief">
              <span class="task-badge">№{{ task.task_number }}</span>
              <span class="variant-badge">Вар. {{ task.variant_number }}</span>
              <span class="task-sub">{{ task.subject }}</span>
              <p class="task-text-preview">{{ task.content }}</p>
            </div>
            <div class="task-ctrl">
              <button @click="startEdit(task)" class="edit-btn">Изменить</button>
              <button @click="deleteTask(task.id)" class="delete-btn">Удалить</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';

const tasks = ref([]);
const isSubmitting = ref(false);
const isLoadingTasks = ref(false);
const isEditing = ref(false);
const editId = ref(null);
const selectedFile = ref(null);
const imagePreview = ref(null);

const currentTask = reactive({
  subject: 'Информатика',
  task_number: null,
  variant_number: 1, // По умолчанию 1 вариант
  content: '',
  correct_answer: '',
  image_url: null
});

const fetchAllTasks = async () => {
  isLoadingTasks.value = true;
  try {
    // ВАЖНО: запрос идет просто на /tasks, без /api
    const response = await axios.get('https://ege-api2-gsihx.amvera.io/tasks');
    
    // ПРОВЕРКА: сервер может возвращать { tasks: [...] } или просто [...]
    if (response.data.tasks) {
      tasks.value = response.data.tasks;
    } else {
      tasks.value = response.data;
    }
  } catch (error) {
    console.error('Ошибка загрузки списка:', error);
  } finally {
    isLoadingTasks.value = false;
  }
};

const startEdit = (task) => {
  isEditing.value = true;
  editId.value = task.id;
  currentTask.subject = task.subject;
  currentTask.task_number = task.task_number;
  currentTask.variant_number = task.variant_number || 1;
  currentTask.content = task.content;
  currentTask.correct_answer = task.correct_answer;
  currentTask.image_url = task.image_url;
  selectedFile.value = null;
  imagePreview.value = null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const cancelEdit = () => {
  isEditing.value = false;
  editId.value = null;
  resetForm();
};

const resetForm = () => {
  currentTask.subject = 'Русский язык';
  currentTask.task_number = null;
  currentTask.content = '';
  currentTask.correct_answer = '';
  currentTask.image_url = null;
  removeImage();
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    imagePreview.value = URL.createObjectURL(file);
  }
};

const removeImage = () => {
  selectedFile.value = null;
  imagePreview.value = null;
  currentTask.image_url = null;
  const input = document.getElementById('file-input');
  if (input) input.value = '';
};

// Найди это место в AdminView.vue
const saveTask = async () => {
  isSubmitting.value = true;
  const formData = new FormData();
  formData.append('subject', currentTask.subject);
  formData.append('task_number', currentTask.task_number);
  formData.append('variant_number', currentTask.variant_number);
  formData.append('content', currentTask.content);
  formData.append('correct_answer', currentTask.correct_answer);
  if (selectedFile.value) {
    formData.append('image', selectedFile.value);
  }

  try {
    // 1. ДОБАВЛЯЕМ ПОЛНЫЙ АДРЕС БЭКЕНДА
    const baseUrl = 'https://ege-api2-gsihx.amvera.io';
    const url = isEditing.value 
      ? `${baseUrl}/api/admin/tasks/${editId.value}` 
      : `${baseUrl}/api/admin/tasks`;
    
    const method = isEditing.value ? 'put' : 'post';

    await axios({
      method: method,
      url: url,
      data: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    alert(isEditing.value ? 'Задание обновлено!' : 'Задание добавлено!');
    cancelEdit();
    fetchAllTasks();
  } catch (error) {
    if (error.response?.status === 401) {
      alert('Сессия истекла. Пожалуйста, войдите в аккаунт снова.');
    } else {
      // Чуть улучшил вывод ошибки, чтобы мы видели, если сервер ругается
      console.error(error);
      alert('Ошибка при сохранении: ' + (error.response?.data?.error || error.message));
    }
  } finally {
    isSubmitting.value = false;
  }
};

const deleteTask = async (id) => {
  if (!confirm('Удалить задание?')) return;
  try {
    await axios.delete(`https://ege-api2-gsihx.amvera.io/api/tasks/${id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    tasks.value = tasks.value.filter(t => t.id !== id);
  } catch (error) {
    alert('Ошибка удаления');
  }
};

onMounted(fetchAllTasks);
</script>

<style scoped>
.admin-container { display: flex; justify-content: center; padding: 40px 20px; background-color: #f0f2f5; min-height: 100vh; }
.admin-card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); width: 100%; max-width: 750px; }
h2 { color: #333; margin-bottom: 5px; }
h3 { color: #444; border-left: 4px solid #42b983; padding-left: 10px; margin-bottom: 20px; }
.subtitle { color: #666; margin-bottom: 25px; font-size: 0.9rem; }
.admin-form { display: flex; flex-direction: column; gap: 20px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.form-group { display: flex; flex-direction: column; text-align: left; }
label { font-weight: 600; margin-bottom: 8px; color: #444; }
input, select, textarea { padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; }
.file-label { display: block; padding: 12px; background: #f8f9fa; border: 2px dashed #ccc; border-radius: 6px; text-align: center; cursor: pointer; }
.file-input { display: none; }
.preview-container { text-align: center; margin-top: 10px; border: 1px solid #eee; padding: 10px; border-radius: 8px; }
.image-preview { max-width: 100%; max-height: 200px; border-radius: 4px; }
.button-group { display: flex; gap: 10px; margin-top: 10px; }
.submit-btn { flex: 2; background-color: #42b983; color: white; padding: 14px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
.cancel-btn { flex: 1; background-color: #6c757d; color: white; padding: 14px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
.divider { margin: 40px 0; border: 0; border-top: 1px solid #eee; }
.task-management-item { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #fdfdfd; border: 1px solid #eee; border-radius: 8px; margin-bottom: 12px; }
.task-brief { text-align: left; flex: 1; }
.task-badge { background: #42b983; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-right: 8px; }
.variant-badge { background: #3498db; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-right: 8px; }
.task-text-preview { margin: 5px 0 0; font-size: 0.9rem; color: #555; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.task-ctrl { display: flex; gap: 8px; }
.edit-btn { background: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; }
.delete-btn { background: #ff4d4f; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; }
</style>