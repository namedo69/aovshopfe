import { defineStore } from 'pinia'
import { ref } from 'vue'
import { walletService } from '@/services/wallet.service'
import { useAuthStore } from './auth'

export const useWalletStore = defineStore('wallet', () => {
  const balance = ref<number>(0)
  const isFetching = ref(false)
  const lastUpdated = ref<Date | null>(null)

  const authStore = useAuthStore()

  async function fetchWallet() {
    isFetching.value = true
    try {
      const data = await walletService.getWallet()
      if (data?.balance !== undefined) {
        balance.value = data.balance
        authStore.updateBalance(data.balance)
        lastUpdated.value = new Date()
      }
    } catch (err) {
      console.error('Fetch wallet failed:', err)
    } finally {
      isFetching.value = false
    }
  }

  return {
    balance,
    isFetching,
    lastUpdated,
    fetchWallet,
  }
})
