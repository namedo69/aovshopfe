<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Quản Lý Mã Giảm Giá (Vouchers)</h1>
        <p class="text-sm text-slate-500">Tạo mã ưu đãi, thiết lập mức giảm giá và giới hạn lượt dùng</p>
      </div>

      <button
        @click="openCreateModal"
        class="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
      >
        <Plus class="w-4 h-4" /> Tạo Mã Giảm Giá
      </button>
    </div>

    <!-- Alert notification -->
    <div v-if="alertMessage" :class="['p-4 rounded-xl text-sm flex items-center justify-between', alertType === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200']">
      <span>{{ alertMessage }}</span>
      <button @click="alertMessage = ''" class="font-bold ml-4">✕</button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
      <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2 text-sky-500" />
      <span>Đang tải danh sách voucher...</span>
    </div>

    <!-- Vouchers Table -->
    <div v-else class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div v-if="vouchersList.length === 0" class="p-12 text-center text-slate-400">
        <TicketPercent class="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.2]" />
        <p class="font-medium text-slate-600">Chưa có mã giảm giá nào</p>
        <p class="text-xs text-slate-400 mt-1">Bấm "Tạo Mã Giảm Giá" để tạo mã ưu đãi đầu tiên</p>
      </div>

      <table v-else class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-slate-500 text-xs border-b border-slate-100">
          <tr>
            <th class="py-3.5 px-6 font-semibold">Mã Voucher</th>
            <th class="py-3.5 px-6 font-semibold">Loại & Mức Giảm</th>
            <th class="py-3.5 px-6 font-semibold">Đơn Tối Thiểu</th>
            <th class="py-3.5 px-6 font-semibold">Đã Dùng / Giới Hạn</th>
            <th class="py-3.5 px-6 font-semibold">Trạng Thái</th>
            <th class="py-3.5 px-6 font-semibold text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-slate-700">
          <tr v-for="v in vouchersList" :key="v.id" class="hover:bg-slate-50/50 transition">
            <td class="py-4 px-6 font-mono font-bold text-sky-700">
              {{ v.code }}
            </td>
            <td class="py-4 px-6 font-semibold text-emerald-600">
              <span v-if="v.type === 'percent'">Giảm {{ v.valuePercent }}%</span>
              <span v-else>Giảm {{ formatVND(v.valueAmount || 0) }}</span>
            </td>
            <td class="py-4 px-6 text-xs text-slate-600">
              {{ formatVND(v.minOrderAmount || 0) }}
            </td>
            <td class="py-4 px-6 text-xs text-slate-600">
              <span class="font-bold text-slate-800">{{ v.usedCount || 0 }}</span> /
              <span>{{ v.totalUsageLimit ? v.totalUsageLimit : '∞' }}</span>
            </td>
            <td class="py-4 px-6">
              <span
                :class="[
                  'px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5',
                  v.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                ]"
              >
                <span :class="['w-1.5 h-1.5 rounded-full', v.isActive ? 'bg-emerald-500' : 'bg-slate-400']"></span>
                {{ v.isActive ? 'Đang bật' : 'Tạm tắt' }}
              </span>
            </td>
            <td class="py-4 px-6 text-right space-x-2">
              <button
                @click="openEditModal(v)"
                class="px-2.5 py-1 text-xs font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition cursor-pointer"
              >
                Sửa thông tin
              </button>
              <button
                @click="toggleVoucherStatus(v)"
                :class="[
                  'px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer',
                  v.isActive ? 'text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100' : 'text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                ]"
              >
                {{ v.isActive ? 'Tắt mã' : 'Bật lại' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Tạo / Sửa Voucher -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-800">
            {{ isEditing ? `Chỉnh Sửa Mã Giảm Giá "${editingVoucherCode}"` : 'Tạo Mã Giảm Giá Mới' }}
          </h3>
          <button @click="isModalOpen = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
        </div>

        <form @submit.prevent="handleSaveVoucher" class="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Mã Voucher (Viết hoa, không dấu) *</label>
            <input
              v-model="form.code"
              type="text"
              required
              placeholder="VD: CHAOBANMOI"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none font-mono uppercase"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1.5">Loại giảm giá</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="form.type = 'fixed'"
                :class="[
                  'py-2 px-3 text-xs font-semibold rounded-xl border transition text-center cursor-pointer',
                  form.type === 'fixed' ? 'bg-sky-50 text-sky-700 border-sky-500' : 'border-slate-200 text-slate-600'
                ]"
              >
                Số tiền cố định (VNĐ)
              </button>
              <button
                type="button"
                @click="form.type = 'percent'"
                :class="[
                  'py-2 px-3 text-xs font-semibold rounded-xl border transition text-center cursor-pointer',
                  form.type === 'percent' ? 'bg-sky-50 text-sky-700 border-sky-500' : 'border-slate-200 text-slate-600'
                ]"
              >
                Theo phần trăm (%)
              </button>
            </div>
          </div>

          <!-- Mức giảm -->
          <div v-if="form.type === 'fixed'">
            <label class="block text-xs font-semibold text-slate-700 mb-1">Số tiền giảm (VNĐ) *</label>
            <input
              v-model.number="form.valueAmount"
              type="number"
              min="1000"
              step="1000"
              required
              placeholder="VD: 20000"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none"
            />
          </div>
          <div v-else class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Tỷ lệ giảm (%) *</label>
              <input
                v-model.number="form.valuePercent"
                type="number"
                min="1"
                max="100"
                required
                placeholder="VD: 15"
                class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Giảm tối đa (VNĐ)</label>
              <input
                v-model.number="form.maxDiscountAmount"
                type="number"
                min="0"
                step="1000"
                placeholder="VD: 50000"
                class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Đơn tối thiểu (VNĐ)</label>
              <input
                v-model.number="form.minOrderAmount"
                type="number"
                min="0"
                step="1000"
                placeholder="VD: 50000"
                class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Tổng lượt dùng</label>
              <input
                v-model.number="form.totalUsageLimit"
                type="number"
                min="1"
                placeholder="Bỏ trống = Không giới hạn"
                class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none"
              />
            </div>
          </div>

          <!-- Trạng thái hoạt động -->
          <div class="pt-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.isActive"
                type="checkbox"
                class="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
              />
              <span class="text-xs font-semibold text-slate-700">Kích hoạt voucher ngay (Bật / Tắt)</span>
            </label>
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
              :disabled="isSubmitting"
              class="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <span>{{ isEditing ? 'Lưu Thay Đổi' : 'Tạo Mã Giảm Giá' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { formatVND } from '@/utils/format'
