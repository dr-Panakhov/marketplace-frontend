import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { AuthResponse } from './types/api'

const baseURL = import.meta.env.VITE_API_URL ?? 'https://vektorgo.co/api/'

interface RetriableRequest extends InternalAxiosRequestConfig {
  _isRetry?: boolean
}

export const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequest | undefined

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._isRetry ||
      originalRequest.url?.includes('auth/jwt/refresh/')
    ) {
      return Promise.reject(error)
    }

    const refresh = localStorage.getItem('refresh')
    if (!refresh) {
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      return Promise.reject(error)
    }

    originalRequest._isRetry = true

    try {
      const response = await axios.post<AuthResponse>(
        'auth/jwt/refresh/',
        { refresh },
        { baseURL },
      )
      localStorage.setItem('access', response.data.access)
      originalRequest.headers.Authorization = `Bearer ${response.data.access}`
      return api(originalRequest)
    } catch (refreshError) {
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      return Promise.reject(refreshError)
    }
  },
)
