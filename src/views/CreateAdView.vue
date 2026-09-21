<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { useToastStore } from '../stores/toast'

const title = ref('')
const price = ref('')
const currency = ref('AZN')
const city = ref('')
const phoneNumber = ref('')
const description = ref('')
const router = useRouter()
const toast = useToastStore()

const selectedFiles = ref<File[]>([])
const previewUrls = ref<string[]>([])
const isSubmitting = ref(false)

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    const files = Array.from(target.files).filter((file) => file.type.startsWith('image/'))
    if (selectedFiles.value.length + files.length > 10) {
      toast.show('Можно загрузить не более 10 фотографий.', 'error')
      target.value = ''
      return
    }
    previewUrls.value.forEach((url) => URL.revokeObjectURL(url))
    selectedFiles.value = [...selectedFiles.value, ...files]
    previewUrls.value = selectedFiles.value.map((file) => URL.createObjectURL(file))
  }
  target.value = ''
}

const removeFile = (index: number) => {
  URL.revokeObjectURL(previewUrls.value[index] ?? '')
  selectedFiles.value.splice(index, 1)
  previewUrls.value.splice(index, 1)
}

const handleCreate = async () => {
  if (Number(price.value) <= 0) {
    toast.show('Цена должна быть больше нуля.', 'error')
    return
  }
  isSubmitting.value = true
  try {
    const formData = new FormData()
    formData.append('title', title.value)
    formData.append('price', price.value)
    formData.append('currency', currency.value)
    formData.append('city', city.value)
    formData.append('phone_number', phoneNumber.value)
    formData.append('description', description.value)
    
    selectedFiles.value.forEach(file => {
      formData.append('uploaded_images', file)
    })

    const response = await api.post<{ id: number }>('ads/', formData)
    
    toast.show('Объявление успешно опубликовано!', 'success')
    router.push(`/ad/${response.data.id}`)
  } catch (error: unknown) {
    console.error('Косяк при создании:', error)
    toast.show('Сервер не отвечает или произошла ошибка', 'error')
  } finally {
    isSubmitting.value = false
  }
}

onBeforeUnmount(() => {
  previewUrls.value.forEach((url) => URL.revokeObjectURL(url))
})
</script>

<template>
  <div class="max-w-2xl mx-auto mt-10 bg-neutral-800 p-6 sm:p-8 rounded-2xl border border-neutral-700 shadow-xl text-white">
    <h1 class="text-3xl font-bold mb-6">Новое объявление</h1>
    
    <form @submit.prevent="handleCreate" class="flex flex-col gap-5">
      <div>
        <label class="block text-gray-400 text-sm mb-2">Что продаем?</label>
        <input v-model="title" type="text" class="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 focus:border-blue-500 outline-none" required placeholder="Например: Ремонт стиралок">
      </div>
      
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="w-full sm:w-1/3">
          <label class="block text-gray-400 text-sm mb-2">Цена</label>
          <div class="flex">
            <input v-model="price" type="number" class="no-spinners w-full bg-neutral-900 border border-neutral-700 rounded-l-xl p-3 focus:border-blue-500 outline-none" required placeholder="0">
            <select v-model="currency" class="bg-neutral-800 border border-neutral-700 border-l-0 rounded-r-xl px-2 focus:border-blue-500 outline-none cursor-pointer">
              <option value="AZN">₼</option>
              <option value="RUB">₽</option>
              <option value="USD">$</option>
            </select>
          </div>
        </div>
        
        <div class="w-full sm:w-1/3">
          <label class="block text-gray-400 text-sm mb-2">Город</label>
          <input v-model="city" type="text" class="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 focus:border-blue-500 outline-none" required placeholder="Ваш город">
        </div>

        <div class="w-full sm:w-1/3">
          <label class="block text-gray-400 text-sm mb-2">Телефон</label>
          <input v-model="phoneNumber" type="tel" class="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 focus:border-blue-500 outline-none" required placeholder="+7 999 000 00 00">
        </div>
      </div>

      <div>
        <label class="block text-gray-400 text-sm mb-2">Фотографии</label>
        <input 
          type="file" 
          multiple 
          accept="image/*"
          @change="handleFileChange"
          class="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-neutral-700 file:text-white hover:file:bg-neutral-600 outline-none cursor-pointer"
        >
        
        <div v-if="selectedFiles.length > 0" class="flex gap-3 overflow-x-auto mt-4 pb-2">
          <div v-for="(file, index) in selectedFiles" :key="index" class="relative w-20 h-20 flex-shrink-0 bg-neutral-900 rounded-xl border border-neutral-700">
            <img :src="previewUrls[index]" :alt="`Предпросмотр фото ${index + 1}`" class="w-full h-full object-cover rounded-xl" />
            <button type="button" @click="removeFile(index)" class="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs shadow-lg">
              ✕
            </button>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-gray-400 text-sm mb-2">Описание</label>
        <textarea v-model="description" rows="4" class="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 focus:border-blue-500 outline-none" placeholder="Расскажи подробнее..."></textarea>
      </div>
      
      <button type="submit" :disabled="isSubmitting" class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl mt-2 transition-colors">
        {{ isSubmitting ? 'Публикуем...' : 'Опубликовать' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.no-spinners::-webkit-outer-spin-button,
.no-spinners::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.no-spinners[type=number] {
  appearance: textfield;
  -moz-appearance: textfield;
}
</style>
