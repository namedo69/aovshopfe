<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <h1 class="text-3xl font-bold text-slate-900 mb-8">Ví Của Tôi</h1>

    <!-- Wallet Balance Card -->
    <div class="bg-gradient-to-tr from-sky-600 to-sky-400 rounded-3xl p-8 text-white shadow-lg shadow-sky-500/20 mb-8 relative overflow-hidden">
      <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span class="text-sky-100 text-sm font-medium">Số dư khả dụng</span>
          <div class="text-4xl sm:text-5xl font-black mt-2 tracking-tight">
            {{ formatVND(authStore.userBalance) }}
          </div>
          <span class="text-xs text-sky-100/80 mt-2 block">
            Cập nhật lần cuối: {{ formatDate(new Date().toISOString()) }}
          </span>
        </div>

        <div>
          <router-link
            to="/deposit"
            class="inline-flex items-center gap-2 bg-white text-sky-600 hover:bg-sky-50 font-bold px-6 py-3 rounded-2xl shadow-sm transition hover:scale-105"
          >
            <PlusCircle class="w-5 h-5" /> Nạp Thêm Tiền
          </router-link>
        </div>
      </div>

      <!-- Cloud circle backgrounds -->
      <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      <div class="absolute -left-10 -top-10 w-40 h-40 bg-sky-300/20 rounded-full blur-xl pointer-events-none"></div>
    </div>

    <!-- History Tabs -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="p-6 border-b border-slate-100 flex items-center justify-between">
        <h2 class="text-lg font-bold text-slate-800">Lịch Sử Biến Động Số Dư</h2>
        <button
          @click="loadTransactions"
          :disabled="isLoading"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
        >
          <RotateCcw :class="['w-3.5 h-3.5', isLoading && 'animate-spin text-sky-600']" />
          <span>Làm mới</span>
        </button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoading" class="p-12 text-center text-slate-400">
        <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2 text-sky-500" />
        <span>Đang tải lịch sử giao dịch...</span>
      </div>

      <!-- Empty state khi tài khoản mới tạo chưa có giao dịch -->
      <div v-else-if="transactions.length === 0" class="p-12 text-center text-slate-400">
        <Clock class="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.2]" />
        <p class="font-medium text-slate-600">Chưa có biến động số dư nào</p>
        <p class="text-xs text-slate-400 mt-1">Khi bạn nạp tiền hoặc thanh toán đơn hàng, lịch sử sẽ xuất hiện tại đây</p>
      </div>

      <!-- Table khi có giao dịch thật -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 text-slate-400 text-xs border-b border-slate-100">
            <tr>
              <th class="py-3 px-6 font-semibold">Loại giao dịch</th>
              <th class="py-3 px-6 font-semibold">Số tiền</th>
              <th class="py-3 px-6 font-semibold">Thời gian</th>
              <th class="py-3 px-6 font-semibold">Trạng thái</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr v-for="tx in transactions" :key="tx.id" class="hover:bg-slate-50/50 transition">
              <td class="py-4 px-6 flex items-center gap-2">
                <div
                  :class="[
                    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                    tx.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  ]"
                >
                  {{ tx.amount > 0 ? '+' : '-' }}
                </div>
                <div>
                  <span class="font-medium text-slate-800 block">{{ tx.description || 'Giao dịch ví' }}</span>
                  <span v-if="tx.referenceId" class="text-xs text-slate-400 font-mono">{{ tx.referenceId }}</span>
                </div>
              </td>
              <td :class="['py-4 px-6 font-bold', tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600']">
                {{ tx.amount > 0 ? '+' : '' }}{{ formatVND(tx.amount) }}
              </td>
              <td class="py-4 px-6 text-slate-400 text-xs">
                {{ formatDate(tx.createdAt) }}
              </td>
              <td class="py-4 px-6">
                <span
                  :class="[
                    'px-2 py-0.5 rounded-full text-xs font-semibold',
                    tx.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                  ]"
                >
                  {{ tx.status === 'completed' ? 'Thành công' : tx.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { formatVND, formatDate } from '@/utils/format'
import { PlusCircle, RotateCcw, Loader2, Clock } from 'lucide-vue-next'
import { walletService, type WalletTransaction } from '@/services/wallet.service'

const authStore = useAuthStore()
const transactions = ref<WalletTransaction[]>([])
const isLoading = ref(true)

const loadTransactions = async () => {
  isLoading.value = true
  try {
    // Luôn lấy dữ liệu thật 100% từ Database
    const list = await walletService.getTransactions()
    transactions.value = list
  } catch (err) {
    console.warn('API error fetching transactions:', err)
    transactions.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadTransactions()
})
</script>
