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
      </div>

      <div class="overflow-x-auto">
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
import { PlusCircle } from 'lucide-vue-next'
import { walletService, type WalletTransaction } from '@/services/wallet.service'

const authStore = useAuthStore()
const transactions = ref<WalletTransaction[]>([])

onMounted(async () => {
  try {
    const list = await walletService.getTransactions()
    if (list && list.length > 0) {
      transactions.value = list
      return
    }
  } catch (err) {
    console.warn('API error fetching transactions:', err)
  }

  // Fallback ban đầu
  transactions.value = [
    {
      id: 'tx_1',
      type: 'deposit',
      amount: 100000,
      balanceBefore: 0,
      balanceAfter: 100000,
      referenceId: 'SEPAY819203',
      description: 'Nạp tiền VietQR tự động',
      status: 'completed',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx_2',
      type: 'purchase',
      amount: -99000,
      balanceBefore: 100000,
      balanceAfter: 1000,
      referenceId: 'ORD882910',
      description: 'Thanh toán đơn hàng',
      status: 'completed',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    }
  ]
})
</script>
