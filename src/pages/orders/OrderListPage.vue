<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Lịch Sử Đơn Hàng</h1>
        <p class="text-slate-500 mt-1">Theo dõi tiến độ và trạng thái các đơn hàng của bạn</p>
      </div>

      <button
        @click="loadOrders"
        :disabled="isLoading"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
      >
        <RotateCcw :class="['w-3.5 h-3.5', isLoading && 'animate-spin text-sky-600']" />
        <span>Làm mới</span>
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="isLoading" class="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
      <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2 text-sky-500" />
      <span>Đang tải danh sách đơn hàng...</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="orders.length === 0" class="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
      <PackageSearch class="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-[1.2]" />
      <h3 class="text-base font-semibold text-slate-700">Chưa có đơn hàng nào</h3>
      <p class="text-sm text-slate-400 mt-1">Bạn chưa đặt đơn hàng nào trên hệ thống</p>
      <router-link to="/products" class="mt-4 inline-block px-5 py-2 rounded-xl bg-sky-600 text-white font-medium text-sm">
        Khám phá dịch vụ
      </router-link>
    </div>

    <!-- Orders Table -->
    <div v-else class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 text-slate-500 text-xs border-b border-slate-100">
            <tr>
              <th class="py-3.5 px-6 font-semibold">Mã Đơn</th>
              <th class="py-3.5 px-6 font-semibold">Sản Phẩm</th>
              <th class="py-3.5 px-6 font-semibold">Thanh Toán</th>
              <th class="py-3.5 px-6 font-semibold">Thời Gian</th>
              <th class="py-3.5 px-6 font-semibold">Trạng Thái</th>
              <th class="py-3.5 px-6 font-semibold text-right">Hành Động</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr v-for="order in orders" :key="order.id" class="hover:bg-slate-50/60 transition">
              <td class="py-4 px-6 font-mono font-medium text-slate-900">
                {{ order.orderCode }}
              </td>
              <td class="py-4 px-6">
                {{ order.items[0]?.productName || 'Gói Dịch Vụ' }}
              </td>
              <td class="py-4 px-6 font-semibold text-slate-900">
                {{ formatVND(order.finalAmount) }}
              </td>
              <td class="py-4 px-6 text-slate-400 text-xs">
                {{ formatDate(order.createdAt) }}
              </td>
              <td class="py-4 px-6">
                <span
                  :class="[
                    'px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1',
                    statusStyles[order.status] || 'bg-slate-100 text-slate-700'
                  ]"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {{ statusLabels[order.status] || order.status }}
                </span>
              </td>
              <td class="py-4 px-6 text-right">
                <router-link
                  :to="`/orders/${order.orderCode}`"
                  class="text-xs font-semibold text-sky-600 hover:text-sky-700 transition"
                >
                  Chi tiết
                </router-link>
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
import { formatVND, formatDate } from '@/utils/format'
import { orderService } from '@/services/order.service'
import { PackageSearch, RotateCcw, Loader2 } from 'lucide-vue-next'
import type { Order, OrderStatus } from '@/types'

const statusLabels: Record<OrderStatus, string> = {
  queued: 'Chờ gửi',
  sending: 'Đang gửi đối tác',
  processing: 'Đang xử lý',
  completed: 'Hoàn thành',
  failed: 'Lỗi xử lý',
  refunded: 'Đã hoàn tiền',
  cancelled: 'Đã hủy',
}

const statusStyles: Record<OrderStatus, string> = {
  queued: 'bg-amber-50 text-amber-700',
  sending: 'bg-blue-50 text-blue-700',
  processing: 'bg-sky-50 text-sky-700',
  completed: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-rose-50 text-rose-700',
  refunded: 'bg-purple-50 text-purple-700',
  cancelled: 'bg-slate-100 text-slate-600',
}

const orders = ref<Order[]>([])
const isLoading = ref(false)

const loadOrders = async () => {
  isLoading.value = true
  try {
    orders.value = await orderService.getOrders()
  } catch (err) {
    console.warn('API error fetching orders:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadOrders()
})
</script>
