import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '../api'
import type { AuthResponse, User } from '../types/api'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(localStorage.getItem('access'))
  const refreshToken = ref(localStorage.getItem('refresh'))
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => Boolean(accessToken.value))

  function setTokens(tokens: AuthResponse) {
    accessToken.value = tokens.access
    refreshToken.value = tokens.refresh
    localStorage.setItem('access', tokens.access)
    localStorage.setItem('refresh', tokens.refresh)
  }

  function clearSession() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
  }

  async function fetchUser() {
    user.value = (await api.get<User>('auth/users/me/')).data
    return user.value
  }

  return {
    accessToken,
    refreshToken,
    user,
    isLoggedIn,
    setTokens,
    clearSession,
    fetchUser,
  }
})
