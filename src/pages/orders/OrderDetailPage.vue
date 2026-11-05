<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="mb-6">
      <router-link to="/orders" class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-sky-600 transition">
        <ArrowLeft class="w-4 h-4" /> Danh sách đơn hàng
      </router-link>
    </div>

    <!-- Loading Skeleton lúc chuyển trang -->
    <div v-if="isLoading" class="space-y-6 animate-pulse">
      <div class="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
        <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        <div class="h-4 bg-slate-100 rounded w-1/4"></div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-6 h-28 bg-slate-50"></div>
      <div class="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
        <div class="h-5 bg-slate-200 rounded w-1/4"></div>
        <div class="h-10 bg-slate-100 rounded w-full"></div>
        <div class="h-10 bg-slate-100 rounded w-full"></div>
      </div>
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

        <!-- Tiến độ vé xác nhận thực tế (Chung Sức Home API / Mở Rương Nhóm) -->
        <div v-if="order.ticketsTarget && order.ticketsTarget > 0" class="mt-6 pt-5 border-t border-slate-100 space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-500 font-medium">{{ isGroupChest ? 'Tiến độ hoàn thành tài khoản:' : 'Tiến độ vé xác nhận trong nick:' }}</span>
            <span class="font-mono font-bold text-sky-700">
              {{ order.ticketsConfirmed || 0 }} / {{ order.ticketsTarget }} {{ isGroupChest ? 'tài khoản' : 'vé' }} ({{ Math.min(100, Math.round(((order.ticketsConfirmed || 0) / order.ticketsTarget) * 100)) }}%)
            </span>
          </div>
          <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-500"
              :style="{ width: `${Math.min(100, Math.round(((order.ticketsConfirmed || 0) / order.ticketsTarget) * 100))}%` }"
            ></div>
          </div>
          <p class="text-[11px] text-slate-400">
            Hệ thống tự động cập nhật trực tiếp qua WebSocket. Polling dự phòng mỗi 8 giây.
          </p>
        </div>
      </div>

      <!-- Danh sách tài khoản mở rương nhóm nếu có -->
      <div v-if="groupJob && groupJob.items && groupJob.items.length" class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-bold text-slate-800">Danh Sách Tài Khoản Mở Rương ({{ groupJob.items.length }})</h2>
          <span class="text-xs px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 font-bold font-mono">
            {{ groupJob.completedCount || 0 }}/{{ groupJob.itemCount || groupJob.items.length }} Xong
          </span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border border-slate-100 rounded-lg overflow-hidden">
            <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th class="p-2.5">STT</th>
                <th class="p-2.5">Tài Khoản</th>
                <th class="p-2.5">Trạng Thái</th>
                <th class="p-2.5">Rương Thần Long</th>
                <th class="p-2.5">Rương Bạch Vệ</th>
                <th class="p-2.5">Kết Quả</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(gItem, gIdx) in groupJob.items" :key="gItem.id || String(gIdx)" :class="gItem.result?.is_jackpot ? 'bg-amber-50/50' : 'hover:bg-slate-50/50'">
                <td class="p-2.5 font-mono text-slate-400">{{ Number(gIdx) + 1 }}</td>
                <td class="p-2.5 font-bold text-slate-800">
                  <span v-if="gItem.result?.is_jackpot" class="text-amber-600 mr-1">🔥 [VIP]</span>
                  {{ gItem.externalAccountId }}
                </td>
                <td class="p-2.5">
                  <span v-if="gItem.status === 'success'" class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">Thành công</span>
                  <span v-else-if="gItem.status === 'failed'" class="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700">Thất bại</span>
                  <span v-else-if="gItem.status === 'processing'" class="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700 animate-pulse">Đang chạy...</span>
                  <span v-else class="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">Chờ xử lý</span>
                </td>
                <td class="p-2.5 font-mono text-slate-600">{{ gItem.result?.tl_summary || '-' }}</td>
                <td class="p-2.5 font-mono text-slate-600">{{ gItem.result?.bv_summary || '-' }}</td>
                <td class="p-2.5 text-slate-600">{{ gItem.result?.status || gItem.errorMessage || '-' }}</td>
              </tr>
            </tbody>
          </table>
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
          <template v-for="(val, key) in item.inputs" :key="key">
            <div v-if="key === 'accounts' && Array.isArray(val)" class="flex justify-between py-1 border-b border-slate-50">
              <span class="text-slate-400">Số tài khoản</span>
              <span class="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">{{ val.length }} tài khoản</span>
            </div>
            <div v-else-if="key !== 'productType' && typeof val !== 'object'" class="flex justify-between py-1 border-b border-slate-50">
              <span class="text-slate-400">{{ key === 'accountId' ? 'Code Sự kiện' : key }}</span>
              <span class="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">{{ val }}</span>
            </div>
          </template>
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

    <!-- Error or Not found (chỉ hiện khi đã load xong 100% nhưng không thấy đơn) -->
    <div v-else class="text-center py-16 bg-white rounded-2xl border border-slate-200">
      <p class="text-slate-500">Không tìm thấy thông tin đơn hàng này.</p>
      <router-link to="/orders" class="mt-4 inline-block px-5 py-2 rounded-xl bg-sky-600 text-white font-medium text-sm">
        Xem danh sách đơn
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { formatVND, formatDate } from '@/utils/format'
import { ArrowLeft, Check, Loader2 } from 'lucide-vue-next'
import { orderService } from '@/services/order.service'
import { useSocket } from '@/services/socket'
import type { Order, OrderStatus } from '@/types'

