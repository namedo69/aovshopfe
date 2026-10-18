<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Danh Sách Gói Dịch Vụ</h1>
        <p class="text-slate-500 mt-1">Lựa chọn gói dịch vụ phù hợp với nhu cầu của bạn</p>
      </div>

      <!-- Filters & Search -->
      <div class="flex items-center gap-3">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm kiếm gói..."
            class="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 w-64"
          />
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>
    </div>

    <!-- Product Grid -->
    <div v-if="filteredProducts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col hover:border-sky-300 hover:shadow-md transition"
      >
        <div class="flex items-start justify-between mb-4">
          <span class="text-xs font-semibold px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-100">
            {{ product.category }}
          </span>
          <span v-if="product.status === 'active'" class="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Có sẵn
          </span>
        </div>

        <h3 class="text-lg font-bold text-slate-800 mb-2">{{ product.name }}</h3>
        <p class="text-sm text-slate-500 flex-1 mb-6">{{ product.description }}</p>

        <div class="pt-4 border-t border-slate-100 flex items-baseline justify-between">
          <div>
            <span class="text-xs text-slate-400 block line-through" v-if="product.originalPrice > product.price">
              {{ formatVND(product.originalPrice) }}
            </span>
            <span class="text-xl font-bold text-sky-600">{{ formatVND(product.price) }}</span>
          </div>
          <router-link
            :to="`/products/${product.slug}`"
            class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition"
          >
            Chi tiết
          </router-link>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
      <PackageSearch class="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <h3 class="text-base font-semibold text-slate-700">Không tìm thấy gói phù hợp</h3>
      <p class="text-sm text-slate-400 mt-1">Vui lòng thử tìm kiếm với từ khóa khác</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatVND } from '@/utils/format'
import { Search, PackageSearch } from 'lucide-vue-next'
import { productService } from '@/services/product.service'
import type { Product } from '@/types'

const searchQuery = ref('')

const products = ref<Product[]>([])
const isLoading = ref(false)

const loadProducts = async () => {
  isLoading.value = true
  try {
    const data = await productService.getProducts()
    products.value = data
  } catch (err) {
    console.warn('API error, falling back to initial catalog:', err)
    products.value = [
      {
        id: '1',
        name: 'CSUC Gói Cơ Bản 100K',
        slug: 'csuc-co-ban',
        category: 'Gói Cơ Bản',
        description: 'Thích hợp cho nhu cầu trải nghiệm ngắn hạn, xử lý siêu tốc.',
        originalPrice: 120000,
        price: 99000,
        status: 'active',
        inputSchema: [
          { name: 'accountId', label: 'Tài khoản / ID nhận quà', type: 'text', required: true, placeholder: 'Nhập ID game' },
        ]
      }
    ]
  } finally {
    isLoading.value = false
  }
}

loadProducts()

const filteredProducts = computed(() => {
  return products.value.filter((p: Product) =>
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})
</script>
