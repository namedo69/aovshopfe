<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="mb-6">
      <router-link to="/products" class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-sky-600 transition">
        <ArrowLeft class="w-4 h-4" /> Quay lại danh sách gói
      </router-link>
    </div>

    <div v-if="product" class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Info Left -->
      <div class="md:col-span-1 space-y-4">
        <div class="bg-white rounded-2xl border border-sky-100 p-6 shadow-xs">
          <span class="text-xs font-semibold px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-100">
            {{ product.category }}
          </span>
          <h1 class="text-xl font-bold text-slate-900 mt-3">{{ product.name }}</h1>
          <div class="mt-4">
            <span class="text-xs text-slate-400 block line-through" v-if="product.originalPrice > product.price">
              {{ formatVND(product.originalPrice) }}
            </span>
            <span class="text-2xl font-black text-sky-600">{{ formatVND(product.price) }}</span>
            <span class="text-xs text-slate-400 block mt-0.5">/ 1 Code Sự kiện</span>
          </div>
          <p class="text-xs text-slate-500 mt-4 leading-relaxed">
            {{ product.description }}
          </p>
        </div>

        <div class="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs text-sky-800 space-y-2">
          <div class="flex items-center gap-2 font-semibold">
            <ShieldCheck class="w-4 h-4 text-sky-600" /> Thanh toán 1 lần - Tách đơn tự động
          </div>
          <p>Bạn có thể nhập nhiều Code Sự kiện cùng lúc. Mỗi code sẽ được hệ thống tạo thành 1 đơn hàng riêng biệt để dễ theo dõi tiến độ hoàn thành.</p>
        </div>
      </div>

      <!-- Dynamic Form Right -->
      <div class="md:col-span-2">
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-slate-800">Nhập Danh Sách Code Sự Kiện</h2>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-100 text-sky-700">
              Tổng cộng: {{ eventCodes.length }} code
            </span>
          </div>

          <form @submit.prevent="proceedToCheckout" class="space-y-4">
            <!-- Danh sách từng ô input cho mỗi code -->
            <div class="space-y-3">
              <label class="block text-xs font-semibold text-slate-700">
                Code Sự Kiện (1 code / 1 ô) <span class="text-rose-500">*</span>
              </label>

              <div
                v-for="(_, index) in eventCodes"
                :key="index"
                class="flex items-center gap-2"
              >
                <div class="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0 border border-sky-200">
                  #{{ index + 1 }}
                </div>
                <input
                  v-model="eventCodes[index]"
                  type="text"
                  required
                  :placeholder="`Nhập mã code sự kiện thứ ${index + 1}...`"
                  class="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none font-mono"
                />
                <!-- Nút xóa code (nếu có từ 2 code trở lên) -->
                <button
                  v-if="eventCodes.length > 1"
                  type="button"
                  @click="removeCodeField(index)"
                  class="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                  title="Xóa ô này"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>

              <!-- Nút Thêm ô Code -->
              <div class="pt-1">
                <button
                  type="button"
                  @click="addCodeField"
                  class="flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3.5 py-2 rounded-xl border border-sky-200 transition cursor-pointer"
                >
                  <Plus class="w-4 h-4" /> Thêm Code Sự Kiện Khác
                </button>
              </div>
            </div>

            <!-- Customer Note -->
            <div class="pt-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">Ghi chú cho đơn hàng (nếu có)</label>
              <textarea
                v-model="customerNote"
                rows="2"
                placeholder="Ghi chú thêm nếu cần thiết..."
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none"
              ></textarea>
            </div>

            <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span class="text-xs text-slate-400 block">Tổng tiền ({{ eventCodes.length }} code)</span>
                <span class="text-2xl font-black text-sky-600">{{ formatVND(totalPrice) }}</span>
              </div>

              <button
                type="submit"
                class="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-md shadow-sky-500/20 transition hover:shadow-lg cursor-pointer"
              >
                Tiếp tục thanh toán ({{ eventCodes.length }} đơn)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatVND } from '@/utils/format'
import { ArrowLeft, ShieldCheck, Plus, Trash2 } from 'lucide-vue-next'
import { productService } from '@/services/product.service'
import type { Product } from '@/types'

const route = useRoute()
const router = useRouter()

const product = ref<Product | null>(null)
// Mảng lưu danh sách code, mặc định có 1 ô
const eventCodes = ref<string[]>([''])
const customerNote = ref('')

const totalPrice = computed(() => {
  if (!product.value) return 0
  return product.value.price * eventCodes.value.length
})

onMounted(async () => {
  const slug = route.params.slug as string
  try {
    const data = await productService.getProductBySlug(slug)
    if (data) {
      product.value = data
      return
    }
  } catch (err) {
    console.warn('Cannot load product from API, using fallback data:', err)
  }

  // Fallback ban đầu
  product.value = {
    id: '1',
    name: 'Gói Dịch Vụ',
    slug,
    category: 'Gói Phổ Biến',
    description: 'Xử lý tự động nhanh chóng.',
    originalPrice: 120000,
    price: 99000,
    status: 'active',
    inputSchema: [
      { name: 'accountId', label: 'Code Sự kiện', type: 'text', required: true, placeholder: 'Dán mã code sự kiện tại đây' }
    ]
  }
})

const addCodeField = () => {
  eventCodes.value.push('')
}

const removeCodeField = (index: number) => {
  if (eventCodes.value.length > 1) {
    eventCodes.value.splice(index, 1)
  }
}

const proceedToCheckout = () => {
  // Lọc lấy các code đã nhập hợp lệ
  const validCodes = eventCodes.value.map(c => c.trim()).filter(Boolean)
  if (validCodes.length === 0) {
    alert('Vui lòng nhập ít nhất một Code Sự kiện!')
    return
  }

  // Lưu giỏ hàng tạm thời với danh sách codes
  sessionStorage.setItem('checkout_draft', JSON.stringify({
    product: product.value,
    codes: validCodes,
    customerNote: customerNote.value,
  }))
  router.push('/checkout')
}
</script>
