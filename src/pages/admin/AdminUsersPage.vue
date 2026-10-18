<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Quản Lý Người Dùng</h1>
        <p class="text-sm text-slate-500">Danh sách tài khoản khách hàng, cộng/trừ số dư ví và phân quyền</p>
      </div>

      <button
        @click="loadUsers"
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

    <!-- Search & Filter bar -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="relative w-full md:w-80">
        <input
          v-model="userSearchQuery"
          type="text"
          placeholder="Tìm theo email hoặc họ tên..."
          class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs outline-none bg-slate-50/50"
        />
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
      </div>

      <div class="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
        <button
          v-for="role in roleFilters"
          :key="role.value"
          @click="currentRoleFilter = role.value"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer',
            currentRoleFilter === role.value
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
          ]"
        >
          {{ role.label }}
          <span
            v-if="role.count !== undefined"
            :class="[
              'ml-1 px-1.5 py-0.2 rounded-full text-[10px]',
              currentRoleFilter === role.value ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'
            ]"
          >
            {{ role.count }}
          </span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
      <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2 text-sky-500" />
      <span>Đang tải danh sách người dùng...</span>
    </div>

    <!-- Users Table -->
    <div v-else class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div v-if="filteredUsers.length === 0" class="p-12 text-center text-slate-400">
        <Users class="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.2]" />
        <p class="font-medium text-slate-600">Không tìm thấy người dùng nào phù hợp</p>
      </div>

      <table v-else class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-slate-500 text-xs border-b border-slate-100">
          <tr>
            <th class="py-3.5 px-6 font-semibold">Tên & Email</th>
            <th class="py-3.5 px-6 font-semibold">Vai Trò</th>
            <th class="py-3.5 px-6 font-semibold">Số Dư Ví</th>
            <th class="py-3.5 px-6 font-semibold">Ngày Tạo</th>
            <th class="py-3.5 px-6 font-semibold">Trạng Thái</th>
            <th class="py-3.5 px-6 font-semibold text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-slate-700">
          <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-slate-50/50 transition">
            <td class="py-4 px-6">
              <div class="font-medium text-slate-900">{{ user.name || 'Chưa đặt tên' }}</div>
              <div class="text-xs text-slate-400 font-mono">{{ user.email }}</div>
            </td>
            <td class="py-4 px-6">
              <span
                :class="[
                  'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                  user.role === 'admin' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-slate-100 text-slate-600'
                ]"
              >
                {{ user.role === 'admin' ? '👑 Quản Trị Viên' : 'Khách Hàng' }}
              </span>
            </td>
            <td class="py-4 px-6 font-bold text-sky-600">
              {{ formatVND(user.balance ?? 0) }}
            </td>
            <td class="py-4 px-6 text-xs text-slate-400">
              {{ formatDate(user.createdAt) }}
            </td>
            <td class="py-4 px-6">
              <span
                :class="[
                  'px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5',
                  user.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                ]"
              >
                <span :class="['w-1.5 h-1.5 rounded-full', user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500']"></span>
                {{ user.status === 'active' ? 'Hoạt động' : 'Đã khóa' }}
              </span>
            </td>
            <td class="py-4 px-6 text-right space-x-3">
              <!-- Nút cộng/trừ tiền ví -->
              <button
                @click="openBalanceModal(user)"
                class="text-xs text-emerald-600 hover:text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle class="w-3.5 h-3.5" /> Chỉnh số dư
              </button>

              <!-- Đổi vai trò -->
              <button
                v-if="user.role === 'customer'"
                @click="toggleRole(user, 'admin')"
                class="text-xs text-sky-600 font-medium hover:underline cursor-pointer"
              >
                Thăng Admin
              </button>
              <button
                v-else
                @click="toggleRole(user, 'customer')"
                class="text-xs text-slate-500 font-medium hover:underline cursor-pointer"
              >
                Hạ Khách
              </button>

              <!-- Khóa / Mở khóa -->
              <button
                v-if="user.status === 'active'"
                @click="toggleStatus(user, 'blocked')"
                class="text-xs text-rose-600 font-medium hover:underline cursor-pointer"
              >
                Khóa
              </button>
              <button
                v-else
                @click="toggleStatus(user, 'active')"
                class="text-xs text-emerald-600 font-medium hover:underline cursor-pointer"
              >
                Mở khóa
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Điều chỉnh số dư ví -->
    <div v-if="isBalanceModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-800">Điều Chỉnh Số Dư Ví</h3>
            <p class="text-xs text-slate-400 mt-0.5">Tài khoản: {{ targetUser?.email }}</p>
          </div>
          <button @click="isBalanceModalOpen = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
        </div>

        <form @submit.prevent="handleAdjustBalance" class="p-6 space-y-4">
          <!-- Số dư hiện tại -->
          <div class="p-3 bg-sky-50 rounded-xl border border-sky-100 flex justify-between items-center text-sm">
            <span class="text-slate-500">Số dư hiện tại:</span>
            <span class="font-bold text-sky-700">{{ formatVND(targetUser?.balance ?? 0) }}</span>
          </div>

          <!-- Loại điều chỉnh -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1.5">Loại thao tác</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="adjustType = 'credit'"
                :class="[
                  'py-2 px-3 text-xs font-semibold rounded-xl border transition text-center cursor-pointer',
                  adjustType === 'credit' ? 'bg-emerald-50 text-emerald-700 border-emerald-500' : 'border-slate-200 text-slate-600'
                ]"
              >
                ➕ Cộng Thêm Tiền
              </button>
              <button
                type="button"
                @click="adjustType = 'debit'"
                :class="[
                  'py-2 px-3 text-xs font-semibold rounded-xl border transition text-center cursor-pointer',
                  adjustType === 'debit' ? 'bg-rose-50 text-rose-700 border-rose-500' : 'border-slate-200 text-slate-600'
                ]"
              >
                ➖ Trừ Bớt Tiền
              </button>
            </div>
          </div>

          <!-- Nhập số tiền -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Số tiền (VNĐ) *</label>
            <input
              v-model.number="adjustAmount"
              type="number"
              min="1000"
              step="1000"
              required
              placeholder="VD: 50000"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none font-bold"
            />
          </div>

          <!-- Lý do -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Lý do điều chỉnh (lưu sổ giao dịch) *</label>
            <input
              v-model="adjustReason"
              type="text"
              required
              placeholder="VD: Nạp bù sự kiện, hoàn tiền giao dịch..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none"
            />
          </div>

          <!-- Xem trước số dư sau điều chỉnh -->
          <div class="pt-2 flex justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>Dự kiến sau điều chỉnh:</span>
            <span class="font-bold text-slate-800">{{ formatVND(predictedBalance) }}</span>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="isBalanceModalOpen = false"
              class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || adjustAmount <= 0"
              class="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <span>Xác Nhận Cập Nhật</span>
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
import { Users, RotateCcw, Loader2, PlusCircle, Search } from 'lucide-vue-next'
import { adminService, type AdminUserListItem } from '@/services/admin.service'

