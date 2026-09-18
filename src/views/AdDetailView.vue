<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api'
import { getImageUrl } from '../utils/image'
import type { Ad } from '../types/api'
import { useToastStore } from '../stores/toast'
import { useAuthStore } from '../stores/auth' // <-- Подключили стор авторизации

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const auth = useAuthStore() // <-- Инициализировали

const ad = ref<Ad | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const isPhoneVisible = ref(false)

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

const showContacts = () => {
  if (checkAuth()) {
    isPhoneVisible.value = true
  }
}

onMounted(() => {
  fetchAd()
})
</script>

<template>
  <div v-if="ad" class="max-w-3xl mx-auto mt-10 p-8 bg-neutral-800 rounded-2xl text-white shadow-xl mb-16">
    
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

    <!-- Блок контактов продавца с проверкой авторизации -->
    <div class="bg-neutral-900 p-6 rounded-xl border border-neutral-700 shadow-md">
      <h3 class="text-lg font-bold mb-4">Контакты продавца</h3>
      
      <!-- Если юзер АВТОРИЗОВАН -->
      <div v-if="auth.isLoggedIn">
        <p class="text-xl text-white font-black mb-1">👤 {{ ad.author_name || 'Продавец' }}</p>
        <p class="text-gray-400 mb-4">📍 Город: {{ ad.city }}</p>
        
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
      </div>
      
      <!-- Если юзер ГОСТЬ -->
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
</template>
