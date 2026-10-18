<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="mb-6">
      <router-link to="/orders" class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-sky-600 transition">
        <ArrowLeft class="w-4 h-4" /> Danh sách đơn hàng
      </router-link>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
      <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2 text-sky-500" />
      <span>Đang tải thông tin đơn hàng...</span>
    </div>

    <div v-else-if="order" class="space-y-8">
      <!-- Header Card -->
      <div class="bg-white rounded-2xl border border-sky-100 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-slate-900">Đơn hàng #{{ order.orderCode }}</h1>
            <span
              :class="[
                'px-3 py-1 rounded-full text-xs font-semibold',
                statusStyles[order.status] || 'bg-slate-100 text-slate-700'
              ]"
            >
              {{ statusLabels[order.status] || order.status }}
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-1">Khởi tạo lúc {{ formatDate(order.createdAt) }}</p>
        </div>

        <div class="text-right">
          <span class="text-xs text-slate-400 block">Tổng thanh toán</span>
          <span class="text-2xl font-black text-sky-600">{{ formatVND(order.finalAmount) }}</span>
        </div>
      </div>

      <!-- Status Timeline Flow -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h2 class="text-base font-bold text-slate-800 mb-6">Tiến Trình Đơn Hàng</h2>

        <div class="relative flex items-center justify-between max-w-2xl mx-auto px-4">
          <!-- Connecting Line -->
          <div class="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-slate-100 -z-0">
            <div
              class="h-full bg-sky-500 transition-all duration-500"
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>

          <!-- Step 1: Queued -->
          <div class="relative z-10 flex flex-col items-center">
            <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-sky-500 text-white shadow-md shadow-sky-500/20">
              <Check class="w-5 h-5" />
            </div>
            <span class="text-xs font-semibold text-slate-800 mt-2">Đã Tiếp Nhận</span>
          </div>

          <!-- Step 2: Processing -->
          <div class="relative z-10 flex flex-col items-center">
            <div
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition',
                order.status === 'processing' || order.status === 'completed' || order.status === 'sending'
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white text-slate-400 border-slate-200'
              ]"
            >
              <Loader2 v-if="order.status === 'processing' || order.status === 'sending'" class="w-5 h-5 animate-spin" />
              <Check v-else-if="order.status === 'completed'" class="w-5 h-5" />
              <span v-else>2</span>
            </div>
            <span class="text-xs font-semibold text-slate-800 mt-2">Đang Xử Lý</span>
          </div>

          <!-- Step 3: Completed -->
          <div class="relative z-10 flex flex-col items-center">
            <div
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition',
                order.status === 'completed'
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white text-slate-400 border-slate-200'
              ]"
            >
              <Check v-if="order.status === 'completed'" class="w-5 h-5" />
              <span v-else>3</span>
            </div>
            <span class="text-xs font-semibold text-slate-800 mt-2">Hoàn Thành</span>
          </div>
        </div>
      </div>

      <!-- Details Card -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 class="text-base font-bold text-slate-800">Chi Tiết Sản Phẩm & Đầu Vào</h2>

        <div v-for="(item, idx) in order.items" :key="idx" class="space-y-3 pb-4 border-b border-slate-100 last:border-b-0">
          <div class="flex justify-between py-1 border-b border-slate-50">
            <span class="text-slate-400">Gói dịch vụ</span>
            <span class="font-bold text-slate-800">{{ item.productName }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-50">
            <span class="text-slate-400">Giá gói</span>
            <span class="font-medium text-slate-800">{{ formatVND(item.price) }}</span>
          </div>
          <div v-for="(val, key) in item.inputs" :key="key" class="flex justify-between py-1 border-b border-slate-50">
            <span class="text-slate-400">{{ key }}</span>
            <span class="font-mono font-medium text-slate-800">{{ val }}</span>
          </div>
        </div>

        <div v-if="order.voucherCode" class="flex justify-between py-1 border-b border-slate-50 text-sm">
          <span class="text-slate-400">Mã giảm giá</span>
          <span class="font-mono font-medium text-emerald-600">{{ order.voucherCode }} (-{{ formatVND(order.discountAmount) }})</span>
        </div>

        <div v-if="order.customerNote" class="flex justify-between py-1 border-b border-slate-50 text-sm">
          <span class="text-slate-400">Ghi chú khách hàng</span>
          <span class="italic text-slate-700">{{ order.customerNote }}</span>
        </div>

        <div class="flex justify-between py-1 text-sm">
          <span class="text-slate-400">Cổng xử lý</span>
          <span class="font-medium text-slate-800">langxang Cloud Automated</span>
        </div>
      </div>
    </div>

    <!-- Error or Not found -->
    <div v-else class="text-center py-16 bg-white rounded-2xl border border-slate-200">
      <p class="text-slate-500">Không tìm thấy thông tin đơn hàng này.</p>
      <router-link to="/orders" class="mt-4 inline-block px-5 py-2 rounded-xl bg-sky-600 text-white font-medium text-sm">
        Xem danh sách đơn
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { formatVND, formatDate } from '@/utils/format'
import { ArrowLeft, Check, Loader2 } from 'lucide-vue-next'
import { orderService } from '@/services/order.service'
import type { Order, OrderStatus } from '@/types'

const route = useRoute()
const orderCode = route.params.orderCode as string

const order = ref<Order | null>(null)
const isLoading = ref(true)

const statusLabels: Record<OrderStatus, string> = {
  queued: 'Chờ gửi',
  sending: 'Đang gửi đối tác',
  processing: 'Đang xử lý',
  completed: 'Hoàn thành',
  failed: 'Lỗi',
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

const progressPercent = computed(() => {
  if (!order.value) return 0
  if (order.value.status === 'completed') return 100
  if (order.value.status === 'processing' || order.value.status === 'sending') return 50
  return 15
})

onMounted(async () => {
  isLoading.value = true
  try {
    order.value = await orderService.getOrderByCode(orderCode)
  } catch (err) {
    console.warn('API error loading order detail:', err)
  } finally {
    isLoading.value = false
  }
})
</script>
