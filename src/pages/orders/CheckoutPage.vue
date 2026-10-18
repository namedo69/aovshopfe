<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="mb-6">
      <router-link to="/products" class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-sky-600 transition">
        <ArrowLeft class="w-4 h-4" /> Chọn gói khác
      </router-link>
    </div>

    <h1 class="text-3xl font-bold text-slate-900 mb-8">Xác Nhận & Đặt Hàng</h1>

    <div v-if="orderDraft" class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Cột trái: Thông tin đơn & Dữ liệu khách nhập -->
      <div class="md:col-span-2 space-y-6">
        <!-- Tóm tắt gói -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h2 class="text-base font-bold text-slate-800 mb-4">Gói Dịch Vụ Đã Chọn</h2>
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 class="font-bold text-slate-900">{{ orderDraft.product.name }}</h3>
              <span class="text-xs text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 font-medium">
                {{ orderDraft.product.category }}
              </span>
            </div>
            <div class="text-right font-bold text-sky-600">
              {{ formatVND(orderDraft.product.price) }}
            </div>
          </div>

          <!-- Dữ liệu đã nhập -->
          <div class="mt-4 space-y-2">
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dữ liệu tài khoản</h4>
            <div v-for="(val, key) in orderDraft.inputs" :key="key" class="flex justify-between text-sm py-1">
              <span class="text-slate-500">{{ key }}:</span>
              <span class="font-medium text-slate-800 font-mono">{{ val }}</span>
            </div>
            <div v-if="orderDraft.customerNote" class="flex justify-between text-sm py-1">
              <span class="text-slate-500">Ghi chú:</span>
              <span class="italic text-slate-700">{{ orderDraft.customerNote }}</span>
            </div>
          </div>
        </div>

        <!-- Voucher Form -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h2 class="text-base font-bold text-slate-800 mb-3">Mã Giảm Giá (Voucher)</h2>
          <div class="flex gap-2">
            <input
              v-model="voucherCode"
              type="text"
              placeholder="Nhập mã voucher (nếu có)"
              class="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm uppercase outline-none"
            />
            <button
              @click="applyVoucher"
              :disabled="isValidatingVoucher || !voucherCode"
              class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition disabled:opacity-50"
            >
              Áp dụng
            </button>
          </div>
          <p v-if="voucherMessage" :class="['text-xs mt-2', isVoucherValid ? 'text-emerald-600' : 'text-rose-500']">
            {{ voucherMessage }}
          </p>
        </div>
      </div>

      <!-- Cột phải: Thanh toán số dư -->
      <div class="md:col-span-1 space-y-6">
        <div class="bg-white rounded-2xl border border-sky-100 p-6 shadow-xs space-y-4">
          <h2 class="text-base font-bold text-slate-800">Chi Tiết Thanh Toán</h2>

          <div class="space-y-2 text-sm">
            <div class="flex justify-between text-slate-600">
              <span>Giá gốc</span>
              <span>{{ formatVND(orderDraft.product.price) }}</span>
            </div>
            <div v-if="discountAmount > 0" class="flex justify-between text-emerald-600">
              <span>Giảm giá</span>
              <span>-{{ formatVND(discountAmount) }}</span>
            </div>
            <div class="pt-3 border-t border-slate-100 flex justify-between font-bold text-base text-slate-900">
              <span>Cần thanh toán</span>
              <span class="text-sky-600">{{ formatVND(finalPrice) }}</span>
            </div>
          </div>

          <!-- Thông tin số dư ví -->
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
            <div class="flex justify-between text-slate-500">
              <span>Số dư hiện tại:</span>
              <span class="font-bold text-slate-800">{{ formatVND(authStore.userBalance) }}</span>
            </div>
            <div v-if="authStore.userBalance < finalPrice" class="text-rose-500 font-medium pt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5 shrink-0" /> Số dư không đủ để thanh toán.
            </div>
          </div>

          <!-- Nút Đặt Đơn / Nạp Thêm -->
          <button
            v-if="authStore.userBalance >= finalPrice"
            @click="submitOrder"
            :disabled="isSubmitting"
            class="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-md shadow-sky-500/20 transition hover:shadow-lg disabled:opacity-50"
          >
            <span v-if="isSubmitting">Đang xử lý đơn...</span>
            <span v-else>Xác Nhận Thanh Toán</span>
          </button>

          <router-link
            v-else
            to="/deposit"
            class="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-md text-center block transition"
          >
            Nạp Thêm Vào Ví
          </router-link>
        </div>
      </div>
    </div>

    <!-- Empty draft -->
    <div v-else class="text-center py-16 bg-white rounded-2xl border border-slate-200">
      <p class="text-slate-500">Chưa có thông tin đơn hàng nào được chọn.</p>
      <router-link to="/products" class="mt-4 inline-block px-5 py-2 rounded-xl bg-sky-600 text-white font-medium text-sm">
        Xem danh sách gói
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { formatVND, generateIdempotencyKey } from '@/utils/format'
import { orderService } from '@/services/order.service'
import { walletService } from '@/services/wallet.service'
import { ArrowLeft, AlertCircle } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const orderDraft = ref<any>(null)
const voucherCode = ref('')
const discountAmount = ref(0)
const isValidatingVoucher = ref(false)
const isVoucherValid = ref(false)
const voucherMessage = ref('')
const isSubmitting = ref(false)

