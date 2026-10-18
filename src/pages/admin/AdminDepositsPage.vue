<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Lịch Sử Nạp Tiền & Cấu Hình Ngân Hàng</h1>
        <p class="text-sm text-slate-500">Đối soát giao dịch chuyển khoản VietQR và cấu hình tài khoản ngân hàng nhận tiền</p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="openBankModal"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Building2 class="w-4 h-4" /> Cài Đặt Ngân Hàng Nhận
        </button>

        <button
          @click="loadDeposits"
          :disabled="isLoading"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
        >
          <RotateCcw :class="['w-3.5 h-3.5', isLoading && 'animate-spin text-sky-600']" />
          <span>Làm mới</span>
        </button>
      </div>
    </div>

    <!-- Alert notification -->
    <div v-if="alertMessage" :class="['p-4 rounded-xl text-sm flex items-center justify-between', alertType === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200']">
      <span>{{ alertMessage }}</span>
      <button @click="alertMessage = ''" class="font-bold ml-4">✕</button>
    </div>

    <!-- Card thông tin ngân hàng hiện tại -->
    <div class="bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl border border-sky-100 p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
      <div>
        <div class="flex items-center gap-2">
          <Building2 class="w-5 h-5 text-sky-600" />
          <h3 class="font-bold text-slate-800 text-sm">Tài Khoản Ngân Hàng Nhận Tiền Hiện Tại</h3>
        </div>
        <div v-if="currentBank" class="mt-2 text-xs space-y-0.5 text-slate-600">
          <div>Ngân hàng: <strong class="text-slate-800">{{ currentBank.bankCode }}</strong> - Số TK: <strong class="text-slate-800 font-mono">{{ currentBank.accountNumber }}</strong></div>
          <div>Chủ tài khoản: <strong class="text-slate-800 uppercase">{{ currentBank.accountName }}</strong></div>
        </div>
        <div v-else class="mt-1 text-xs text-amber-600 font-medium">
          ⚠️ Chưa cấu hình tài khoản ngân hàng nhận tiền. Khách hàng sẽ không tạo được mã QR nạp!
        </div>
      </div>

      <button
        @click="openBankModal"
        class="text-xs font-semibold text-sky-600 hover:text-sky-700 underline self-start sm:self-auto cursor-pointer"
      >
        {{ currentBank ? 'Thay đổi thông tin' : 'Cấu hình ngay' }}
      </button>
    </div>

    <!-- Thanh Tìm Kiếm & Bộ Lọc Trạng Thái Nạp -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="relative w-full md:w-80">
        <input
          v-model="depositSearchQuery"
          type="text"
          placeholder="Tìm theo mã thanh toán hoặc mã GD..."
          class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs outline-none bg-slate-50/50 font-mono"
        />
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
      </div>

      <div class="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
        <button
          v-for="status in depositStatusFilters"
          :key="status.value"
          @click="currentDepositFilter = status.value"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer',
            currentDepositFilter === status.value
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
          ]"
        >
          {{ status.label }}
          <span
            v-if="status.count !== undefined"
            :class="[
              'ml-1 px-1.5 py-0.2 rounded-full text-[10px]',
              currentDepositFilter === status.value ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'
            ]"
          >
            {{ status.count }}
          </span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
      <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2 text-sky-500" />
      <span>Đang tải danh sách nạp tiền...</span>
    </div>

    <!-- Deposits Table -->
    <div v-else class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div v-if="filteredDeposits.length === 0" class="p-12 text-center text-slate-400">
        <Banknote class="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.2]" />
        <p class="font-medium text-slate-600">Không tìm thấy giao dịch nạp nào</p>
      </div>

      <table v-else class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-slate-500 text-xs border-b border-slate-100">
          <tr>
            <th class="py-3.5 px-6 font-semibold">Mã Thanh Toán</th>
            <th class="py-3.5 px-6 font-semibold">Số Tiền Nạp</th>
            <th class="py-3.5 px-6 font-semibold">Mã GD Ngân Hàng</th>
            <th class="py-3.5 px-6 font-semibold">Thời Gian Tạo</th>
            <th class="py-3.5 px-6 font-semibold">Trạng Thái</th>
            <th class="py-3.5 px-6 font-semibold text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-slate-700">
          <tr v-for="dep in filteredDeposits" :key="dep.id" class="hover:bg-slate-50/50 transition">
            <td class="py-4 px-6 font-mono font-bold text-sky-700">
              {{ dep.paymentCode || dep.orderCode }}
            </td>
            <td class="py-4 px-6 font-bold text-emerald-600">
              +{{ formatVND(dep.amount) }}
            </td>
            <td class="py-4 px-6 font-mono text-xs text-slate-400">
              {{ dep.sepayTransactionId || 'Tự động' }}
            </td>
            <td class="py-4 px-6 text-xs text-slate-400">
              {{ formatDate(dep.createdAt) }}
            </td>
            <td class="py-4 px-6">
              <span
                :class="[
                  'px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5',
                  statusStyles[dep.status] || 'bg-slate-100 text-slate-600'
                ]"
              >
                <span :class="['w-1.5 h-1.5 rounded-full', dep.status === 'completed' ? 'bg-emerald-500' : 'bg-current']"></span>
                {{ statusLabels[dep.status] || dep.status }}
              </span>
            </td>
            <td class="py-4 px-6 text-right">
              <button
                v-if="dep.status === 'pending'"
                @click="openApproveModal(dep)"
                class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
              >
                Duyệt Nạp Tay
              </button>
              <span v-else class="text-xs text-slate-400">Đã xong</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Cấu hình Tài khoản Ngân hàng -->
    <div v-if="isBankModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-800">Cấu Hình Tài Khoản Nhận Tiền</h3>
          <button @click="isBankModalOpen = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
        </div>

        <form @submit.prevent="handleSaveBank" class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Mã ngân hàng (VietQR code) *</label>
            <input
              v-model="bankForm.bankCode"
              type="text"
              required
              placeholder="VD: MB, VCB, TCB, ACB, VPB, ICB..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none font-mono uppercase"
            />
            <span class="text-[11px] text-slate-400 mt-0.5 block">Mã chuẩn ngân hàng để sinh ảnh VietQR (MB, VCB, BIDV, ACB...)</span>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Số tài khoản nhận *</label>
            <input
              v-model="bankForm.accountNumber"
              type="text"
              required
              placeholder="VD: 0987654321"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none font-mono font-bold"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Tên chủ tài khoản *</label>
            <input
              v-model="bankForm.accountName"
              type="text"
              required
              placeholder="VD: NGUYEN VAN A"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none uppercase font-semibold"
            />
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="isBankModalOpen = false"
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
              <span>Lưu Cấu Hình</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Duyệt nạp tiền thủ công -->
    <div v-if="isApproveModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-800">Duyệt Nạp Tiền Thủ Công</h3>
          <button @click="isApproveModalOpen = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
        </div>

        <form @submit.prevent="handleApprove" class="p-6 space-y-4">
          <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
            <div class="font-bold flex items-center gap-1">⚠️ Cảnh báo đối soát:</div>
            <p>Hệ thống sẽ ngay lập tức cộng <strong>{{ formatVND(selectedDeposit?.amount ?? 0) }}</strong> vào ví của người dùng tương ứng.</p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Lý do duyệt thủ công (tối thiểu 5 ký tự) *</label>
            <textarea
              v-model="approveReason"
              rows="3"
              required
              minlength="5"
              placeholder="VD: Khách chuyển đúng tiền nhưng quên ghi nội dung mã nạp..."
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none"
            ></textarea>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="isApproveModalOpen = false"
              class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || approveReason.trim().length < 5"
              class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <span>Xác Nhận Cộng Tiền</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { formatVND, formatDate } from '@/utils/format'
