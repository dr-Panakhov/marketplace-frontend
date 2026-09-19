<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../api'
import { getImageUrl } from '../utils/image'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast' // <-- Подключили Тосты
import type { Ad } from '../types/api'

const ads = ref<Ad[]>([])
const auth = useAuthStore()
const toast = useToastStore()
const isLoading = ref(true)
const errorMessage = ref('')

const getCurrencySymbol = (code: string) => {
  const symbols: Record<string, string> = {
    AZN: '₼',
    RUB: '₽',
    USD: '$'
  }
  return symbols[code] || code
}

const toggleFavorite = async (ad: Ad) => {
  if (!auth.isLoggedIn) {
    toast.show('Сначала нужно войти в аккаунт!', 'error')
    return
  }
  
  ad.is_favorite = !ad.is_favorite 
  
  try {
    await api.post(`ads/${ad.id}/favorite/`)
  } catch (error) {
    ad.is_favorite = !ad.is_favorite
    toast.show('Не удалось обновить избранное', 'error')
  }
}

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
        <!-- Блок с фото и сердечком -->
        <div class="relative h-48 w-full bg-neutral-900">
          <img v-if="ad.images && ad.images.length > 0" :src="getImageUrl(ad.images[0]?.image)" alt="Фото" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-neutral-500">Нет фото</div>
          
          <!-- Кнопка лайка -->
          <button 
            @click.prevent="toggleFavorite(ad)" 
            class="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full backdrop-blur-sm transition-all"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              :fill="ad.is_favorite ? 'currentColor' : 'none'"
              viewBox="0 0 24 24" 
              stroke-width="1.5" 
              stroke="currentColor" 
              class="w-6 h-6 transition-colors"
              :class="ad.is_favorite ? 'text-red-500' : 'text-white'"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
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
