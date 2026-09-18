<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
const router = useRouter()
const auth = useAuthStore()
// State for mobile menu
const isMenuOpen = ref(false)
const handleLogout = () => {
  auth.clearSession()
  isMenuOpen.value = false // Close menu on logout
  router.push('/login')
}

</script>
<template>
  <nav class="bg-neutral-800 border-b border-neutral-700 p-4 relative z-50">
    <div class="container mx-auto max-w-6xl flex justify-between items-center">
      <router-link to="/" class="text-2xl font-bold text-green-500 hover:text-green-400 transition-colors tracking-wide">
        VektorGo
      </router-link>      
      <div class="hidden md:flex items-center gap-5 sm:gap-7">

        <router-link to="/" class="text-gray-200 hover:text-green-400 font-bold transition-colors text-lg">

          Объявления

        </router-link>

        <template v-if="!auth.isLoggedIn">

          <router-link to="/login" class="text-gray-400 hover:text-white transition-colors font-semibold">

            Войти

          </router-link>

        </template>

        <template v-else>

          <router-link to="/profile" class="text-gray-300 hover:text-white font-semibold transition-colors">

            Профиль

          </router-link>

          

          <button @click="handleLogout" class="text-gray-400 hover:text-red-400 transition-colors font-semibold">

            Выйти

          </button>

          

          <router-link to="/create" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition-colors shadow-lg">

            + Объявление

          </router-link>

        </template>

      </div>

      <!-- Кнопка гамбургера (только для мобилок) -->

      <button 

        @click="isMenuOpen = !isMenuOpen" 

        class="md:hidden text-gray-300 hover:text-white focus:outline-none p-2"

        aria-label="Toggle menu"

      >

        <svg v-if="!isMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">

          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>

        </svg>

        <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">

          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>

        </svg>

      </button>

    </div>

    <!-- Выпадающее меню для мобилок -->

    <div 

      v-if="isMenuOpen" 

      class="md:hidden absolute top-full left-0 w-full bg-neutral-800 border-b border-neutral-700 shadow-xl flex flex-col p-4 gap-4"

    >

      <router-link @click="isMenuOpen = false" to="/" class="text-gray-200 hover:text-green-400 font-bold transition-colors text-lg text-center">

        Объявления

      </router-link>

      <template v-if="!auth.isLoggedIn">

        <router-link @click="isMenuOpen = false" to="/login" class="text-gray-400 hover:text-white transition-colors font-semibold text-center">

          Войти

        </router-link>

      </template>

      <template v-else>

        <router-link @click="isMenuOpen = false" to="/profile" class="text-gray-300 hover:text-white font-semibold transition-colors text-center">

          Профиль

        </router-link>

        

        <button @click="handleLogout" class="text-gray-400 hover:text-red-400 transition-colors font-semibold text-center">

          Выйти

        </button>

        

        <router-link @click="isMenuOpen = false" to="/create" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg text-center mt-2">

          + Объявление

        </router-link>

      </template>

    </div>

  </nav>

</template>