const usersList = ref<AdminUserListItem[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const alertMessage = ref('')
const alertType = ref<'success' | 'error'>('success')

// Filter & Search
const userSearchQuery = ref('')
const currentRoleFilter = ref<string>('all')

const roleFilters = computed(() => [
  { label: 'Tất cả', value: 'all', count: usersList.value.length },
  { label: 'Khách hàng', value: 'customer', count: usersList.value.filter(u => u.role === 'customer').length },
  { label: 'Admin', value: 'admin', count: usersList.value.filter(u => u.role === 'admin').length },
  { label: 'Đã khóa', value: 'blocked', count: usersList.value.filter(u => u.status === 'blocked').length },
])

const filteredUsers = computed(() => {
  return usersList.value.filter((user) => {
    // Lọc theo role hoặc status
    if (currentRoleFilter.value === 'blocked') {
      if (user.status !== 'blocked') return false
    } else if (currentRoleFilter.value !== 'all') {
      if (user.role !== currentRoleFilter.value) return false
    }

    // Tìm kiếm
    if (userSearchQuery.value.trim()) {
      const q = userSearchQuery.value.trim().toLowerCase()
      const matchEmail = user.email?.toLowerCase().includes(q)
      const matchName = user.name?.toLowerCase().includes(q)
      if (!matchEmail && !matchName) return false
    }

    return true
  })
})

// Modal State
const isBalanceModalOpen = ref(false)
const targetUser = ref<AdminUserListItem | null>(null)
const adjustType = ref<'credit' | 'debit'>('credit')
const adjustAmount = ref<number>(50000)
const adjustReason = ref('')

const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
  alertMessage.value = msg
  alertType.value = type
  setTimeout(() => {
    if (alertMessage.value === msg) alertMessage.value = ''
  }, 4000)
}