import { TicketPercent, Plus, Loader2 } from 'lucide-vue-next'
import { adminService } from '@/services/admin.service'

const vouchersList = ref<any[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const alertMessage = ref('')
const alertType = ref<'success' | 'error'>('success')

// Modal state
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingVoucherId = ref<string | null>(null)
const editingVoucherCode = ref('')

const form = ref<{
  code: string
  type: 'fixed' | 'percent'
  valueAmount?: number
  valuePercent?: number
  maxDiscountAmount?: number
  minOrderAmount: number
  totalUsageLimit?: number
  isActive: boolean
}>({
  code: '',
  type: 'fixed',
  valueAmount: 20000,
  minOrderAmount: 0,
  isActive: true,
})

const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
  alertMessage.value = msg
  alertType.value = type
  setTimeout(() => {
    if (alertMessage.value === msg) alertMessage.value = ''
  }, 4000)
}

const loadVouchers = async () => {
  isLoading.value = true
  try {
    vouchersList.value = await adminService.getVouchers()
  } catch (err: any) {
    showAlert('Không thể tải danh sách voucher: ' + (err.message || ''), 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadVouchers()
})

const openCreateModal = () => {
  isEditing.value = false
  editingVoucherId.value = null
  editingVoucherCode.value = ''
  form.value = {
    code: '',
    type: 'fixed',
    valueAmount: 20000,
    minOrderAmount: 0,
    isActive: true,
  }
  isModalOpen.value = true
}

const openEditModal = (v: any) => {
  isEditing.value = true
  editingVoucherId.value = v.id
  editingVoucherCode.value = v.code
  form.value = {
    code: v.code,
    type: v.type,
    valueAmount: v.valueAmount || 20000,
    valuePercent: v.valuePercent || 10,
    maxDiscountAmount: v.maxDiscountAmount || undefined,
    minOrderAmount: v.minOrderAmount || 0,
    totalUsageLimit: v.totalUsageLimit || undefined,
    isActive: v.isActive !== false,
  }
  isModalOpen.value = true
}

const handleSaveVoucher = async () => {
  isSubmitting.value = true
  try {
    const payload: any = {
      code: form.value.code.trim().toUpperCase(),
      type: form.value.type,
      minOrderAmount: form.value.minOrderAmount || 0,
      totalUsageLimit: form.value.totalUsageLimit || null,
      isActive: form.value.isActive,
    }

    if (form.value.type === 'fixed') {
      payload.valueAmount = form.value.valueAmount
      payload.valuePercent = null
      payload.maxDiscountAmount = null
    } else {
      payload.valuePercent = form.value.valuePercent
      payload.maxDiscountAmount = form.value.maxDiscountAmount || null
      payload.valueAmount = null
    }

    if (isEditing.value && editingVoucherId.value) {
      await adminService.updateVoucher(editingVoucherId.value, payload)
      showAlert(`Đã cập nhật mã giảm giá ${payload.code} thành công!`)
    } else {
      payload.productIds = []
      await adminService.createVoucher(payload)
      showAlert(`Đã tạo thành công mã giảm giá ${payload.code}!`)
    }

    isModalOpen.value = false
    await loadVouchers()
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message || 'Lỗi lưu voucher'
    showAlert(msg, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const toggleVoucherStatus = async (v: any) => {
  const newStatus = !v.isActive
  try {
    await adminService.updateVoucher(v.id, { isActive: newStatus })
    showAlert(`Đã ${newStatus ? 'bật' : 'tắt'} voucher ${v.code}!`)
    await loadVouchers()
  } catch (err: any) {
    showAlert('Không thể đổi trạng thái voucher: ' + (err.message || ''), 'error')
  }
}
</script>
