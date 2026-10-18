<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Quản Lý Gói Dịch Vụ</h1>
        <p class="text-sm text-slate-500">Cấu hình danh sách sản phẩm và hiển thị trực tiếp lên hệ thống</p>
      </div>

      <button
        @click="openCreateModal"
        class="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-xs transition"
      >
        <Plus class="w-4 h-4" /> Thêm Gói Mới
      </button>
    </div>

    <!-- Error/Notice Alert -->
    <div v-if="alertMessage" :class="['p-4 rounded-xl text-sm flex items-center justify-between', alertType === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200']">
      <span>{{ alertMessage }}</span>
      <button @click="alertMessage = ''" class="font-bold ml-4">✕</button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
      <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2 text-sky-500" />
      <span>Đang tải danh sách gói từ Database...</span>
    </div>

    <!-- Product Table -->
    <div v-else class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div v-if="products.length === 0" class="p-12 text-center text-slate-400">
        <Package class="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.2]" />
        <p class="font-medium text-slate-600">Chưa có gói dịch vụ nào trong Database</p>
        <p class="text-xs text-slate-400 mt-1">Bấm nút "Thêm Gói Mới" ở trên để tạo dịch vụ đầu tiên!</p>
      </div>

      <table v-else class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-slate-500 text-xs border-b border-slate-100">
          <tr>
            <th class="py-3 px-6 font-semibold">Tên Gói</th>
            <th class="py-3 px-6 font-semibold">Slug</th>
            <th class="py-3 px-6 font-semibold">Giá Bán</th>
            <th class="py-3 px-6 font-semibold">Giá Gốc</th>
            <th class="py-3 px-6 font-semibold">Trạng Thái</th>
            <th class="py-3 px-6 font-semibold text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-slate-700">
          <tr v-for="item in products" :key="item.id" class="hover:bg-slate-50/50 transition">
            <td class="py-4 px-6 font-medium text-slate-900">
              {{ item.name }}
              <span v-if="item.description" class="block text-xs text-slate-400 font-normal truncate max-w-xs">{{ item.description }}</span>
            </td>
            <td class="py-4 px-6 font-mono text-xs text-slate-500">{{ item.slug }}</td>
            <td class="py-4 px-6 font-semibold text-sky-600">{{ formatVND(item.price) }}</td>
            <td class="py-4 px-6 text-xs text-slate-400">
              {{ item.originalPrice > item.price ? formatVND(item.originalPrice) : '-' }}
            </td>
            <td class="py-4 px-6">
              <span
                :class="[
                  'px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5',
                  item.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                ]"
              >
                <span :class="['w-1.5 h-1.5 rounded-full', item.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400']"></span>
                {{ item.status === 'active' ? 'Hoạt động' : 'Tạm tắt' }}
              </span>
            </td>
            <td class="py-4 px-6 text-right space-x-3">
              <button @click="openEditModal(item)" class="text-xs text-sky-600 font-medium hover:underline">
                Sửa
              </button>
              <button
                v-if="item.status === 'active'"
                @click="toggleDeactivate(item)"
                class="text-xs text-rose-600 font-medium hover:underline"
              >
                Tắt
              </button>
              <button
                v-else
                @click="toggleActivate(item)"
                class="text-xs text-emerald-600 font-medium hover:underline"
              >
                Bật lại
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create / Edit Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-800">
            {{ isEditing ? 'Chỉnh Sửa Gói Dịch Vụ' : 'Thêm Gói Dịch Vụ Mới' }}
          </h3>
          <button @click="isModalOpen = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
        </div>

        <form @submit.prevent="handleSaveProduct" class="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Tên gói dịch vụ *</label>
            <input
              v-model="form.name"
              type="text"
              required
              @input="onNameChange"
              placeholder="VD: Gói Cơ Bản 100K"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Slug (Đường dẫn tĩnh, không dấu) *</label>
            <input
              v-model="form.slug"
              type="text"
              required
              pattern="^[a-z0-9-]+$"
              placeholder="VD: csuc-co-ban-100k"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none font-mono"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Giá bán (VNĐ) *</label>
              <input
                v-model.number="form.salePriceAmount"
                type="number"
                min="0"
                step="1000"
                required
                placeholder="VD: 99000"
                class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Giá gốc (VNĐ) *</label>
              <input
                v-model.number="form.priceAmount"
                type="number"
                min="0"
                step="1000"
                required
                placeholder="VD: 120000"
                class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Mô tả gói</label>
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="Nhập thông tin giới thiệu gói..."
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none"
            ></textarea>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              v-model="form.isActive"
              class="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
            />
            <label for="isActive" class="text-xs font-medium text-slate-700">Kích hoạt hiển thị cho khách mua ngay</label>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="isModalOpen = false"
              class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <span>{{ isEditing ? 'Lưu Thay Đổi' : 'Tạo Gói Mới' }}</span>
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
import { Plus, Package, Loader2 } from 'lucide-vue-next'
import { adminService, type UpsertProductDTO } from '@/services/admin.service'
import type { Product } from '@/types'

