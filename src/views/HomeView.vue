<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../api'
import { getImageUrl } from '../utils/image'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast' // <-- Подключили Тосты
import type { Ad } from '../types/api'

const ads = ref<Ad[]>([])
const auth = useAuthStore()
const toast = useToastStore() // <-- Инициализировали
const isLoading = ref(true)
const errorMessage = ref('')

// Функция для красивых значков валюты
const getCurrencySymbol = (code: string) => {
  const symbols: Record<string, string> = {
    AZN: '₼',
    RUB: '₽',
    USD: '$'
  }
  return symbols[code] || code
}

// Умная функция для путей до фоток (локалка vs прод)
onMounted(async () => {
  try {
    const response = await api.get<Ad[]>('ads/')
    ads.value = response.data
  } catch (error) {
    console.error('Бэкенд ругается:', error)
    errorMessage.value = 'Не удалось загрузить объявления.'
    toast.show('Ошибка загрузки объявлений', 'error') // <-- Красивая всплывашка
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div>
    <!-- Баннер для гостей -->
    <div v-if="!auth.isLoggedIn" class="mb-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-3xl p-8 md:p-10 text-center md:text-left flex flex-col md:flex-row items-center justify-between shadow-2xl border border-white/10">
      <div class="mb-6 md:mb-0 md:mr-8">
        <h2 class="text-3xl md:text-4xl font-black text-white mb-3">Ищешь услуги или хочешь продать свое?</h2>
        <p class="text-white/90 text-lg">VektorGo — площадка, где всё решается быстро.</p>
      </div>
      <router-link to="/register" class="whitespace-nowrap bg-white text-gray-900 hover:bg-gray-100 font-bold py-4 px-8 rounded-xl transition-colors shadow-lg text-lg">
        Ворваться сейчас
      </router-link>
    </div>

    <h1 class="text-3xl text-white font-bold mb-8">Свежие объявления</h1>
    
    <div v-if="isLoading" class="text-gray-400 text-lg">
      Загружаем объявления...
    </div>
    <div v-else-if="errorMessage" class="text-red-400 text-lg">
      {{ errorMessage }}
    </div>
    <div v-else-if="ads.length === 0" class="text-gray-400 text-lg">
      Пытаемся достучаться до небес...
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <router-link :to="`/ad/${ad.id}`" v-for="ad in ads" :key="ad.id" class="bg-neutral-800 rounded-2xl border border-neutral-700 overflow-hidden flex flex-col hover:border-green-500 transition-colors cursor-pointer shadow-lg block">
        
        <!-- Вывод фотки с нашей умной функцией или заглушки -->
        <div v-if="ad.images && ad.images.length > 0" class="h-48 w-full bg-neutral-900">
          <img :src="getImageUrl(ad.images[0]?.image)" alt="Фото объявления" class="w-full h-full object-cover" />
        </div>
        <div v-else class="h-48 bg-neutral-700 w-full flex items-center justify-center">
          <span class="text-neutral-500">Нет фото</span>
        </div>

        <div class="p-5 flex-1 flex flex-col">
          <h2 class="text-xl font-bold text-white mb-2">{{ ad.title }}</h2>
          
          <!-- Вывод правильной валюты -->
          <p class="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 font-bold mb-4">
            {{ ad.price }} {{ getCurrencySymbol(ad.currency) }}
          </p>
          
          <div class="mt-auto flex flex-col gap-1">
            <span class="text-sm text-gray-400">📍 {{ ad.city }}</span>
            <span v-if="auth.isLoggedIn" class="text-base text-gray-200 font-bold truncate">
              👤 {{ ad.author_name || 'Аноним' }}
            </span>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>