import { Banknote, RotateCcw, Loader2, Building2, Search } from 'lucide-vue-next'
import { adminService } from '@/services/admin.service'

const depositsList = ref<any[]>([])
const currentBank = ref<any | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const alertMessage = ref('')
const alertType = ref<'success' | 'error'>('success')

// Filter & Search
const depositSearchQuery = ref('')
const currentDepositFilter = ref<string>('all')

const depositStatusFilters = computed(() => [
  { label: 'Tất cả', value: 'all', count: depositsList.value.length },
  { label: 'Chờ chuyển khoản', value: 'pending', count: depositsList.value.filter(d => d.status === 'pending').length },
  { label: 'Thành công', value: 'completed', count: depositsList.value.filter(d => d.status === 'completed').length },
  { label: 'Hết hạn', value: 'expired', count: depositsList.value.filter(d => d.status === 'expired').length },
])

const filteredDeposits = computed(() => {
  return depositsList.value.filter((dep) => {
    // 1. Lọc theo trạng thái
    if (currentDepositFilter.value !== 'all') {
      if (dep.status !== currentDepositFilter.value) return false
    }

    // 2. Tìm kiếm theo Mã thanh toán hoặc SePay ID
    if (depositSearchQuery.value.trim()) {
      const q = depositSearchQuery.value.trim().toLowerCase()
      const code = (dep.paymentCode || dep.orderCode || '').toLowerCase()
      const sepayId = String(dep.sepayTransactionId || '').toLowerCase()
      if (!code.includes(q) && !sepayId.includes(q)) return false
    }

    return true
  })
})

