import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { authService } from '@/services/auth.service'
import { walletService } from '@/services/wallet.service'
import { setAccessToken } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isInitialized = ref(false)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const userBalance = computed(() => user.value?.balance ?? 0)

  // Khôi phục session bằng cách gọi refresh hoặc me
  async function initAuth() {
    if (isInitialized.value) return
    try {
      isLoading.value = true
      // Gọi refresh endpoint để lấy access token mới từ refresh cookie
      const res = await authService.refresh()
      if (res.accessToken) {
        setAccessToken(res.accessToken)
        user.value = res.user
        // Tự động đồng bộ số dư ví thực từ backend
        try {
          const w = await walletService.getWallet()
          if (w && typeof w.balance === 'number') {
            user.value.balance = w.balance
          }
        } catch {
          // Bỏ qua nếu lỗi mạng ví
        }
      }
    } catch {
      // Chưa login hoặc cookie hết hạn, clear
      setAccessToken(null)
      user.value = null
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  function setUser(newUser: User, token?: string) {
    user.value = newUser
    if (token) setAccessToken(token)
    // Đồng bộ ngay số dư ví khi đăng nhập / đăng ký
    walletService.getWallet().then((w) => {
      if (user.value && typeof w.balance === 'number') {
        user.value.balance = w.balance
      }
    }).catch(() => {})
  }

  function updateBalance(newBalance: number) {
    if (user.value) {
      user.value.balance = newBalance
    }
  }

  async function logout() {
    try {
      await authService.logout()
    } catch {
      // Ignore error on logout
    } finally {
      user.value = null
      setAccessToken(null)
    }
  }

  return {
    user,
    isInitialized,
    isLoading,
    isAuthenticated,
    isAdmin,
    userBalance,
    initAuth,
    setUser,
    updateBalance,
    logout,
  }
})