onMounted(async () => {
  // Lấy lại số dư mới nhất từ BE khi vào trang checkout
  try {
    const w = await walletService.getWallet()
    if (w && typeof w.balance === 'number') {
      authStore.updateBalance(w.balance)
    }
  } catch {}

  const saved = sessionStorage.getItem('checkout_draft')
  if (saved) {
    try {
      orderDraft.value = JSON.parse(saved)
    } catch {
      orderDraft.value = null
    }
  }
})

const finalPrice = computed(() => {
  if (!orderDraft.value) return 0
  const price = orderDraft.value.product.price - discountAmount.value
  return price > 0 ? price : 0
})

const applyVoucher = async () => {
  if (!voucherCode.value) return
  isValidatingVoucher.value = true
  voucherMessage.value = ''
  try {
    try {
      const res = await orderService.validateVoucher({
        code: voucherCode.value.toUpperCase(),
        productId: orderDraft.value.product.id,
      })

      if (res.valid) {
        discountAmount.value = res.discountAmount
        isVoucherValid.value = true
        voucherMessage.value = res.message || `Áp dụng mã giảm ${formatVND(res.discountAmount)} thành công!`
        return
      } else {
        discountAmount.value = 0
        isVoucherValid.value = false
        voucherMessage.value = res.message || 'Mã giảm giá không hợp lệ hoặc đã hết lượt dùng.'
        return
      }
    } catch {
      // Fallback local test nếu backend chưa bật
      if (voucherCode.value.toUpperCase() === 'CHAOBANMOI') {
        discountAmount.value = 20000
        isVoucherValid.value = true
        voucherMessage.value = 'Áp dụng mã giảm 20.000đ thành công!'
      } else {
        discountAmount.value = 0
        isVoucherValid.value = false
        voucherMessage.value = 'Mã giảm giá không hợp lệ hoặc đã hết lượt dùng.'
      }
    }
  } finally {
    isValidatingVoucher.value = false
  }
}

const submitOrder = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true

  const _idempotencyKey = generateIdempotencyKey()
  console.log('Using Idempotency-Key:', _idempotencyKey)

  try {
    const newOrder = await orderService.createOrder({
      productId: orderDraft.value.product.id,
      inputs: orderDraft.value.inputs,
      voucherCode: voucherCode.value || undefined,
      customerNote: orderDraft.value.customerNote,
    }, _idempotencyKey)

    // Lấy lại số dư ví thực từ backend sau khi trừ
    try {
      const w = await walletService.getWallet()
      authStore.updateBalance(w.balance)
    } catch {
      authStore.updateBalance(authStore.userBalance - finalPrice.value)
    }

    sessionStorage.removeItem('checkout_draft')
    router.push(`/orders/${newOrder.orderCode}`)
  } catch (apiErr: any) {
    const errObj = apiErr.response?.data?.error
    const msg = errObj?.message || apiErr.message || 'Có lỗi xảy ra khi tạo đơn hàng'
    alert(msg)
  } finally {
    isSubmitting.value = false
  }
}
</script>
