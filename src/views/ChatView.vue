<template>
    <div class="p-4">
      <h1 class="text-2xl mb-4">Чат</h1>
    </div>
  </template>
  
  <script setup lang="ts">
  import { onMounted, onUnmounted } from 'vue'
  
  const roomName = 'test_room_1'
  let chatSocket: WebSocket | null = null
  
  onMounted(() => {
    chatSocket = new WebSocket(`wss://${window.location.host}/ws/chat/${roomName}/`)
      
    chatSocket.onopen = () => {
      console.log("[open] Ебать, мы подключились! Сокет открыт 😎")
    }
  
    chatSocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log("[message] Прилетело:", data.message)
    }
  
    chatSocket.onclose = () => {
      console.log("[close] Сокет отвалился 😢")
    }
  })
  
  onUnmounted(() => {
    if (chatSocket) chatSocket.close()
  })
  </script>