const route = useRoute()
const orderCode = route.params.orderCode as string

const order = ref<Order | null>(null)
const groupJob = ref<any>(null)
const isLoading = ref(true)

const isGroupChest = computed(() => order.value?.items?.some(it => it.inputs?.productType === 'group_chest_open'))

const statusLabels: Record<OrderStatus, string> = {
  queued: 'Cho gui',
  sending: 'Dang gui doi tac',
  processing: 'Dang xu ly',
  completed: 'Hoan thanh',
  failed: 'Loi',
  refunded: 'Da hoan tien',
  cancelled: 'Da huy',
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

// ─── WebSocket realtime updates ──────────────────────────────────
const { subscribeOrder, onOrderProgress, onGroupChestItemResult } = useSocket()

// Fallback polling (only if WS is not delivering updates)
let liveTimer: any = null
let lastWSUpdate = 0

const pollLiveProgress = async () => {
  if (Date.now() - lastWSUpdate < 8_000) return
  if (!order.value || ['completed', 'cancelled', 'refunded', 'failed'].includes(order.value.status)) {
    if (liveTimer) clearInterval(liveTimer)
    return
  }
  try {
    const live = await orderService.getOrderProgress(orderCode)
    if (order.value) {
      order.value.status = live.status
      order.value.ticketsTarget = live.ticketsTarget
      order.value.ticketsConfirmed = live.ticketsConfirmed
      order.value.completedRequests = live.completedRequests
    }
    if (isGroupChest.value) {
      try {
        groupJob.value = await orderService.getGroupChestOrder(orderCode)
      } catch {}
    }
    if (['completed', 'cancelled', 'refunded', 'failed'].includes(live.status)) {
      if (liveTimer) clearInterval(liveTimer)
    }
  } catch {
    // Ignore transient polling errors
  }
}

onMounted(async () => {
  isLoading.value = true
  try {
    order.value = await orderService.getOrderByCode(orderCode)

    if (isGroupChest.value) {
      try {
        groupJob.value = await orderService.getGroupChestOrder(orderCode)
      } catch {}
    }

    if (order.value && ['queued', 'sending', 'processing'].includes(order.value.status)) {
      // Subscribe to WebSocket updates for this order
      subscribeOrder(orderCode)

      // Fallback: poll every 8s in case WS is not connected
      liveTimer = setInterval(pollLiveProgress, 8_000)
    }
  } catch (err) {
    console.warn('API error loading order detail:', err)
  } finally {
    isLoading.value = false
  }
})

// Handle WebSocket progress events
onOrderProgress((data) => {
  if (data.orderCode !== orderCode || !order.value) return
  lastWSUpdate = Date.now()
  order.value.status = data.status as OrderStatus
  order.value.ticketsTarget = data.ticketsTarget
  order.value.ticketsConfirmed = data.ticketsConfirmed
  order.value.completedRequests = data.completedRequests

  if (['completed', 'cancelled', 'refunded', 'failed'].includes(data.status)) {
    if (liveTimer) clearInterval(liveTimer)
  }
})

onGroupChestItemResult((data: any) => {
  if (data.orderCode === orderCode && groupJob.value?.items) {
    const idx = groupJob.value.items.findIndex((it: any) => it.id === data.itemId || it.externalAccountId === data.externalAccountId)
    if (idx !== -1) {
      groupJob.value.items[idx].status = data.status
      groupJob.value.items[idx].result = data.result
      groupJob.value.items[idx].errorMessage = data.error
    }
  }
})

onUnmounted(() => {
  if (liveTimer) clearInterval(liveTimer)
})
</script>
