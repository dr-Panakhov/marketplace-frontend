<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast' // <-- Подрубили тост
import type { AuthResponse } from '../types/api'

const email = ref('')
const password = ref('')
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore() // <-- Инициализировали
const isSubmitting = ref(false)

const handleLogin = async () => {
  isSubmitting.value = true
  try {
    const response = await api.post<AuthResponse>('auth/jwt/create/', {
      email: email.value, 
      password: password.value
    })
    
    auth.setTokens(response.data)
    toast.show('Успешный вход!', 'success') // <-- Кайфовое уведомление
    await router.push((router.currentRoute.value.query.redirect as string) || '/')
  } catch (error) {
    console.error('Ошибка входа:', error)
    toast.show('Неверный email или пароль. Попробуй еще раз!', 'error') // <-- Ошибка через Тост
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto mt-16 bg-neutral-800 p-8 rounded-2xl border border-neutral-700 shadow-xl">
    <h1 class="text-3xl font-bold text-white mb-6 text-center">Вход в систему</h1>
    
    <!-- Старый блок с errorMessage выпилили -->
    
    <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
      <div>
        <label class="block text-gray-400 text-sm mb-2">Email</label>
        <input v-model="email" type="email" class="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 focus:outline-none focus:border-green-500 transition-colors" placeholder="tvoi@email.com" required>
      </div>
      
      <div>
        <label class="block text-gray-400 text-sm mb-2">Пароль</label>
        <input v-model="password" type="password" class="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 focus:outline-none focus:border-green-500 transition-colors" placeholder="••••••••" required>
      </div>
      
      <button type="submit" :disabled="isSubmitting" class="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl mt-4 transition-colors">
        {{ isSubmitting ? 'Входим...' : 'Войти' }}
      </button>
    </form>

    <div class="mt-6 text-center text-gray-400 text-sm">
      Нет аккаунта? 
      <router-link to="/register" class="text-blue-500 hover:text-blue-400 font-bold">Зарегаться</router-link>
    </div>
  </div>
</template>
