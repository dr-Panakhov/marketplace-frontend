<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../api'
import { getImageUrl } from '../utils/image'
import type { Ad } from '../types/api'

interface Review {
  id: number;
  author_name: string;
  seller: number;
  text: string;
  rating: number;
  created_at: string;
}

const route = useRoute()
const ads = ref<Ad[]>([])
const reviews = ref<Review[]>([])
const isLoading = ref(true)
const sellerName = ref('Мастер')

const currentUserId = ref<number | null>(null)

const isReviewModalOpen = ref(false)
const isSubmitting = ref(false)
const formError = ref('')
const reviewForm = ref({
  text: '',
  rating: 5
})

const averageRating = computed(() => {
  if (reviews.value.length === 0) return 0
  const sum = reviews.value.reduce((acc, review) => acc + review.rating, 0)
  return (sum / reviews.value.length).toFixed(1)
})

const fetchMe = async () => {
  try {
    const response = await api.get('auth/users/me/')
    currentUserId.value = response.data.id
  } catch (error) {
    // null
  }
}

const fetchSellerAds = async () => {
  try {
    const response = await api.get<Ad[]>(`ads/user/${route.params.id}/`)
    ads.value = response.data
    if (ads.value.length > 0) {
      sellerName.value = ads.value[0]?.author_name || 'Мастер'
    }
  } catch (error) {
    console.error('Ошибка загрузки профиля:', error)
  } finally {
    isLoading.value = false
  }
}

const fetchReviews = async () => {
  try {
    const response = await api.get<Review[]>('reviews/')
    reviews.value = response.data.filter(r => r.seller == Number(route.params.id))
  } catch (error) {
    console.error('Ошибка загрузки отзывов:', error)
  }
}

