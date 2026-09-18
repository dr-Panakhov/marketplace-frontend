<script setup lang="ts">
import { useToastStore } from '../stores/toast'
const toast = useToastStore()
</script>

<template>
  <div v-if="toast.isVisible" 
       class="fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-2xl font-bold text-white z-[100] transition-all"
       :class="{
         'bg-red-600': toast.type === 'error',
         'bg-green-600': toast.type === 'success',
         'bg-blue-600': toast.type === 'info'
       }">
    {{ toast.message }}
  </div>
</template>
