<template>
  <div>
    <!-- Hero Banner with Sky gradient -->
    <section class="relative overflow-hidden bg-gradient-to-b from-sky-100 via-sky-50 to-white pt-12 pb-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300 shadow-xs mb-4">
          <Sparkles class="w-3.5 h-3.5 text-sky-600" /> Nạp tiền tự động qua VietQR 24/7
        </span>
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
          Hệ Thống Dịch Vụ <span class="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">Siêu Tốc</span>
        </h1>
        <p class="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
          An toàn, tiện lợi và minh bạch. Tự động xử lý trong vài giây với hệ thống nạp tiền và thanh toán thông minh.
        </p>

        <div class="mt-8 flex flex-wrap justify-center gap-4">
          <router-link
            to="/products"
            class="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-md shadow-sky-500/20 transition hover:shadow-lg hover:-translate-y-0.5"
          >
            Khám phá dịch vụ
          </router-link>
          <router-link
            to="/deposit"
            class="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 shadow-xs transition hover:border-sky-300"
          >
            Nạp tiền ngay
          </router-link>
        </div>
      </div>

      <!-- Background decorative clouds/circles -->
      <div class="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-sky-200/40 blur-3xl pointer-events-none"></div>
      <div class="absolute top-10 -right-20 w-96 h-96 rounded-full bg-blue-100/50 blur-3xl pointer-events-none"></div>
    </section>

    <!-- Highlights Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-6 rounded-2xl bg-white border border-sky-100 shadow-xs hover:shadow-md transition">
          <div class="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
            <Zap class="w-6 h-6" />
          </div>
          <h3 class="text-lg font-bold text-slate-800">Xử Lý Tự Động</h3>
          <p class="mt-2 text-slate-600 text-sm leading-relaxed">
            Mọi yêu cầu được điều phối trực tiếp tới nhà cung cấp ngay sau khi thanh toán thành công.
          </p>
        </div>

        <div class="p-6 rounded-2xl bg-white border border-sky-100 shadow-xs hover:shadow-md transition">
          <div class="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
            <QrCode class="w-6 h-6" />
          </div>
          <h3 class="text-lg font-bold text-slate-800">Quét Mã VietQR Chuẩn</h3>
          <p class="mt-2 text-slate-600 text-sm leading-relaxed">
            Quét mã QR chuyển khoản chính xác tới từng đồng, cộng tiền vào ví lập tức không cần đợi duyệt tay.
          </p>
        </div>

        <div class="p-6 rounded-2xl bg-white border border-sky-100 shadow-xs hover:shadow-md transition">
          <div class="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
            <ShieldCheck class="w-6 h-6" />
          </div>
          <h3 class="text-lg font-bold text-slate-800">Bảo Mật & Minh Bạch</h3>
          <p class="mt-2 text-slate-600 text-sm leading-relaxed">
            Theo dõi chi tiết từng trạng thái đơn hàng (queued, sending, processing, completed) trực quan và rõ ràng.
          </p>
        </div>
      </div>
    </section>

    <!-- Featured Products Preview -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-slate-900">Gói Dịch Vụ Nổi Bật</h2>
          <p class="text-sm text-slate-500">Các gói được đăng ký nhiều nhất</p>
        </div>
        <router-link to="/products" class="text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
          Xem tất cả <ArrowRight class="w-4 h-4" />
        </router-link>
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="n in 3" :key="n" class="rounded-2xl bg-white border border-slate-200 p-6 animate-pulse space-y-4">
          <div class="h-4 bg-slate-200 rounded w-20"></div>
          <div class="h-6 bg-slate-200 rounded w-3/4"></div>
          <div class="h-12 bg-slate-100 rounded w-full"></div>
          <div class="h-8 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>

      <div v-else-if="featuredProducts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="item in featuredProducts" :key="item.id" class="rounded-2xl bg-white border border-slate-200 overflow-hidden hover:border-sky-300 hover:shadow-md transition flex flex-col">
          <div class="p-6 flex-1 flex flex-col">
            <span class="text-xs font-semibold px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 w-fit mb-3 border border-sky-100">
              {{ item.category }}
            </span>
            <h3 class="text-lg font-bold text-slate-800">{{ item.name }}</h3>
            <p class="mt-2 text-sm text-slate-500 flex-1">{{ item.description }}</p>

            <div class="mt-6 pt-4 border-t border-slate-100 flex items-baseline justify-between">
              <div>
                <span class="text-xs text-slate-400 block line-through" v-if="item.originalPrice > item.price">
                  {{ formatVND(item.originalPrice) }}
                </span>
                <span class="text-xl font-bold text-sky-600">{{ formatVND(item.price) }}</span>
              </div>
              <router-link
                :to="`/products/${item.slug}`"
                class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition"
              >
                Đặt ngay
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
        Hiện chưa có gói dịch vụ nào sẵn sàng.
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Sparkles, Zap, QrCode, ShieldCheck, ArrowRight } from 'lucide-vue-next'
import { formatVND } from '@/utils/format'
import { productService } from '@/services/product.service'
import type { Product } from '@/types'

const featuredProducts = ref<Product[]>([])
const isLoading = ref(false)

const loadFeaturedProducts = async () => {
  isLoading.value = true
  try {
    // Gọi API từ Backend lấy danh sách gói
    const list = await productService.getProducts()
    // Hiển thị trực tiếp danh sách gói lấy từ Database
    featuredProducts.value = list.slice(0, 6)
  } catch (err) {
    console.warn('Không thể kết nối BE API, dùng danh sách dự phòng:', err)
    // Chỉ fallback khi API bị lỗi mạng hoặc server tắt hoàn toàn
    featuredProducts.value = [
      {
        id: '1',
        name: 'CSUC Gói Cơ Bản 100K',
        slug: 'csuc-co-ban',
        category: 'Gói Cơ Bản',
        description: 'Kích hoạt ngay lập tức, hỗ trợ tài khoản thường xuyên.',
        originalPrice: 120000,
        price: 99000,
        status: 'active',
        inputSchema: [],
      },
      {
        id: '2',
        name: 'CSUC Gói Tiêu Chuẩn 300K',
        slug: 'csuc-tieu-chuan',
        category: 'Gói Phổ Biến',
        description: 'Tặng kèm ưu đãi đặc biệt cho thành viên mới nạp lần đầu.',
        originalPrice: 350000,
        price: 289000,
        status: 'active',
        inputSchema: [],
      },
    ]
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadFeaturedProducts()
})
</script>
