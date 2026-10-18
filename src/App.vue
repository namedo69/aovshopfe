<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  // Bắt sự kiện session token hết hạn để đẩy về màn đăng nhập
  window.addEventListener('auth:expired', () => {
    router.push({ path: '/login', query: { expired: '1' } })
  })
})
</script>
