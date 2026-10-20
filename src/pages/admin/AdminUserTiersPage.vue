<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Cấu Hình Loại Người Dùng & Giá Bán</h1>
        <p class="text-sm text-slate-500">Phân cấp tài khoản (CTV, Thành viên, Admin) và thiết lập mức giá chiết khấu</p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="loadTiers"
          :disabled="isLoading"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
        >
          <RotateCcw :class="['w-3.5 h-3.5', isLoading && 'animate-spin text-sky-600']" />
          <span>Làm mới</span>
        </button>

        <button
          @click="openCreateModal"
          class="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus class="w-4 h-4" /> Thêm Loại Người Dùng
        </button>
      </div>
    </div>

    <!-- Alert notification -->
    <div v-if="alertMessage" :class="['p-4 rounded-xl text-sm flex items-center justify-between', alertType === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200']">
      <span>{{ alertMessage }}</span>
      <button @click="alertMessage = ''" class="font-bold ml-4">✕</button>
    </div>

    <!-- Quick info cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-purple-100">Quản Trị Viên (Admin)</span>
          <span class="text-lg">👑</span>
        </div>
        <div class="text-2xl font-black mt-2">Giảm 100%</div>
        <p class="text-xs text-purple-100/80 mt-1">Mặc định miễn phí 100% chi phí khi đặt mọi đơn hàng</p>
      </div>

      <div class="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-amber-100">Cộng Tác Viên (CTV)</span>
          <span class="text-lg">⭐</span>
        </div>
        <div class="text-2xl font-black mt-2">
          Giảm {{ tiersList.find(t => t.code === 'ctv')?.discountPercent ?? 10 }}%
        </div>
        <p class="text-xs text-amber-100/80 mt-1">Dành cho đại lý & người chạy số lượng lớn</p>
      </div>

      <div class="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-5 text-white shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-sky-100">Thành Viên Thường</span>
          <span class="text-lg">👤</span>
        </div>
        <div class="text-2xl font-black mt-2">Giá Tiêu Chuẩn</div>
        <p class="text-xs text-sky-100/80 mt-1">Mức giá niêm yết chuẩn của từng gói dịch vụ</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
      <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2 text-sky-500" />
      <span>Đang tải danh sách loại người dùng...</span>
    </div>

    <!-- Tiers Table -->
    <div v-else class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-slate-500 text-xs border-b border-slate-100">
          <tr>
            <th class="py-3.5 px-6 font-semibold">Tên Loại & Mã Định Danh</th>
            <th class="py-3.5 px-6 font-semibold">Mức Giảm Giá (%)</th>
            <th class="py-3.5 px-6 font-semibold">Số Tài Khoản Áp Dụng</th>
            <th class="py-3.5 px-6 font-semibold">Loại Mặc Định</th>
            <th class="py-3.5 px-6 font-semibold">Trạng Thái</th>
            <th class="py-3.5 px-6 font-semibold text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-slate-700">
          <tr v-for="tier in tiersList" :key="tier.id" class="hover:bg-slate-50/50 transition">
            <td class="py-4 px-6">
              <div class="flex items-center gap-2">
                <span class="text-base">{{ tier.code === 'admin' ? '👑' : tier.code === 'ctv' ? '⭐' : '👤' }}</span>
                <div>
                  <div class="font-bold text-slate-900">{{ tier.name }}</div>
                  <div class="text-xs text-slate-400 font-mono">{{ tier.code }}</div>
                </div>
              </div>
              <div v-if="tier.description" class="text-xs text-slate-500 mt-1">
                {{ tier.description }}
              </div>
            </td>
            <td class="py-4 px-6">
              <span
                :class="[
                  'px-3 py-1 rounded-full text-xs font-bold font-mono inline-block',
                  tier.code === 'admin'
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : tier.discountPercent > 0
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600'
                ]"
              >
                Giảm {{ tier.code === 'admin' ? '100' : tier.discountPercent }}%
              </span>
            </td>
            <td class="py-4 px-6 font-bold text-slate-700">
              {{ tier.userCount ?? 0 }} tài khoản
            </td>
            <td class="py-4 px-6">
              <span v-if="tier.isDefault" class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                Mặc định cho tài khoản mới
              </span>
              <span v-else class="text-xs text-slate-400">—</span>
            </td>
            <td class="py-4 px-6">
              <span
                :class="[
                  'px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5',
                  tier.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                ]"
              >
                <span :class="['w-1.5 h-1.5 rounded-full', tier.isActive ? 'bg-emerald-500' : 'bg-slate-400']"></span>
                {{ tier.isActive ? 'Hoạt động' : 'Tạm tắt' }}
              </span>
            </td>
            <td class="py-4 px-6 text-right space-x-2">
              <!-- Nút cấu hình giá riêng theo sản phẩm -->
              <button
                @click="openPricingModal(tier)"
                class="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition cursor-pointer"
              >
                Giá theo gói
              </button>

              <!-- Nút Sửa -->
              <button
                @click="openEditModal(tier)"
                class="px-2.5 py-1 text-xs font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition cursor-pointer"
              >
                Sửa
              </button>

              <!-- Nút Xóa (không xóa được admin hoặc default) -->
              <button
                v-if="tier.code !== 'admin' && !tier.isDefault"
                @click="handleDeleteTier(tier)"
                class="px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition cursor-pointer"
              >
                Xóa
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Thêm / Sửa Loại Người Dùng -->
    <div v-if="isTierModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-800">
            {{ isEditing ? `Chỉnh Sửa Loại "${editingTier?.name}"` : 'Thêm Loại Người Dùng Mới' }}
          </h3>
          <button @click="isTierModalOpen = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
        </div>

        <form @submit.prevent="handleSaveTier" class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Mã Định Danh (Viết thường, không dấu) *</label>
            <input
              v-model="tierForm.code"
              type="text"
              required
              :disabled="isEditing"
              placeholder="VD: ctv_vip, dai_ly_cap1"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none font-mono lowercase disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Tên Hiển Thị *</label>
            <input
              v-model="tierForm.name"
              type="text"
              required
              placeholder="VD: Cộng Tác Viên VIP"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Mức Chiết Khấu Giảm Giá (%) *</label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="tierForm.discountPercent"
                type="number"
                min="0"
                max="100"
                required
                :disabled="tierForm.code === 'admin'"
                placeholder="VD: 15"
                class="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none font-bold"
              />
              <span class="text-sm font-bold text-slate-500">%</span>
            </div>
            <p v-if="tierForm.code === 'admin'" class="text-xs text-purple-600 mt-1">
              * Quản trị viên (Admin) mặc định luôn được giảm giá 100%.
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Mô tả loại người dùng</label>
            <textarea
              v-model="tierForm.description"
              rows="2"
              placeholder="Ghi chú về đối tượng và quyền lợi của loại tài khoản này..."
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none"
            ></textarea>
          </div>

          <div class="space-y-2 pt-1">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="tierForm.isDefault"
                type="checkbox"
                class="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
              />
              <span class="text-xs font-medium text-slate-700">Đặt làm loại mặc định cho tài khoản mới đăng ký</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="tierForm.isActive"
                type="checkbox"
                class="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
              />
              <span class="text-xs font-medium text-slate-700">Kích hoạt hoạt động</span>
            </label>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="isTierModalOpen = false"
              class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <span>{{ isEditing ? 'Lưu Cập Nhật' : 'Tạo Loại Người Dùng' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Cấu Hình Giá Theo Từng Gói Cho Tier -->
    <div v-if="isPricingModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 class="text-lg font-bold text-slate-800">
              Cấu Hình Giá Riêng Theo Gói: {{ activePricingTier?.name }}
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Mức chiết khấu mặc định: <strong>-{{ activePricingTier?.discountPercent }}%</strong>. Nhập giá VNĐ để đặt giá cố định thay vì % giảm.
            </p>
          </div>
          <button @click="isPricingModalOpen = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
        </div>

        <div class="p-6 overflow-y-auto space-y-4 flex-1">
          <div v-if="isLoadingPrices" class="py-12 text-center text-slate-400">
            <Loader2 class="w-7 h-7 animate-spin mx-auto mb-2 text-sky-500" />
            <span>Đang tải danh sách gói sản phẩm...</span>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="prod in tierProducts"
              :key="prod.productId"
              class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div class="font-bold text-slate-800 text-sm">{{ prod.productName }}</div>
                <div class="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>Giá gốc: {{ formatVND(prod.originalPrice) }}</span>
                  <span v-if="prod.salePrice" class="text-sky-600 font-medium">Sale: {{ formatVND(prod.salePrice) }}</span>
                  <span class="text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.2 rounded">
                    Theo %: {{ formatVND(calculatePercentPrice(prod.salePrice || prod.originalPrice, activePricingTier?.discountPercent || 0)) }}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-2 w-full sm:w-64">
                <input
                  v-model.number="priceInputs[prod.productId]"
                  type="number"
                  step="1000"
                  min="0"
                  placeholder="Theo % của loại"
                  class="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs outline-none bg-white font-bold"
                />
                <button
                  @click="saveProductPrice(prod.productId)"
                  :disabled="isSavingPrice[prod.productId]"
                  class="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1"
                >
                  <Loader2 v-if="isSavingPrice[prod.productId]" class="w-3 h-3 animate-spin" />
                  <span>Lưu</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            @click="isPricingModalOpen = false"
            class="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { formatVND } from '@/utils/format'
import { Plus, RotateCcw, Loader2 } from 'lucide-vue-next'
import { adminService } from '@/services/admin.service'
import type { UserTier, TierProductPrice } from '@/types'

const tiersList = ref<UserTier[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const alertMessage = ref('')
const alertType = ref<'success' | 'error'>('success')

// Modal Tier Create/Edit
const isTierModalOpen = ref(false)
const isEditing = ref(false)
const editingTier = ref<UserTier | null>(null)
const tierForm = ref<{
  code: string
  name: string
  discountPercent: number
  description: string
  isDefault: boolean
  isActive: boolean
}>({
  code: '',
  name: '',
  discountPercent: 10,
  description: '',
  isDefault: false,
  isActive: true,
})

// Modal Pricing per Product
const isPricingModalOpen = ref(false)
const activePricingTier = ref<UserTier | null>(null)
const tierProducts = ref<TierProductPrice[]>([])
const isLoadingPrices = ref(false)
const priceInputs = ref<Record<string, number | null>>({})
const isSavingPrice = ref<Record<string, boolean>>({})

const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
  alertMessage.value = msg
  alertType.value = type
  setTimeout(() => {
    if (alertMessage.value === msg) alertMessage.value = ''
  }, 4000)
}

const loadTiers = async () => {
  isLoading.value = true
  try {
    tiersList.value = await adminService.getUserTiers()
  } catch (err: any) {
    showAlert('Không thể tải danh sách loại người dùng: ' + (err.message || ''), 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadTiers()
})

const openCreateModal = () => {
  isEditing.value = false
  editingTier.value = null
  tierForm.value = {
    code: '',
    name: '',
    discountPercent: 10,
    description: '',
    isDefault: false,
    isActive: true,
  }
  isTierModalOpen.value = true
}

const openEditModal = (tier: UserTier) => {
  isEditing.value = true
  editingTier.value = tier
  tierForm.value = {
    code: tier.code,
    name: tier.name,
    discountPercent: tier.discountPercent,
    description: tier.description || '',
    isDefault: tier.isDefault,
    isActive: tier.isActive,
  }
  isTierModalOpen.value = true
}

const handleSaveTier = async () => {
  isSubmitting.value = true
  try {
    if (isEditing.value && editingTier.value) {
      await adminService.updateUserTier(editingTier.value.id, {
        name: tierForm.value.name.trim(),
        discountPercent: tierForm.value.discountPercent,
        description: tierForm.value.description.trim() || null,
        isDefault: tierForm.value.isDefault,
        isActive: tierForm.value.isActive,
      })
      showAlert(`Đã cập nhật loại người dùng "${tierForm.value.name}" thành công!`)
    } else {
      await adminService.createUserTier({
        code: tierForm.value.code.trim().toLowerCase(),
        name: tierForm.value.name.trim(),
        discountPercent: tierForm.value.discountPercent,
        description: tierForm.value.description.trim() || null,
        isDefault: tierForm.value.isDefault,
        isActive: tierForm.value.isActive,
      })
      showAlert(`Đã tạo loại người dùng "${tierForm.value.name}" thành công!`)
    }

    isTierModalOpen.value = false
    await loadTiers()
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message || 'Lỗi lưu loại người dùng'
    showAlert(msg, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const handleDeleteTier = async (tier: UserTier) => {
  if (!confirm(`Bạn có chắc muốn xóa loại người dùng "${tier.name}"? Các tài khoản đang thuộc loại này sẽ được chuyển về loại mặc định.`)) return

  try {
    await adminService.deleteUserTier(tier.id)
    showAlert(`Đã xóa loại người dùng "${tier.name}" thành công!`)
    await loadTiers()
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message || 'Lỗi xóa loại người dùng'
    showAlert(msg, 'error')
  }
}

// Pricing per Product methods
const openPricingModal = async (tier: UserTier) => {
  activePricingTier.value = tier
  isPricingModalOpen.value = true
  isLoadingPrices.value = true
  priceInputs.value = {}

  try {
    const res = await adminService.getTierPrices(tier.id)
    tierProducts.value = res.products
    for (const p of res.products) {
      priceInputs.value[p.productId] = p.customPrice
    }
  } catch (err: any) {
    showAlert('Không thể tải giá sản phẩm: ' + (err.message || ''), 'error')
  } finally {
    isLoadingPrices.value = false
  }
}

const calculatePercentPrice = (basePrice: number, discountPercent: number) => {
  if (discountPercent >= 100) return 0
  return Math.max(0, Math.round(basePrice * (100 - discountPercent) / 100))
}

const saveProductPrice = async (productId: string) => {
  if (!activePricingTier.value) return
  isSavingPrice.value[productId] = true

  try {
    const customPrice = priceInputs.value[productId] !== undefined && priceInputs.value[productId] !== null && String(priceInputs.value[productId]).trim() !== ''
      ? Number(priceInputs.value[productId])
      : null

    await adminService.setTierProductPrice(activePricingTier.value.id, productId, customPrice)
    showAlert('Đã lưu giá tùy chỉnh thành công!')
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message || 'Lỗi lưu giá'
    showAlert(msg, 'error')
  } finally {
    isSavingPrice.value[productId] = false
  }
}
</script>
