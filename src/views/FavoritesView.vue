<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../api'
import { getImageUrl } from '../utils/image'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import type { Ad } from '../types/api'

const ads = ref<Ad[]>([])
const auth = useAuthStore()
const toast = useToastStore()
const isLoading = ref(true)

const getCurrencySymbol = (code: string) => {
  const symbols: Record<string, string> = { AZN: '₼', RUB: '₽', USD: '$' }
  return symbols[code] || code
}

const fetchFavorites = async () => {
  try {
    const response = await api.get<Ad[]>('ads/my_favorites/')
    ads.value = response.data
  } catch (error) {
    toast.show('Не удалось загрузить избранное', 'error')
  } finally {
    isLoading.value = false
  }
}

// Если юзер отжимает лайк прям в избранном, сразу убираем карточку с экрана
const toggleFavorite = async (ad: Ad) => {
  ads.value = ads.value.filter(a => a.id !== ad.id)
  try {
    await api.post(`ads/${ad.id}/favorite/`)
  } catch (error) {
    toast.show('Ошибка соединения', 'error')
    fetchFavorites() // Если ошибка — откатываем обратно
  }
}

onMounted(fetchFavorites)
</script>

<template>
  <div>
    <h1 class="text-3xl text-white font-bold mb-8">Мое избранное ♥️</h1>
    
    <div v-if="isLoading" class="text-gray-400 text-lg">Грузим...</div>
    <div v-else-if="ads.length === 0" class="text-gray-400 text-lg">Тут пока пусто. Иди на главную и жми сердечки!</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <router-link :to="`/ad/${ad.id}`" v-for="ad in ads" :key="ad.id" class="bg-neutral-800 rounded-2xl border border-neutral-700 overflow-hidden flex flex-col hover:border-green-500 transition-colors shadow-lg relative block">
        
        <div class="relative h-48 w-full bg-neutral-900">
          <img v-if="ad.images && ad.images.length > 0" :src="getImageUrl(ad.images[0]?.image)" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-neutral-500">Нет фото</div>
          
          <button @click.prevent="toggleFavorite(ad)" class="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-6 h-6">
              <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>

        <div class="p-5 flex-1 flex flex-col">
          <h2 class="text-xl font-bold text-white mb-2">{{ ad.title }}</h2>
          <p class="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 font-bold mb-4">
            {{ ad.price }} {{ getCurrencySymbol(ad.currency) }}
          </p>
        </div>
      </router-link>
    </div>
  </div>
</template>
