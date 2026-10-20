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
  const userTierName = computed(() => user.value?.tierName || (isAdmin.value ? 'Quản trị viên' : 'Thành viên'))
  const userTierDiscount = computed(() => isAdmin.value ? 100 : (user.value?.tierDiscount ?? 0))

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
        // Đồng bộ thông tin profile kèm tier và số dư ví thực từ backend
        try {
          const [meData, w] = await Promise.allSettled([
            authService.getMe(),
            walletService.getWallet(),
          ])
          if (meData.status === 'fulfilled' && meData.value) {
            user.value = { ...user.value, ...meData.value }
          }
          if (w.status === 'fulfilled' && w.value && typeof w.value.balance === 'number') {
            user.value.balance = w.value.balance
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
    // Đồng bộ ngay tier và số dư ví khi đăng nhập / đăng ký
    Promise.allSettled([
      authService.getMe(),
      walletService.getWallet(),
    ]).then(([meRes, wRes]) => {
      if (user.value && meRes.status === 'fulfilled' && meRes.value) {
        user.value = { ...user.value, ...meRes.value }
      }
      if (user.value && wRes.status === 'fulfilled' && typeof wRes.value?.balance === 'number') {
        user.value.balance = wRes.value.balance
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
    userTierName,
    userTierDiscount,
    initAuth,
    setUser,
    updateBalance,
    logout,
  }
})
