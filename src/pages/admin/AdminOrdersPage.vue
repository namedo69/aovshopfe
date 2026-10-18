<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Quản Lý Đơn Hàng</h1>
        <p class="text-sm text-slate-500">Toàn bộ đơn hàng khách đặt, xử lý duyệt hoàn thành hoặc hoàn tiền</p>
      </div>

      <button
        @click="loadOrders"
        :disabled="isLoading"
        class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
      >
        <RotateCcw :class="['w-3.5 h-3.5', isLoading && 'animate-spin text-sky-600']" />
        <span>Làm mới</span>
      </button>
    </div>

    <!-- Alert notification -->
    <div v-if="alertMessage" :class="['p-4 rounded-xl text-sm flex items-center justify-between', alertType === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200']">
      <span>{{ alertMessage }}</span>
      <button @click="alertMessage = ''" class="font-bold ml-4">✕</button>
    </div>

    <!-- Thanh Tìm Kiếm & Bộ Lọc Trạng Thái -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
      <!-- Search Input -->
      <div class="relative w-full md:w-80">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tìm theo mã đơn, Code Sự Kiện hoặc User ID..."
          class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs outline-none bg-slate-50/50"
        />
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
      </div>

      <!-- Filter Buttons -->
      <div class="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
        <button
          v-for="tab in filterTabs"
          :key="tab.value"
          @click="currentStatusFilter = tab.value"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer',
            currentStatusFilter === tab.value
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
          ]"
        >
          {{ tab.label }}
          <span
            v-if="tab.count !== undefined"
            :class="[
              'ml-1 px-1.5 py-0.2 rounded-full text-[10px]',
              currentStatusFilter === tab.value ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'
            ]"
          >
            {{ tab.count }}
          </span>
        </button>
      </div>
    </div>

    <!-- Thanh Hành Động Hàng Loạt (Bulk Action Bar) khi có tick chọn -->
    <div
      v-if="selectedOrderIds.length > 0"
      class="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div class="flex items-center gap-2 text-sm text-sky-900 font-medium">
        <CheckSquare class="w-5 h-5 text-sky-600" />
        <span>Đã chọn <strong class="text-sky-700 text-base font-bold">{{ selectedOrderIds.length }}</strong> đơn hàng</span>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="openBulkStatusModal('completed')"
          :disabled="isSubmitting"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <CheckCircle class="w-4 h-4" />
          <span>Duyệt Hoàn Thành Tất Cả</span>
        </button>

        <button
          @click="openBulkStatusModal('failed')"
          :disabled="isSubmitting"
          class="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <AlertCircle class="w-4 h-4" />
          <span>Báo Lỗi Hàng Loạt</span>
        </button>

        <button
          @click="clearSelection"
          class="px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-medium border border-slate-200 transition cursor-pointer"
        >
          Bỏ chọn
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
      <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2 text-sky-500" />
      <span>Đang tải danh sách đơn hàng toàn hệ thống...</span>
    </div>

    <!-- Orders Table -->
    <div v-else class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div v-if="filteredOrders.length === 0" class="p-12 text-center text-slate-400">
        <ShoppingCart class="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.2]" />
        <p class="font-medium text-slate-600">Không tìm thấy đơn hàng nào phù hợp</p>
        <p class="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm</p>
      </div>

      <table v-else class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-slate-500 text-xs border-b border-slate-100">
          <tr>
            <!-- Checkbox Chọn Tất Cả -->
            <th class="py-3.5 px-4 w-10 text-center">
              <input
                type="checkbox"
                :checked="isAllSelected"
                @change="toggleSelectAll"
                class="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                title="Chọn tất cả đơn đang hiển thị"
              />
            </th>
            <th class="py-3.5 px-4 font-semibold">Mã Đơn</th>
            <th class="py-3.5 px-4 font-semibold">Gói Dịch Vụ</th>
            <th class="py-3.5 px-4 font-semibold">Code Sự Kiện</th>
            <th class="py-3.5 px-4 font-semibold">Thanh Toán</th>
            <th class="py-3.5 px-4 font-semibold">Thời Gian</th>
            <th class="py-3.5 px-4 font-semibold">Trạng Thái</th>
            <th class="py-3.5 px-6 font-semibold text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-slate-700">
          <tr
            v-for="order in filteredOrders"
            :key="order.id"
            :class="[
              'transition',
              selectedOrderIds.includes(order.id) ? 'bg-sky-50/60' : 'hover:bg-slate-50/50'
            ]"
          >
            <!-- Checkbox từng dòng -->
            <td class="py-4 px-4 text-center">
              <input
                type="checkbox"
                :value="order.id"
                v-model="selectedOrderIds"
                class="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
            </td>
            <td class="py-4 px-4 font-mono font-medium text-slate-900">
              {{ order.orderCode }}
            </td>
            <td class="py-4 px-4 text-xs font-semibold text-slate-800">
              {{ order.items[0]?.productName || 'Gói Dịch Vụ' }}
            </td>
            <td class="py-4 px-4">
              <div v-if="getEventCode(order)" class="flex items-center gap-1.5">
                <span class="font-mono text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-lg select-all">
                  {{ getEventCode(order) }}
                </span>
                <button
                  @click="copyCode(getEventCode(order))"
                  title="Sao chép Code"
                  class="p-1 text-slate-400 hover:text-sky-600 rounded transition cursor-pointer"
                >
                  <Copy class="w-3.5 h-3.5" />
                </button>
              </div>
              <span v-else class="text-xs text-slate-400 italic">Không có code</span>
            </td>
            <td class="py-4 px-4 font-bold text-sky-600">
              {{ formatVND(order.finalAmount) }}
            </td>
            <td class="py-4 px-4 text-xs text-slate-400">
              {{ formatDate(order.createdAt) }}
            </td>
            <td class="py-4 px-4">
              <span
                :class="[
                  'px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5',
                  statusStyles[order.status] || 'bg-slate-100 text-slate-600'
                ]"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                {{ statusLabels[order.status] || order.status }}
              </span>
            </td>
            <td class="py-4 px-6 text-right space-x-2">
              <!-- Duyệt hoàn thành khi đơn queued/sending/processing -->
              <button
                v-if="['queued', 'sending', 'processing'].includes(order.status)"
                @click="openStatusModal(order, 'completed')"
                class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
              >
                Hoàn Thành
              </button>

              <!-- Đánh dấu thất bại để có thể hoàn tiền -->
              <button
                v-if="['queued', 'sending', 'processing'].includes(order.status)"
                @click="openStatusModal(order, 'failed')"
                class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer"
              >
                Báo Lỗi
              </button>

              <!-- Hoàn tiền cho khách nếu đơn failed -->
              <button
                v-if="order.status === 'failed'"
                @click="openRefundModal(order)"
                class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition cursor-pointer"
              >
                Hoàn Tiền Ví
              </button>

              <!-- Gửi lại nếu có provider -->
              <button
                v-if="order.status === 'failed'"
                @click="handleRetry(order)"
                class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition cursor-pointer"
              >
                Gửi Lại
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Cập nhật trạng thái đơn lẻ -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-800">
            {{ modalAction === 'refund' ? 'Xác Nhận Hoàn Tiền Đơn Hàng' : 'Cập Nhật Trạng Thái Đơn' }}
          </h3>
          <button @click="isModalOpen = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="handleConfirmAction" class="p-6 space-y-4">
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div class="flex justify-between">
              <span class="text-slate-500">Mã đơn:</span>
              <span class="font-mono font-bold text-slate-800">{{ selectedOrder?.orderCode }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Tổng tiền:</span>
              <span class="font-bold text-sky-600">{{ formatVND(selectedOrder?.finalAmount ?? 0) }}</span>
            </div>
            <div v-if="modalAction === 'status'" class="flex justify-between">
              <span class="text-slate-500">Chuyển sang:</span>
              <span class="font-bold text-slate-800 uppercase">{{ targetStatus }}</span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Lý do thực hiện (tối thiểu 5 ký tự) *</label>
            <textarea
              v-model="actionReason"
              rows="3"
              required
              minlength="5"
              placeholder="Nhập lý do chuyển trạng thái hoặc lý do hoàn tiền..."
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none"
            ></textarea>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="isModalOpen = false"
              class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || actionReason.trim().length < 5"
              class="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <span>Xác Nhận Thực Hiện</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Cập nhật hàng loạt (Bulk Update Modal) -->
    <div v-if="isBulkModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-800">Cập Nhật Hàng Loạt Đơn Hàng</h3>
          <button @click="isBulkModalOpen = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="handleConfirmBulkAction" class="p-6 space-y-4">
          <div class="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900 space-y-1">
            <div>Số lượng đơn cập nhật: <strong class="text-sky-700 text-sm font-bold">{{ selectedOrderIds.length }}</strong> đơn</div>
            <div>Trạng thái mới: <strong class="uppercase text-emerald-700 font-bold">{{ bulkTargetStatus === 'completed' ? 'Hoàn Thành' : 'Báo Lỗi' }}</strong></div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Lý do cập nhật hàng loạt (tối thiểu 5 ký tự) *</label>
            <textarea
              v-model="bulkActionReason"
              rows="3"
              required
              minlength="5"
              placeholder="VD: Admin duyệt hoàn thành hàng loạt..."
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none"
            ></textarea>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="isBulkModalOpen = false"
              class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || bulkActionReason.trim().length < 5"
              class="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <span>Cập Nhật {{ selectedOrderIds.length }} Đơn</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { formatVND, formatDate, copyToClipboard } from '@/utils/format'
import { ShoppingCart, RotateCcw, Loader2, Search, Copy, CheckSquare, CheckCircle, AlertCircle } from 'lucide-vue-next'
import { adminService } from '@/services/admin.service'
import type { Order, OrderStatus } from '@/types'

const ordersList = ref<Order[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const alertMessage = ref('')
const alertType = ref<'success' | 'error'>('success')

// Selection (Checkbox hàng loạt)
const selectedOrderIds = ref<string[]>([])

// Filters
const searchQuery = ref('')
const currentStatusFilter = ref<string>('all')

// Single Modal state
const isModalOpen = ref(false)
const modalAction = ref<'status' | 'refund'>('status')
const selectedOrder = ref<Order | null>(null)
const targetStatus = ref<string>('completed')
const actionReason = ref('')

// Bulk Modal state
const isBulkModalOpen = ref(false)
const bulkTargetStatus = ref<string>('completed')
const bulkActionReason = ref('')

const statusLabels: Record<OrderStatus, string> = {
  queued: 'Chờ xử lý',
  sending: 'Đang gửi đối tác',
  processing: 'Đang xử lý',
  completed: 'Hoàn thành',
  failed: 'Lỗi / Thất bại',
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

const filterTabs = computed(() => [
  { label: 'Tất cả', value: 'all', count: ordersList.value.length },
  { label: 'Chờ xử lý', value: 'pending_group', count: ordersList.value.filter(o => ['queued', 'sending', 'processing'].includes(o.status)).length },
  { label: 'Hoàn thành', value: 'completed', count: ordersList.value.filter(o => o.status === 'completed').length },
  { label: 'Lỗi', value: 'failed', count: ordersList.value.filter(o => o.status === 'failed').length },
  { label: 'Đã hoàn tiền', value: 'refunded', count: ordersList.value.filter(o => o.status === 'refunded').length },
])

const filteredOrders = computed(() => {
  return ordersList.value.filter((order) => {
    // 1. Lọc theo trạng thái
    if (currentStatusFilter.value === 'pending_group') {
      if (!['queued', 'sending', 'processing'].includes(order.status)) return false
    } else if (currentStatusFilter.value !== 'all') {
      if (order.status !== currentStatusFilter.value) return false
    }

    // 2. Tìm kiếm theo OrderCode, User ID hoặc Code Sự Kiện
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      const matchCode = order.orderCode?.toLowerCase().includes(q)
      const matchId = order.id?.toLowerCase().includes(q)
      const eventCode = getEventCode(order).toLowerCase()
      const matchEventCode = eventCode.includes(q)
      if (!matchCode && !matchId && !matchEventCode) return false
    }

    return true
  })
})

// Quản lý checkbox Select All
const isAllSelected = computed(() => {
  if (filteredOrders.value.length === 0) return false
  return filteredOrders.value.every(o => selectedOrderIds.value.includes(o.id))
})

const toggleSelectAll = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) {
    const visibleIds = filteredOrders.value.map(o => o.id)
    selectedOrderIds.value = Array.from(new Set([...selectedOrderIds.value, ...visibleIds]))
  } else {
    const visibleIds = filteredOrders.value.map(o => o.id)
    selectedOrderIds.value = selectedOrderIds.value.filter(id => !visibleIds.includes(id))
  }
}

