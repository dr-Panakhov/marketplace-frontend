<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../api'
import { getImageUrl } from '../utils/image'
import type { Ad, User } from '../types/api'
import { useToastStore } from '../stores/toast'

const toast = useToastStore()

interface EditForm {
  id: number
  title: string
  price: string | number
  currency: string
  city: string
  phone_number: string
  description: string
  images: Ad['images']
}

const user = ref<User | null>(null)
const myAds = ref<Ad[]>([])

// --- МОДАЛКА УДАЛЕНИЯ ОБЪЯВЛЕНИЯ ---
const showDeleteModal = ref(false)
const adToDelete = ref<number | null>(null)
const isDeleting = ref(false)

// --- МОДАЛКА РЕДАКТИРОВАНИЯ ОБЪЯВЛЕНИЯ ---
const showEditModal = ref(false)
const isSaving = ref(false)
const editForm = ref<EditForm>({
  id: 0, title: '', price: '', currency: 'AZN', city: '', phone_number: '', description: '', images: []
})
const selectedEditFiles = ref<File[]>([])
const deletedImagesIds = ref<number[]>([])

// === НОВОЕ: МОДАЛКА РЕДАКТИРОВАНИЯ ПРОФИЛЯ ===
const showProfileModal = ref(false)
const isSavingProfile = ref(false)
const profileForm = ref({
  first_name: '', last_name: '', patronymic: '', phone_number: ''
})
const selectedAvatar = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)

// --- ЗАГРУЗКА ДАННЫХ ---
const fetchUser = async () => {
  try {
    const response = await api.get<User>('auth/users/me/')
    user.value = response.data
  } catch (error) {
    console.error('Не удалось загрузить профиль:', error)
  }
}

const fetchMyAds = async () => {
  try {
    const response = await api.get<Ad[]>('ads/me/')
    myAds.value = response.data
  } catch (error) {
    console.error('Не удалось загрузить мои объявления:', error)
  }
}

// --- РОЛИ И ОБЪЯВЛЕНИЯ (Твой код) ---
const toggleRole = async () => {
  if (!user.value) return
  const newRole = user.value.role === 'customer' ? 'master' : 'customer'
  try {
    await api.patch('auth/users/me/', { role: newRole })
    user.value.role = newRole
    toast.show(`Режим изменен на «${newRole === 'customer' ? 'Ищу услугу' : 'Предлагаю услуги'}»`, 'success')
  } catch (error) {
    toast.show('Не вышло сменить роль.', 'error')
  }
}

const openDeleteModal = (id: number) => { adToDelete.value = id; showDeleteModal.value = true }
const closeDeleteModal = () => { showDeleteModal.value = false; adToDelete.value = null }

const executeDelete = async () => {
  if (adToDelete.value === null) return
  isDeleting.value = true
  try {
    await api.delete(`ads/${adToDelete.value}/`)
    myAds.value = myAds.value.filter(ad => ad.id !== adToDelete.value)
    closeDeleteModal()
    toast.show('Объявление удалено', 'success')
  } catch (error) {
    toast.show('Не удалось удалить объявление.', 'error')
  } finally {
    isDeleting.value = false
  }
}

const openEditModal = (ad: Ad) => {
  editForm.value = JSON.parse(JSON.stringify(ad))
  selectedEditFiles.value = []
  deletedImagesIds.value = []
  showEditModal.value = true
}
const closeEditModal = () => { showEditModal.value = false }

const handleEditFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) selectedEditFiles.value = Array.from(target.files)
}

const removeExistingImage = (imageId: number) => {
  deletedImagesIds.value.push(imageId)
  editForm.value.images = editForm.value.images.filter((img) => img.id !== imageId)
}

const submitEdit = async () => {
  isSaving.value = true
  try {
    const formData = new FormData()
    formData.append('title', editForm.value.title)
    formData.append('price', String(editForm.value.price))
    formData.append('currency', editForm.value.currency)
    formData.append('city', editForm.value.city)
    formData.append('phone_number', editForm.value.phone_number)
    formData.append('description', editForm.value.description)

    selectedEditFiles.value.forEach(file => formData.append('uploaded_images', file))
    deletedImagesIds.value.forEach(id => formData.append('deleted_images', id.toString()))

    const response = await api.patch<Ad>(`ads/${editForm.value.id}/`, formData)
    
    const index = myAds.value.findIndex(ad => ad.id === editForm.value.id)
    if (index !== -1) myAds.value[index] = response.data
    
    closeEditModal()
    toast.show('Изменения сохранены', 'success')
  } catch (error) {
    toast.show('Не удалось сохранить изменения.', 'error')
  } finally {
    isSaving.value = false
  }
}

const openProfileModal = () => {
  if (!user.value) return
  profileForm.value.first_name = user.value.first_name || ''
  profileForm.value.last_name = user.value.last_name || ''
  profileForm.value.patronymic = user.value.patronymic || ''
  profileForm.value.phone_number = user.value.phone_number || ''
  avatarPreview.value = user.value.avatar ? getImageUrl(user.value.avatar) : null
  selectedAvatar.value = null
  showProfileModal.value = true
}

const handleAvatarChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  selectedAvatar.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

const submitProfileEdit = async () => {
  isSavingProfile.value = true
  try {
    const formData = new FormData()
    formData.append('first_name', profileForm.value.first_name)
    formData.append('last_name', profileForm.value.last_name)
    formData.append('patronymic', profileForm.value.patronymic)
    formData.append('phone_number', profileForm.value.phone_number)
    
    if (selectedAvatar.value) {
      formData.append('avatar', selectedAvatar.value)
    }

    const response = await api.patch<User>('auth/users/me/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    user.value = response.data
    showProfileModal.value = false
    toast.show('Профиль успешно обновлен! 😎', 'success')
  } catch (error) {
    console.error('Ошибка сохранения профиля:', error)
    toast.show('Не удалось сохранить профиль.', 'error')
  } finally {
    isSavingProfile.value = false
  }
}

onMounted(() => {
  fetchUser()
  fetchMyAds()
})
</script>

<template>
  <div class="max-w-4xl mx-auto mt-10 px-4 text-white pb-20">
    <h1 class="text-3xl font-bold mb-6">Мой профиль</h1>
    
    <div v-if="user" class="bg-neutral-800 p-8 rounded-2xl border border-neutral-700 shadow-xl mb-8">
      <div class="flex flex-col md:flex-row items-start md:items-center gap-6">
        
        <div class="relative w-24 h-24 rounded-full overflow-hidden bg-neutral-900 border-2 border-neutral-600 flex-shrink-0">
          <img v-if="user.avatar" :src="getImageUrl(user.avatar)" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-500">
            {{ user.first_name ? user.first_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase() }}
          </div>
        </div>

        <div class="flex-grow">
          <p class="text-2xl font-bold mb-1 break-all">
            {{ user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.email }}
          </p>
          <p v-if="user.phone_number" class="text-gray-400 mb-2">📞 {{ user.phone_number }}</p>
          <p class="text-gray-400">
            Текущий режим: 
            <span class="font-bold ml-2" :class="user.role === 'master' ? 'text-green-400' : 'text-blue-400'">
              {{ user.role === 'customer' ? 'Ищу услугу' : 'Предлагаю услуги' }}
            </span>
          </p>
        </div>

        <div class="flex flex-col gap-3 w-full md:w-auto">
          <button @click="openProfileModal" class="bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-xl font-bold transition-colors w-full">
            Настроить профиль
          </button>
          <button @click="toggleRole" class="bg-neutral-700 hover:bg-neutral-600 border border-neutral-500 px-6 py-2.5 rounded-xl font-bold transition-colors w-full text-sm">
            Переключиться на «{{ user.role === 'customer' ? 'Предлагаю услуги' : 'Ищу услугу' }}»
          </button>
        </div>

      </div>
    </div>
    
    <div v-else class="text-center mt-20 text-gray-400">
      Загружаем инфу...
    </div>

    <div v-if="user && user.role === 'master'">
      <h2 class="text-2xl font-bold mb-6 mt-10">Мои объявления</h2>
      
      <div v-if="myAds.length === 0" class="text-gray-400 bg-neutral-800 p-6 rounded-xl border border-neutral-700 text-center">
        У тебя пока нет активных объявлений. Самое время создать первое!
      </div>

      <div v-else class="grid gap-4">
        <div v-for="ad in myAds" :key="ad.id" class="bg-neutral-800 border border-neutral-700 p-5 rounded-xl flex justify-between items-center">
          <div class="flex gap-4 items-center">
            <div class="w-16 h-16 bg-neutral-900 rounded-lg overflow-hidden border border-neutral-700 hidden sm:block">
              <img v-if="ad.images && ad.images.length > 0" :src="getImageUrl(ad.images[0]?.image)" alt="" class="w-full h-full object-cover"/>
              <div v-else class="w-full h-full flex items-center justify-center text-xs text-neutral-500">Нет фото</div>
            </div>
            <div>
              <h3 class="text-xl font-bold mb-1">{{ ad.title }}</h3>
              <p class="text-blue-400 font-bold mb-1">{{ ad.price }} {{ ad.currency }}</p>
              <p class="text-sm text-gray-400">📍 {{ ad.city }}</p>
            </div>
          </div>
          
          <div class="flex flex-col sm:flex-row gap-2">
            <button @click="openEditModal(ad)" class="bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors">Редактировать</button>
            <button @click="openDeleteModal(ad.id)" class="bg-red-900/50 hover:bg-red-900 text-red-300 px-4 py-2 rounded-lg text-sm font-bold transition-colors">Удалить</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showDeleteModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div class="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 w-full max-w-sm shadow-2xl">
        <h3 class="text-xl font-bold text-white mb-2">Снести объявление?</h3>
        <p class="text-gray-400 mb-6">Это действие нельзя отменить. Точно удаляем?</p>
        <div class="flex justify-end gap-3">
          <button @click="closeDeleteModal" class="px-5 py-2 rounded-xl text-gray-300 hover:bg-neutral-700 transition-colors font-medium">Отмена</button>
          <button @click="executeDelete" :disabled="isDeleting" class="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl font-bold transition-colors">
            {{ isDeleting ? 'Удаляем...' : 'Удалить' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showEditModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div class="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <h3 class="text-2xl font-bold text-white mb-6">Редактировать объявление</h3>
        <form @submit.prevent="submitEdit" class="flex flex-col gap-4">
          <div><label class="block text-gray-400 text-sm mb-1">Название</label><input v-model="editForm.title" type="text" class="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 outline-none focus:border-blue-500" required></div>
          <div class="flex gap-4">
            <div class="w-1/3"><label class="block text-gray-400 text-sm mb-1">Цена</label><div class="flex"><input v-model="editForm.price" type="number" class="w-full bg-neutral-900 border border-neutral-700 text-white rounded-l-xl p-3 outline-none focus:border-blue-500" required><select v-model="editForm.currency" class="bg-neutral-800 border border-neutral-700 border-l-0 text-white rounded-r-xl px-2 outline-none"><option value="AZN">₼</option><option value="RUB">₽</option><option value="USD">$</option></select></div></div>
            <div class="w-1/3"><label class="block text-gray-400 text-sm mb-1">Город</label><input v-model="editForm.city" type="text" class="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 outline-none focus:border-blue-500" required></div>
            <div class="w-1/3"><label class="block text-gray-400 text-sm mb-1">Телефон</label><input v-model="editForm.phone_number" type="tel" class="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 outline-none focus:border-blue-500" required></div>
          </div>
          <div v-if="editForm.images && editForm.images.length > 0"><label class="block text-gray-400 text-sm mb-2">Текущие фото</label><div class="flex gap-3 overflow-x-auto pb-2"><div v-for="img in editForm.images" :key="img.id" class="relative w-24 h-24 flex-shrink-0 bg-neutral-900 rounded-xl border border-neutral-700"><img :src="getImageUrl(img.image)" class="w-full h-full object-cover rounded-xl" /><button type="button" @click="removeExistingImage(img.id)" class="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs shadow-lg">✕</button></div></div></div>
          <div><label class="block text-gray-400 text-sm mb-1">Добавить новые фото</label><input type="file" multiple accept="image/*" @change="handleEditFileChange" class="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-2 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-neutral-700 file:text-white hover:file:bg-neutral-600 outline-none cursor-pointer"></div>
          <div><label class="block text-gray-400 text-sm mb-1">Описание</label><textarea v-model="editForm.description" rows="3" class="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 outline-none focus:border-blue-500"></textarea></div>
          <div class="flex justify-end gap-3 mt-4">
            <button type="button" @click="closeEditModal" class="px-5 py-3 rounded-xl text-gray-300 hover:bg-neutral-700 transition-colors font-medium">Отмена</button>
            <button type="submit" :disabled="isSaving" class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-colors">{{ isSaving ? 'Сохраняем...' : 'Сохранить' }}</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showProfileModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div class="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
        <h3 class="text-2xl font-bold text-white mb-6">Настройки профиля</h3>
        
        <form @submit.prevent="submitProfileEdit" class="flex flex-col gap-4">
          
          <div class="flex items-center gap-4 mb-2">
            <div class="w-20 h-20 rounded-full overflow-hidden bg-neutral-900 border border-neutral-600 flex-shrink-0">
              <img v-if="avatarPreview" :src="avatarPreview" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500 bg-neutral-900">
                {{ profileForm.first_name ? profileForm.first_name.charAt(0).toUpperCase() : '?' }}
              </div>
            </div>
            <div>
              <label class="block text-gray-400 text-sm mb-1">Фотография</label>
              <input type="file" accept="image/*" @change="handleAvatarChange" class="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-neutral-700 file:text-white hover:file:bg-neutral-600 transition-colors cursor-pointer" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-gray-400 text-sm mb-1">Имя</label>
              <input v-model="profileForm.first_name" type="text" class="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 outline-none focus:border-blue-500">
            </div>
            <div>
              <label class="block text-gray-400 text-sm mb-1">Фамилия</label>
              <input v-model="profileForm.last_name" type="text" class="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 outline-none focus:border-blue-500">
            </div>
          </div>

          <div>
            <label class="block text-gray-400 text-sm mb-1">Отчество</label>
            <input v-model="profileForm.patronymic" type="text" class="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 outline-none focus:border-blue-500">
          </div>

          <div>
            <label class="block text-gray-400 text-sm mb-1">Номер телефона</label>
            <input v-model="profileForm.phone_number" type="tel" class="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 outline-none focus:border-blue-500">
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button type="button" @click="showProfileModal = false" class="px-5 py-3 rounded-xl text-gray-300 hover:bg-neutral-700 transition-colors font-medium">
              Отмена
            </button>
            <button type="submit" :disabled="isSavingProfile" class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-colors">
              {{ isSavingProfile ? 'Сохраняем...' : 'Сохранить' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<style scoped>
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
input[type=number] {
  appearance: textfield;
  -moz-appearance: textfield;
}
</style>
