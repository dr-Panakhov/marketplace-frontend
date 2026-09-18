import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const message = ref('')
  const type = ref<'success' | 'error' | 'info'>('info')
  const isVisible = ref(false)
  let timeout: any = null

  const show = (msg: string, t: 'success' | 'error' | 'info' = 'info') => {
    message.value = msg
    type.value = t
    isVisible.value = true
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      isVisible.value = false
    }, 3000)
  }

  return { message, type, isVisible, show }
})
