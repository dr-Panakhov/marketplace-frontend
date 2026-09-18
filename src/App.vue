<script setup lang="ts">
import Navbar from './components/Navbar.vue'
import Toast from './components/Toast.vue'
</script>

<template>
  <div class="min-h-screen bg-neutral-900 font-sans">
    <Navbar />
    <Toast /> 
    
    <main class="container mx-auto max-w-6xl p-6 mt-8">
      <router-view />
    </main>
  </div>
</template>