const submitReview = async () => {
  if (!reviewForm.value.text.trim()) return
  
  isSubmitting.value = true
  formError.value = ''
  
  try {
    await api.post('reviews/', {
      seller: Number(route.params.id),
      text: reviewForm.value.text,
      rating: reviewForm.value.rating
    })
    
    isReviewModalOpen.value = false
    reviewForm.value = { text: '', rating: 5 }
    await fetchReviews()
    
  } catch (error: any) {
    console.error('Ошибка при отправке отзыва:', error)
    if (error.response?.status === 401) {
      formError.value = 'Нужно авторизоваться, чтобы оставить отзыв!'
    } else if (error.response?.status === 400) {
      formError.value = 'Вы уже оставляли отзыв этому специалисту. Больше одного нельзя!'
    } else {
      formError.value = 'Что-то пошло не так. Попробуйте позже.'
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchMe()
  fetchSellerAds()
  fetchReviews()
})
</script>

<template>
  <div class="max-w-6xl mx-auto mt-10 px-4 mb-16 relative">
    
    <div class="bg-neutral-800 p-8 rounded-2xl shadow-xl mb-8 border border-neutral-700 flex items-center gap-6">
      <div class="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
        {{ sellerName.charAt(0).toUpperCase() }}
      </div>
      <div>
        <h1 class="text-3xl font-bold text-white mb-2">{{ sellerName }}</h1>
        
        <div class="flex items-center gap-3 mb-2">
          <div v-if="reviews.length > 0" class="flex items-center gap-1 bg-neutral-900 px-3 py-1 rounded-lg border border-neutral-700">
            <span class="text-yellow-400 text-lg">★</span>
            <span class="text-white font-bold text-lg">{{ averageRating }}</span>
          </div>
          <div v-else class="bg-neutral-900 px-3 py-1 rounded-lg border border-neutral-700">
            <span class="text-gray-500 font-medium">Нет оценок</span>
          </div>
          <span class="text-gray-400 text-sm">({{ reviews.length }} отзывов)</span>
        </div>

        <p class="text-gray-400">Проверенный специалист на VektorGo 🛠️</p>
      </div>
    </div>

    <h2 class="text-2xl font-bold text-white mb-6">Все услуги мастера</h2>

    <div v-if="isLoading" class="text-center text-gray-400 text-xl py-10">Загружаем услуги...</div>
    
    <div v-else-if="ads.length === 0" class="text-center text-gray-500 py-10 bg-neutral-800 rounded-2xl border border-neutral-700">
      У этого мастера пока нет активных услуг.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="ad in ads" :key="ad.id" class="bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700 shadow-lg hover:shadow-green-500/10 transition-all">
        <router-link :to="`/ad/${ad.id}`" class="block">
          <div class="aspect-video bg-neutral-900 relative">
            <img v-if="ad.images && ad.images.length > 0" :src="getImageUrl(ad.images[0]?.image)" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-500">Нет фото</div>
          </div>
          <div class="p-5">
            <h3 class="text-lg font-bold text-white mb-2 truncate">{{ ad.title }}</h3>
            <p class="text-xl text-green-400 font-bold mb-3">{{ ad.price }} ₼</p>
            <p class="text-sm text-gray-400 flex items-center gap-1">📍 {{ ad.city }}</p>
          </div>
        </router-link>
      </div>
    </div>

    <div class="mt-12 bg-neutral-800 p-8 rounded-2xl shadow-xl border border-neutral-700">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-white">Отзывы ({{ reviews.length }})</h2>
        <button 
          v-if="currentUserId !== Number(route.params.id)"
          @click="isReviewModalOpen = true; formError = ''" 
          class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold transition-colors"
        >
          Оставить отзыв
        </button>
      </div>

      <div v-if="reviews.length === 0" class="text-center text-gray-400 py-6">
        Пока нет отзывов. Будьте первым!
      </div>

      <div v-else class="space-y-4">
        <div v-for="review in reviews" :key="review.id" class="bg-neutral-900 p-5 rounded-xl border border-neutral-700">
          <div class="flex items-center justify-between mb-2">
            <span class="text-white font-bold text-lg">{{ review.author_name }}</span>
            <span class="text-yellow-400 text-xl">
              {{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}
            </span>
          </div>
          <p class="text-gray-300 mt-2 whitespace-pre-wrap">{{ review.text }}</p>
          <div class="text-sm text-gray-500 mt-3">
            {{ new Date(review.created_at).toLocaleDateString('ru-RU') }}
          </div>
        </div>
      </div>
    </div>

    <!-- МОДАЛКА -->
    <div v-if="isReviewModalOpen" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div class="bg-neutral-800 p-6 rounded-2xl w-full max-w-lg border border-neutral-700 shadow-2xl">
        <h3 class="text-2xl font-bold text-white mb-4">Оставить отзыв</h3>
        
        <div v-if="formError" class="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400 text-sm font-medium">
          ⚠️ {{ formError }}
        </div>

        <div class="mb-4">
          <label class="block text-gray-400 mb-2">Ваша оценка</label>
          <div class="flex gap-2">
            <button 
              v-for="star in 5" :key="star" 
              @click="reviewForm.rating = star"
              class="text-4xl focus:outline-none transition-colors hover:scale-110"
              :class="star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-600'"
            >
              ★
            </button>
          </div>
        </div>

        <div class="mb-6">
          <label class="block text-gray-400 mb-2">Комментарий</label>
          <textarea 
            v-model="reviewForm.text" 
            rows="4"
            class="w-full bg-neutral-900 text-white rounded-xl p-4 border border-neutral-700 focus:border-blue-500 focus:outline-none resize-none"
            placeholder="Напишите, как прошла сделка..."
          ></textarea>
        </div>

        <div class="flex justify-end gap-3">
          <button @click="isReviewModalOpen = false" class="px-5 py-2 rounded-xl text-gray-400 hover:text-white transition-colors font-bold">
            Отмена
          </button>
          <button 
            @click="submitReview" 
            :disabled="isSubmitting || !reviewForm.text.trim()"
            class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? 'Отправка...' : 'Отправить' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
