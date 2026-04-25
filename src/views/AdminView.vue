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
          <label>Текст задания (поддерживает HTML теги, например &lt;br&gt;, &lt;b&gt;):</label>
          <textarea v-model="currentTask.content" rows="4" placeholder="Введите условие задачи..." required></textarea>
        </div>

        <div class="form-group">
          <label>Изображения (можно выделить сразу несколько):</label>
          <div class="file-upload-wrapper">
            <input type="file" @change="handleImagesUpload" accept="image/*" class="file-input" id="image-input" multiple />
            <label for="image-input" class="file-label">
              {{ selectedImages.length > 0 ? `Выбрано новых фото: ${selectedImages.length}` : 'Выберите файлы изображений' }}
            </label>
          </div>
          
          <div v-if="selectedImages.length > 0" class="selected-files-list">
            <div v-for="(file, index) in selectedImages" :key="'img-'+index" class="file-item">
              <span class="file-name">🖼 {{ file.name }}</span>
              <button type="button" @click="removeSelectedImage(index)" class="remove-tiny-btn">✕</button>
            </div>
          </div>

          <div v-if="currentTask.image_url" class="preview-container">
            <p>Старое фото в базе:</p>
            <img :src="'https://ege-api2-gsihx.amvera.io' + currentTask.image_url" class="image-preview" alt="Превью" />
          </div>
        </div>

        <div class="form-group" v-if="currentTask.subject === 'Информатика'">
          <label>Прикрепленные файлы (txt, xlsx - можно несколько):</label>
          <div class="file-upload-wrapper">
           <input type="file" @change="handleDocsUpload" accept=".txt,.csv,.xlsx,.xls,.doc,.docx" class="file-input" id="doc-input" multiple />
            <label for="doc-input" class="file-label doc-label">
              {{ selectedDocs.length > 0 ? `Выбрано файлов: ${selectedDocs.length}` : '📥 Прикрепить документы к задаче' }}
            </label>
          </div>
          
          <div v-if="selectedDocs.length > 0" class="selected-files-list">
            <div v-for="(file, index) in selectedDocs" :key="'doc-'+index" class="file-item">
              <span class="file-name">📄 {{ file.name }}</span>
              <button type="button" @click="removeSelectedDoc(index)" class="remove-tiny-btn">✕</button>
            </div>
          </div>

          <div v-if="currentTask.file_url" class="preview-container">
            Текущий файл: <a :href="'https://ege-api2-gsihx.amvera.io' + currentTask.file_url" target="_blank">Скачать</a>
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

// Массивы для хранения НОВЫХ файлов
const selectedImages = ref([]);
const selectedDocs = ref([]);

const currentTask = reactive({
  subject: 'Информатика',
  task_number: null,
  variant_number: 1,
  content: '',
  correct_answer: '',
  image_url: null,
  file_url: null
});

const fetchAllTasks = async () => {
  isLoadingTasks.value = true;
  try {
    const response = await axios.get('https://ege-api2-gsihx.amvera.io/tasks');
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
  currentTask.file_url = task.file_url;
  
  // Очищаем очереди новых загрузок при открытии редактирования
  selectedImages.value = [];
  selectedDocs.value = [];
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
  currentTask.file_url = null;
  
  selectedImages.value = [];
  selectedDocs.value = [];
};

// Обработка загрузки картинок (добавление в массив)
const handleImagesUpload = (event) => {
  const newFiles = Array.from(event.target.files);
  selectedImages.value.push(...newFiles);
  event.target.value = ''; // Сброс поля, чтобы можно было выбрать тот же файл снова
};

// Обработка загрузки документов (добавление в массив)
const handleDocsUpload = (event) => {
  const newFiles = Array.from(event.target.files);
  selectedDocs.value.push(...newFiles);
  event.target.value = ''; 
};

// Удаление из массива по крестику
const removeSelectedImage = (index) => {
  selectedImages.value.splice(index, 1);
};

const removeSelectedDoc = (index) => {
  selectedDocs.value.splice(index, 1);
};

const saveTask = async () => {
  isSubmitting.value = true;
  const formData = new FormData();
  formData.append('subject', currentTask.subject);
  formData.append('task_number', currentTask.task_number);
  formData.append('variant_number', currentTask.variant_number);
  formData.append('content', currentTask.content);
  formData.append('correct_answer', currentTask.correct_answer);
  
  // Добавляем ВСЕ картинки из массива
  selectedImages.value.forEach(file => {
    formData.append('images', file);
  });

  // Добавляем ВСЕ документы из массива
  selectedDocs.value.forEach(file => {
    formData.append('documents', file);
  });

  try {
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

    if (isEditing.value) {
      alert('Задание обновлено!');
      cancelEdit(); 
    } else {
      alert('Задание добавлено! Можно вводить следующее.');
      // ЧАСТИЧНЫЙ СБРОС
      currentTask.content = '';
      currentTask.correct_answer = '';
      currentTask.image_url = null;
      currentTask.file_url = null;
      selectedImages.value = [];
      selectedDocs.value = [];
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    fetchAllTasks();
  } catch (error) {
    if (error.response?.status === 401) {
      alert('Сессия истекла. Пожалуйста, войдите в аккаунт снова.');
    } else {
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
    await axios.delete(`https://ege-api2-gsihx.amvera.io/api/admin/tasks/${id}`, {
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
.doc-label { border-color: #3498db; background: #eaf4fc; color: #2980b9; }
.file-input { display: none; }
.preview-container { text-align: center; margin-top: 10px; border: 1px solid #eee; padding: 10px; border-radius: 8px; font-size: 0.9rem;}
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

/* НОВЫЕ СТИЛИ ДЛЯ СПИСКА ФАЙЛОВ */
.selected-files-list { margin-top: 10px; background: #fdfdfd; border: 1px solid #eee; border-radius: 8px; padding: 10px; }
.file-item { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #fafafa; font-size: 0.85rem; }
.file-item:last-child { border-bottom: none; }
.remove-tiny-btn { background: none; border: none; color: #ff4d4f; cursor: pointer; font-weight: bold; padding: 0 5px; transition: 0.2s;}
.remove-tiny-btn:hover { transform: scale(1.2); }
</style>