const products = ref<Product[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const isModalOpen = ref(false)
const isEditing = ref(false)
const currentEditId = ref<string | null>(null)

const alertMessage = ref('')
const alertType = ref<'success' | 'error'>('success')

const form = ref<UpsertProductDTO>({
  name: '',
  slug: '',
  description: '',
  priceAmount: 100000,
  salePriceAmount: 90000,
  isActive: true,
  inputSchema: {
    accountId: { label: 'Code Sự kiện', type: 'text', required: true }
  }
})

const fetchProducts = async () => {
  isLoading.value = true
  try {
    products.value = await adminService.getProducts()
  } catch (err: any) {
    showAlert('Không thể tải danh sách sản phẩm từ backend: ' + (err.message || ''), 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchProducts()
})

const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
  alertMessage.value = msg
  alertType.value = type
  setTimeout(() => {
    if (alertMessage.value === msg) alertMessage.value = ''
  }, 4000)
}

const onNameChange = () => {
  if (!isEditing.value) {
    // Tự sinh slug từ tên
    form.value.slug = form.value.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}

const openCreateModal = () => {
  isEditing.value = false
  currentEditId.value = null
  form.value = {
    name: '',
    slug: '',
    description: '',
    priceAmount: 100000,
    salePriceAmount: 90000,
    isActive: true,
    inputSchema: {
      accountId: { label: 'Code Sự kiện', type: 'text', required: true }
    }
  }
  isModalOpen.value = true
}

const openEditModal = (item: Product) => {
  isEditing.value = true
  currentEditId.value = item.id
  form.value = {
    name: item.name,
    slug: item.slug,
    description: item.description || '',
    priceAmount: item.originalPrice,
    salePriceAmount: item.price,
    isActive: item.status === 'active',
  }
  isModalOpen.value = true
}

const handleSaveProduct = async () => {
  if (form.value.salePriceAmount && form.value.priceAmount && form.value.salePriceAmount > form.value.priceAmount) {
    showAlert('Giá bán (khuyến mãi) không được cao hơn giá gốc!', 'error')
    return
  }

  isSubmitting.value = true
  try {
    if (isEditing.value && currentEditId.value) {
      await adminService.updateProduct(currentEditId.value, form.value)
      showAlert('Cập nhật gói dịch vụ thành công!')
    } else {
      await adminService.createProduct(form.value)
      showAlert('Tạo gói dịch vụ mới thành công!')
    }
    isModalOpen.value = false
    await fetchProducts()
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message || 'Thao tác thất bại'
    showAlert(msg, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const toggleDeactivate = async (item: Product) => {
  if (!confirm(`Bạn có chắc muốn tắt gói "${item.name}"?`)) return
  try {
    await adminService.deleteProduct(item.id)
    showAlert(`Đã tắt gói "${item.name}" thành công!`)
    await fetchProducts()
  } catch (err: any) {
    showAlert('Không thể tắt gói: ' + (err.message || ''), 'error')
  }
}

const toggleActivate = async (item: Product) => {
  try {
    await adminService.updateProduct(item.id, { isActive: true })
    showAlert(`Đã kích hoạt lại gói "${item.name}"!`)
    await fetchProducts()
  } catch (err: any) {
    showAlert('Không thể kích hoạt gói: ' + (err.message || ''), 'error')
  }
}
</script>