// Modal state
const isBankModalOpen = ref(false)
const bankForm = ref({
  bankCode: 'MB',
  accountNumber: '',
  accountName: '',
})

const isApproveModalOpen = ref(false)
const selectedDeposit = ref<any | null>(null)
const approveReason = ref('')

const statusLabels: Record<string, string> = {
  pending: 'Chờ chuyển khoản',
  completed: 'Thành công',
  expired: 'Hết hạn',
  failed: 'Thất bại',
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
  expired: 'bg-slate-100 text-slate-500',
  failed: 'bg-rose-50 text-rose-700',
}

const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
  alertMessage.value = msg
  alertType.value = type
  setTimeout(() => {
    if (alertMessage.value === msg) alertMessage.value = ''
  }, 4000)
}

const loadDeposits = async () => {
  isLoading.value = true
  try {
    const [deps, bank] = await Promise.allSettled([
      adminService.getDeposits(),
      adminService.getBankAccount(),
    ])
    if (deps.status === 'fulfilled') depositsList.value = deps.value
    if (bank.status === 'fulfilled') currentBank.value = bank.value
  } catch (err: any) {
    showAlert('Không thể tải lịch sử nạp: ' + (err.message || ''), 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDeposits()
})

const openBankModal = () => {
  if (currentBank.value) {
    bankForm.value = {
      bankCode: currentBank.value.bankCode,
      accountNumber: currentBank.value.accountNumber,
      accountName: currentBank.value.accountName,
    }
  }
  isBankModalOpen.value = true
}

const handleSaveBank = async () => {
  isSubmitting.value = true
  try {
    currentBank.value = await adminService.updateBankAccount(bankForm.value)
    showAlert('Cập nhật tài khoản ngân hàng nhận tiền thành công!')
    isBankModalOpen.value = false
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message || 'Lỗi lưu cấu hình ngân hàng'
    showAlert(msg, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const openApproveModal = (dep: any) => {
  selectedDeposit.value = dep
  approveReason.value = 'Khách đã chuyển khoản thành công cần duyệt đối soát'
  isApproveModalOpen.value = true
}

const handleApprove = async () => {
  if (!selectedDeposit.value) return
  isSubmitting.value = true
  try {
    await adminService.approveDeposit(selectedDeposit.value.id, approveReason.value.trim())
    showAlert(`Đã duyệt nạp ${formatVND(selectedDeposit.value.amount)} thành công!`)
    isApproveModalOpen.value = false
    await loadDeposits()
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message || 'Lỗi duyệt nạp'
    showAlert(msg, 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>
