<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Thống Kê Tổng Quan</h1>
        <p class="text-sm text-slate-500">Môi trường: {{ appEnv }} | Dữ liệu cập nhật theo thời gian thực</p>
      </div>

      <button
        @click="loadStats"
        :disabled="isLoading"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
      >
        <RotateCcw :class="['w-3.5 h-3.5', isLoading && 'animate-spin text-sky-600']" />
        <span>Làm mới</span>
      </button>
    </div>

    <!-- Stat Cards with Skeleton Loading -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Tổng tiền nạp -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
          <span>TỔNG TIỀN NẠP</span>
          <Banknote class="w-4 h-4 text-emerald-500" />
        </div>
        <div v-if="isLoading" class="h-8 bg-slate-100 rounded animate-pulse w-32 my-1"></div>
        <div v-else class="text-2xl font-black text-slate-800">
          {{ formatVND(stats.totalDeposits) }}
        </div>
        <span class="text-xs text-slate-400 mt-1 block">Từ giao dịch SePay</span>
      </div>

      <!-- Doanh thu đơn -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
          <span>DOANH THU ĐƠN</span>
          <ShoppingCart class="w-4 h-4 text-sky-500" />
        </div>
        <div v-if="isLoading" class="h-8 bg-slate-100 rounded animate-pulse w-32 my-1"></div>
        <div v-else class="text-2xl font-black text-slate-800">
          {{ formatVND(stats.totalRevenue) }}
        </div>
        <span class="text-xs text-slate-400 mt-1 block">Đơn hoàn tất thành công</span>
      </div>

      <!-- Đơn đang xử lý -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
          <span>ĐƠN ĐANG XỬ LÝ</span>
          <Clock class="w-4 h-4 text-amber-500" />
        </div>
        <div v-if="isLoading" class="h-8 bg-slate-100 rounded animate-pulse w-16 my-1"></div>
        <div v-else class="text-2xl font-black text-amber-600">
          {{ stats.processingOrders }}
        </div>
        <span class="text-xs text-slate-400 mt-1 block">Chờ gửi hoặc đang xử lý</span>
      </div>

      <!-- Tổng hoàn tiền -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
          <span>TỔNG HOÀN TIỀN</span>
          <RotateCcw class="w-4 h-4 text-rose-500" />
        </div>
        <div v-if="isLoading" class="h-8 bg-slate-100 rounded animate-pulse w-32 my-1"></div>
        <div v-else class="text-2xl font-black text-slate-800">
          {{ formatVND(stats.totalRefunds) }}
        </div>
        <span class="text-xs text-slate-400 mt-1 block">Đơn lỗi đã hoàn tiền</span>
      </div>
    </div>

    <!-- Quick action tables -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
      <h3 class="font-bold text-slate-800 text-base mb-2">Hệ Thống Sẵn Sàng</h3>
      <p class="text-sm text-slate-500">
        Dữ liệu được tổng hợp trực tiếp từ sổ giao dịch và báo cáo đơn hàng Backend. Bạn có thể quản lý sản phẩm, tra cứu đơn hoặc duyệt nạp ở thanh điều hướng bên trái.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { formatVND } from '@/utils/format'
import { Banknote, ShoppingCart, Clock, RotateCcw } from 'lucide-vue-next'
import { adminService, type AdminReportDashboard } from '@/services/admin.service'

const appEnv = import.meta.env.VITE_APP_ENV || 'production'

const isLoading = ref(true)
const stats = ref<AdminReportDashboard>({
  totalDeposits: 0,
  totalRevenue: 0,
  processingOrders: 0,
  totalRefunds: 0,
})

const loadStats = async () => {
  isLoading.value = true
  try {
    const report = await adminService.getDashboardReport()
    stats.value = report
  } catch (err) {
    console.warn('API error fetching admin dashboard stats:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>
