<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import type { AuthResponse } from '../types/api'

// Новые поля
const firstName = ref('')
const lastName = ref('')
const patronymic = ref('') // Отчество (необязательное)
const email = ref('')
const phoneCode = ref('+994') // Дефолтный код Азербайджана
const phoneNumber = ref('')
const password = ref('')

const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()
const isSubmitting = ref(false)

const handleRegister = async () => {
  // 1. Проверка пароля (мин 8 символов, 1 заглавная, 1 цифра)
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/
  if (!passwordRegex.test(password.value)) {
    toast.show('Пароль не соответствует требованиям. Смотри подсказку!', 'error')
    return
  }

  // 2. Нормализация почты (нижний регистр + убираем случайные пробелы)
  const cleanEmail = email.value.toLowerCase().trim()
  
  // 3. Склеиваем номер
  const fullPhone = `${phoneCode.value}${phoneNumber.value.trim()}`

  isSubmitting.value = true
  try {
    // Отправляем новые поля на бэкенд
    await api.post('auth/users/', {
      first_name: firstName.value,
      last_name: lastName.value,
      patronymic: patronymic.value, // Если бэк это поддерживает
      email: cleanEmail,
      phone_number: fullPhone,
      password: password.value
    })
    
    // Логинимся по email
    const loginResponse = await api.post<AuthResponse>('auth/jwt/create/', {
      email: cleanEmail,
      password: password.value
    })
    
    auth.setTokens(loginResponse.data)
    toast.show('Аккаунт успешно создан! Добро пожаловать 😎', 'success')
    router.push('/')
  } catch (error: unknown) {
    console.error('Ошибка регистрации:', error)
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { data?: Record<string, string | string[]> } }).response
      const data = response?.data
      if (!data) {
        toast.show('Сервер не отвечает или произошла неизвестная ошибка', 'error')
        return
      }
      const messages = Object.keys(data).map(key => {
        const msg = Array.isArray(data[key]) ? data[key].join(' ') : data[key]
        return `${key}: ${msg}`
      })
      toast.show(messages.join(' | '), 'error')
    } else {
      toast.show('Сервер не отвечает или произошла неизвестная ошибка', 'error')
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto mt-16 bg-neutral-800 p-8 rounded-2xl border border-neutral-700 shadow-xl mb-20">
    <h1 class="text-3xl font-bold text-white mb-6 text-center">Регистрация</h1>
    
    <form @submit.prevent="handleRegister" class="flex flex-col gap-5">
      
      <!-- ФИО -->
      <div class="flex gap-4">
        <div class="w-1/2">
          <label class="block text-gray-400 text-sm mb-2">Имя <span class="text-red-500">*</span></label>
          <input v-model="firstName" type="text" class="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-colors" placeholder="Иван" required>
        </div>
        <div class="w-1/2">
          <label class="block text-gray-400 text-sm mb-2">Фамилия <span class="text-red-500">*</span></label>
          <input v-model="lastName" type="text" class="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-colors" placeholder="Иванов" required>
        </div>
      </div>

      <div>
        <label class="block text-gray-400 text-sm mb-2">Отчество <span class="text-neutral-500">(если есть)</span></label>
        <input v-model="patronymic" type="text" class="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-colors" placeholder="Иванович">
      </div>

      <!-- Почта -->
      <div>
        <label class="block text-gray-400 text-sm mb-2">Email <span class="text-red-500">*</span></label>
        <input v-model="email" type="email" class="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-colors" placeholder="tvoi@email.com" required>
        <p class="text-xs text-gray-500 mt-2">Укажи реальную почту. Она понадобится для восстановления доступа, если забудешь пароль.</p>
      </div>

      <!-- Телефон -->
      <div>
        <label class="block text-gray-400 text-sm mb-2">Номер телефона <span class="text-red-500">*</span></label>
        <div class="flex">
          <select v-model="phoneCode" class="bg-neutral-900 border border-neutral-700 border-r-0 text-white rounded-l-xl px-2 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer outline-none">
            <option value="+994">🇦🇿 +994</option>
            <option value="+7">🇷🇺 +7</option>
            <option value="+375">🇧🇾 +375</option>
          </select>
          <input v-model="phoneNumber" type="tel" class="w-full bg-neutral-900 border border-neutral-700 text-white rounded-r-xl p-3 focus:outline-none focus:border-blue-500 transition-colors outline-none" placeholder="50 123 45 67" required>
        </div>
      </div>
      
      <!-- Пароль -->
      <div>
        <label class="block text-gray-400 text-sm mb-2">Пароль <span class="text-red-500">*</span></label>
        <!-- autocomplete="new-password" заставляет гугл предлагать генерацию -->
        <input v-model="password" type="password" autocomplete="new-password" class="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-colors" placeholder="••••••••" required>
        <p class="text-xs text-gray-500 mt-2">Минимум 8 символов, обязательно одна заглавная буква и одна цифра.</p>
      </div>
      
      <button type="submit" :disabled="isSubmitting" class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl mt-2 transition-colors">
        {{ isSubmitting ? 'Создаем...' : 'Создать аккаунт' }}
      </button>
    </form>

    <div class="mt-6 text-center text-gray-400 text-sm">
      Уже с нами? 
      <router-link to="/login" class="text-green-500 hover:text-green-400 font-bold">Войти</router-link>
    </div>
  </div>
</template>
