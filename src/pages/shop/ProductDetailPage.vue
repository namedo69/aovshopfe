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
          </div>
          <p class="text-xs text-slate-500 mt-4 leading-relaxed">
            {{ product.description }}
          </p>
        </div>

        <div class="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs text-sky-800 space-y-2">
          <div class="flex items-center gap-2 font-semibold">
            <ShieldCheck class="w-4 h-4 text-sky-600" /> Cam kết dịch vụ
          </div>
          <p>Hệ thống tự động kích hoạt ngay khi bạn xác nhận thanh toán thành công bằng số dư ví.</p>
        </div>
      </div>

      <!-- Dynamic Form Right -->
      <div class="md:col-span-2">
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h2 class="text-lg font-bold text-slate-800 mb-4">Thông Tin Nhận Gói</h2>

          <form @submit.prevent="proceedToCheckout" class="space-y-4">
            <!-- Render schema fields dynamically -->
            <div v-for="field in product.inputSchema" :key="field.name">
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ field.label }} <span v-if="field.required" class="text-rose-500">*</span>
              </label>

              <!-- Text Input -->
              <input
                v-if="field.type === 'text'"
                v-model="formData[field.name]"
                type="text"
                :required="field.required"
                :placeholder="field.placeholder || ''"
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-sm outline-none"
              />

              <!-- Number Input -->
              <input
                v-else-if="field.type === 'number'"
                v-model.number="formData[field.name]"
                type="number"
                :required="field.required"
                :min="field.min"
                :max="field.max"
                :placeholder="field.placeholder || ''"
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-sm outline-none"
              />

              <!-- Select Input -->
              <select
                v-else-if="field.type === 'select'"
                v-model="formData[field.name]"
                :required="field.required"
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-sm outline-none bg-white"
              >
                <option value="" disabled>Vui lòng chọn</option>
                <option v-for="opt in field.options" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>

              <!-- Textarea Input -->
              <textarea
                v-else-if="field.type === 'textarea'"
                v-model="formData[field.name]"
                :required="field.required"
                rows="3"
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-sm outline-none"
              ></textarea>
            </div>

            <!-- Customer Note -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Ghi chú cho đơn hàng</label>
              <textarea
                v-model="customerNote"
                rows="2"
                placeholder="Ghi chú thêm nếu cần thiết..."
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-sm outline-none"
              ></textarea>
            </div>

            <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span class="text-xs text-slate-400 block">Tổng tiền</span>
                <span class="text-xl font-bold text-sky-600">{{ formatVND(product.price) }}</span>
              </div>

              <button
                type="submit"
                class="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-md shadow-sky-500/20 transition hover:shadow-lg"
              >
                Tiếp tục thanh toán
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatVND } from '@/utils/format'
import { ArrowLeft, ShieldCheck } from 'lucide-vue-next'
import { productService } from '@/services/product.service'
import type { Product, InputFieldSchema } from '@/types'

const route = useRoute()
const router = useRouter()

const product = ref<Product | null>(null)
const formData = ref<Record<string, any>>({})
const customerNote = ref('')

onMounted(async () => {
  const slug = route.params.slug as string
  try {
    const data = await productService.getProductBySlug(slug)
    if (data) {
      product.value = data
      product.value.inputSchema?.forEach((f: InputFieldSchema) => {
        formData.value[f.name] = ''
      })
      return
    }
  } catch (err) {
    console.warn('Cannot load product from API, using fallback data:', err)
  }

  // Fallback ban đầu
  product.value = {
    id: '1',
    name: 'CSUC Gói Cơ Bản 100K',
    slug,
    category: 'Gói Cơ Bản',
    description: 'Thích hợp cho nhu cầu trải nghiệm ngắn hạn, xử lý siêu tốc tự động trong 30 giây.',
    originalPrice: 120000,
    price: 99000,
    status: 'active',
    inputSchema: [
      { name: 'accountId', label: 'Tài khoản / ID nhận quà', type: 'text', required: true, placeholder: 'Nhập ID game hoặc link' },
      { name: 'server', label: 'Máy chủ', type: 'select', required: true, options: [{ label: 'Server Mặt Trời', value: 's1' }, { label: 'Server Ngôi Sao', value: 's2' }] }
    ]
  }

  // Khởi tạo field data
  product.value.inputSchema.forEach((f: InputFieldSchema) => {
    formData.value[f.name] = ''
  })
})

const proceedToCheckout = () => {
  // Lưu giỏ hàng / order draft tạm thời vào sessionStorage và điều hướng checkout
  sessionStorage.setItem('checkout_draft', JSON.stringify({
    product: product.value,
    inputs: formData.value,
    customerNote: customerNote.value,
  }))
  router.push('/checkout')
}
</script>