const loadUsers = async () => {
  isLoading.value = true
  try {
    usersList.value = await adminService.getUsers()
  } catch (err: any) {
    showAlert('Không thể tải danh sách người dùng: ' + (err.message || ''), 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadUsers()
})

const predictedBalance = computed(() => {
  const current = targetUser.value?.balance ?? 0
  const amt = adjustAmount.value || 0
  return adjustType.value === 'credit' ? current + amt : current - amt
})

const openBalanceModal = (user: AdminUserListItem) => {
  targetUser.value = user
  adjustType.value = 'credit'
  adjustAmount.value = 50000
  adjustReason.value = 'Admin nạp điều chỉnh thủ công'
  isBalanceModalOpen.value = true
}

const handleAdjustBalance = async () => {
  if (!targetUser.value) return
  if (predictedBalance.value < 0) {
    showAlert('Số dư sau khi trừ không thể âm!', 'error')
    return
  }

  isSubmitting.value = true
  try {
    const finalAmount = adjustType.value === 'credit' ? adjustAmount.value : -adjustAmount.value
    await adminService.adjustUserBalance(targetUser.value.id, finalAmount, adjustReason.value.trim())

    showAlert(`Đã ${adjustType.value === 'credit' ? 'cộng' : 'trừ'} ${formatVND(adjustAmount.value)} cho tài khoản ${targetUser.value.email} thành công!`)
    isBalanceModalOpen.value = false
    await loadUsers()
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message || 'Lỗi điều chỉnh số dư'
    showAlert(msg, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const toggleRole = async (user: AdminUserListItem, newRole: 'customer' | 'admin') => {
  const confirmMsg = newRole === 'admin'
    ? `Bạn có chắc muốn thăng cấp tài khoản "${user.email}" thành Quản trị viên?`
    : `Bạn có chắc muốn hạ tài khoản "${user.email}" xuống làm Khách hàng?`

  if (!confirm(confirmMsg)) return

  try {
    await adminService.updateUser(user.id, { role: newRole })
    showAlert(`Đã cập nhật quyền tài khoản "${user.email}" thành ${newRole}!`)
    await loadUsers()
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message || 'Lỗi thao tác'
    showAlert(msg, 'error')
  }
}

const toggleStatus = async (user: AdminUserListItem, newStatus: 'active' | 'blocked') => {
  const actionText = newStatus === 'blocked' ? 'khóa' : 'mở khóa'
  if (!confirm(`Bạn có chắc muốn ${actionText} tài khoản "${user.email}"?`)) return

  try {
    await adminService.updateUser(user.id, { status: newStatus })
    showAlert(`Đã ${actionText} tài khoản "${user.email}" thành công!`)
    await loadUsers()
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message || 'Lỗi thao tác'
    showAlert(msg, 'error')
  }
}
</script>
