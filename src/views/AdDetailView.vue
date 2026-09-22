<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api'
import { getImageUrl } from '../utils/image'
import type { Ad, User } from '../types/api'
import { useToastStore } from '../stores/toast'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const auth = useAuthStore()

const ad = ref<Ad | null>(null)
const currentUser = ref<User | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const isPhoneVisible = ref(false)

const showDeleteModal = ref(false)
const isDeleting = ref(false)

const closeDeleteModal = () => {
  showDeleteModal.value = false
}

const getCurrencySymbol = (code: string) => {
  const symbols: Record<string, string> = {
    AZN: '₼',
    RUB: '₽',
    USD: '$'
  }
  return symbols[code] || code
}

const checkAuth = () => {
  const token = localStorage.getItem('access')
  if (!token) {
    toast.show('Для просмотра контактов нужно войти или зарегистрироваться', 'info')
    router.push('/register') 
    return false
  }
  return true
}

const fetchAd = async () => {
  try {
    const response = await api.get<Ad>(`ads/${route.params.id}/`)
    ad.value = response.data
  } catch (error) {
    console.error('Не удалось стянуть объяву:', error)
    errorMessage.value = 'Объявление не найдено или недоступно.'
    toast.show('Ошибка загрузки объявления', 'error')
  } finally {
    isLoading.value = false
  }
}

const fetchCurrentUser = async () => {
  if (auth.isLoggedIn) {
    try {
      const response = await api.get<User>('auth/users/me/')
      currentUser.value = response.data
    } catch (error) {
      console.error('Не удалось загрузить профиль', error)
    }
  }
}

const executeDelete = async () => {
  isDeleting.value = true
  try {
    await api.delete(`ads/${route.params.id}/`)
    toast.show('Объявление удалено', 'success')
    router.push('/')
  } catch (error) {
    toast.show('Не удалось удалить', 'error')
  } finally {
    isDeleting.value = false
    closeDeleteModal()
  }
}

const showContacts = () => {
  if (checkAuth()) {
    isPhoneVisible.value = true
  }
}

onMounted(() => {
  fetchAd()
  fetchCurrentUser()
})
</script>

<template>
  <div>
    
    <div v-if="ad" class="max-w-3xl mx-auto mt-10 p-8 bg-neutral-800 rounded-2xl text-white shadow-xl mb-16">
      <div v-if="currentUser && ad.author_id === currentUser.id" class="mb-8 bg-blue-900/20 border border-blue-500/30 p-5 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
        <div>
          <h3 class="text-blue-400 font-bold text-lg mb-1">👑 Это твоё творение</h3>
          <p class="text-sm text-gray-400">Визуально отличается от чужих. Можешь управлять им.</p>
        </div>
        <div class="flex gap-3 mt-2 sm:mt-0">
          <router-link to="/profile" class="bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded-lg font-bold transition-colors text-white text-sm flex items-center">
            Редактировать
          </router-link>
          <button @click="showDeleteModal = true" class="bg-red-900/50 hover:bg-red-900 text-red-300 px-4 py-2 rounded-lg font-bold transition-colors text-sm">
            Удалить
          </button>
        </div>
      </div>

      <div v-if="ad.images && ad.images.length > 0" class="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div 
          v-for="img in ad.images" 
          :key="img.id" 
          class="rounded-xl overflow-hidden bg-neutral-900 border border-neutral-700 aspect-video flex items-center justify-center shadow-md"
        >
          <img :src="getImageUrl(img.image)" alt="Фото объявления" class="w-full h-full object-cover" />
        </div>
      </div>
      <div v-else class="mb-8 h-64 bg-neutral-900 rounded-xl border border-neutral-700 flex items-center justify-center">
        <span class="text-neutral-500 text-lg font-medium">Нет фото</span>
      </div>

      <h1 class="text-3xl font-bold mb-4">{{ ad.title }}</h1>
      <p class="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 font-bold mb-8">
        {{ ad.price }} {{ getCurrencySymbol(ad.currency) }}
      </p>
      
      <div class="mb-8 text-gray-300 text-lg whitespace-pre-wrap">
        {{ ad.description }}
      </div>

      <div class="bg-neutral-900 p-6 rounded-xl border border-neutral-700 shadow-md">
        <h3 class="text-lg font-bold mb-4">Контакты продавца</h3>
        
        <div v-if="auth.isLoggedIn">
          <router-link :to="`/seller/${ad.author_id}`" class="block text-xl text-white hover:text-blue-400 transition-colors font-black mb-1">
            👤 {{ ad.author_name || 'Продавец' }}
          </router-link>
          <p class="text-gray-400 mb-4">📍 Город: {{ ad.city }}</p>
          
        <div class="flex flex-col sm:flex-row items-center gap-4 mt-4">
          <button 
            v-if="!isPhoneVisible" 
            @click="showContacts"
            class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition-colors w-full sm:w-auto"
          >
            Показать контакты
          </button>
          <div v-else class="text-3xl font-black text-green-400 tracking-wider">
          {{ ad.phone_number }}
          </div>

          <!-- Наша новая кнопка чата -->
          <button 
            @click="$router.push('/chat')" 
            class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-colors w-full sm:w-auto"
          >
            Написать
          </button>
        </div>
        </div>
        
        <div v-else class="text-center p-4 bg-neutral-800 rounded-xl border border-neutral-700">
          <p class="text-gray-400 mb-2">Контакты видны только зарегистрированным пользователям 🕵️‍♂️</p>
          <div class="text-sm">
            <router-link to="/register" class="text-blue-500 font-bold hover:text-blue-400">Зарегайся</router-link> 
            или 
            <router-link to="/login" class="text-blue-500 font-bold hover:text-blue-400">войди</router-link>, чтобы посмотреть.
          </div>
        </div>
      </div>
    </div>
    
    <div v-else-if="isLoading" class="text-center text-gray-400 mt-20 text-xl font-medium">
      Загружаем...
    </div>
    <div v-else class="text-center text-red-400 mt-20 text-xl font-medium">
      {{ errorMessage }}
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

  </div>
</template>