const clearSelection = () => {
  selectedOrderIds.value = []
}

const getEventCode = (order: Order): string => {
  if (!order.items || order.items.length === 0) return ''
  for (const item of order.items) {
    if (item.inputs) {
      if (item.inputs.accountId) return String(item.inputs.accountId)
      if (item.inputs.code) return String(item.inputs.code)
      if (item.inputs.eventCode) return String(item.inputs.eventCode)
      const firstVal = Object.values(item.inputs)[0]
      if (firstVal) return String(firstVal)
    }
  }
  return ''
}

const copyCode = async (codeStr: string) => {
  if (!codeStr) return
  await copyToClipboard(codeStr)
  showAlert(`Đã sao chép Code Sự Kiện: ${codeStr}`)
}

const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
  alertMessage.value = msg
  alertType.value = type
  setTimeout(() => {
    if (alertMessage.value === msg) alertMessage.value = ''
  }, 4000)
}

const loadOrders = async () => {
  isLoading.value = true
  try {
    ordersList.value = await adminService.getOrders()
  } catch (err: any) {
    showAlert('Không thể tải danh sách đơn hàng: ' + (err.message || ''), 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadOrders()
})

const openStatusModal = (order: Order, status: string) => {
  selectedOrder.value = order
  modalAction.value = 'status'
  targetStatus.value = status
  actionReason.value = status === 'completed' ? 'Admin xác nhận đã hoàn tất dịch vụ' : 'Dịch vụ gặp sự cố không thể xử lý'
  isModalOpen.value = true
}

const openRefundModal = (order: Order) => {
  selectedOrder.value = order
  modalAction.value = 'refund'
  actionReason.value = 'Hoàn tiền lại ví cho khách hàng do đơn lỗi'
  isModalOpen.value = true
}

const handleConfirmAction = async () => {
  if (!selectedOrder.value) return
  isSubmitting.value = true
  try {
    if (modalAction.value === 'status') {
      await adminService.updateOrderStatus(selectedOrder.value.id, targetStatus.value, actionReason.value.trim())
      showAlert(`Đã cập nhật trạng thái đơn #${selectedOrder.value.orderCode} thành ${targetStatus.value}!`)
    } else if (modalAction.value === 'refund') {
      await adminService.refundOrder(selectedOrder.value.id, actionReason.value.trim())
      showAlert(`Đã hoàn ${formatVND(selectedOrder.value.finalAmount)} vào ví người dùng thành công!`)
    }
    isModalOpen.value = false
    await loadOrders()
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message || 'Lỗi xử lý đơn'
    showAlert(msg, 'error')
  } finally {
    isSubmitting.value = false
  }
}

// Bulk Action handlers
const openBulkStatusModal = (status: string) => {
  if (selectedOrderIds.value.length === 0) return
  bulkTargetStatus.value = status
  bulkActionReason.value = status === 'completed' ? 'Admin duyệt hoàn thành hàng loạt' : 'Admin báo lỗi hàng loạt'
  isBulkModalOpen.value = true
}

const handleConfirmBulkAction = async () => {
  isSubmitting.value = true
  const ids = [...selectedOrderIds.value]
  const reason = bulkActionReason.value.trim()
  const status = bulkTargetStatus.value

  let successCount = 0
  let failCount = 0

  for (const id of ids) {
    try {
      await adminService.updateOrderStatus(id, status, reason)
      successCount++
    } catch {
      failCount++
    }
  }

  isSubmitting.value = false
  isBulkModalOpen.value = false
  clearSelection()

  if (failCount === 0) {
    showAlert(`Đã cập nhật thành công tất cả ${successCount} đơn hàng!`)
  } else {
    showAlert(`Đã cập nhật ${successCount} đơn thành công, ${failCount} đơn lỗi/không hợp lệ!`, 'error')
  }

  await loadOrders()
}

const handleRetry = async (order: Order) => {
  if (!confirm(`Bạn có chắc muốn gửi lại đơn #${order.orderCode} sang nhà cung cấp?`)) return
  try {
    await adminService.retryOrder(order.id)
    showAlert(`Đã xếp lịch gửi lại đơn #${order.orderCode}!`)
    await loadOrders()
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message || 'Lỗi gửi lại đơn'
    showAlert(msg, 'error')
  }
}
</script>
