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
            <div class="text-right">
              <span class="text-xs text-slate-400 block">{{ formatVND(orderDraft.product.price) }} / 1 code</span>
              <span class="font-bold text-sky-600">x {{ codeList.length }} code</span>
            </div>
          </div>

          <!-- Danh sách các Code Sự kiện -->
          <div class="mt-4 space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Danh Sách Code Sự Kiện ({{ codeList.length }} đơn lẻ)
              </h4>
              <span class="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                Nhập siêu tốc 1 lần {{ codeList.length }} đơn
              </span>
            </div>

            <div class="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              <div
                v-for="(codeItem, idx) in codeList"
                :key="idx"
                class="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <span class="text-slate-400 font-medium">Đơn #{{ idx + 1 }}:</span>
                <span class="font-mono font-bold text-sky-800">{{ codeItem }}</span>
              </div>
            </div>

            <div v-if="orderDraft.customerNote" class="flex justify-between text-xs py-1 border-t border-slate-100 pt-2">
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
              class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition disabled:opacity-50 cursor-pointer"
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
              <span>Đơn giá (x{{ codeList.length }})</span>
              <span>{{ formatVND(rawTotalPrice) }}</span>
            </div>
            <div v-if="discountAmount > 0" class="flex justify-between text-emerald-600">
              <span>Giảm giá</span>
              <span>-{{ formatVND(discountAmount) }}</span>
            </div>
            <div class="pt-3 border-t border-slate-100 flex justify-between font-bold text-base text-slate-900">
              <span>Tổng thanh toán</span>
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
            class="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-md shadow-sky-500/20 transition hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <span>{{ isSubmitting ? 'Đang tạo đơn vào hệ thống...' : `Thanh Toán (${codeList.length} Đơn)` }}</span>
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

    <!-- Popup Toàn Màn Hình Hiển Thị Tiến Độ Tạo Đơn Siêu Tốc -->
    <div
      v-if="isSubmitting"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div class="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-sky-100 text-center space-y-5 animate-in zoom-in-95 duration-150">
        <div class="w-16 h-16 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto shadow-inner">
          <Loader2 class="w-8 h-8 animate-spin" />
        </div>

        <div>
          <h3 class="text-lg font-bold text-slate-800">Đang Khởi Tạo Đơn Hàng...</h3>
          <p class="text-xs text-slate-500 mt-1">
            Đang xử lý trừ ví và import cùng lúc <strong>{{ codeList.length }}</strong> đơn hàng vào Database
          </p>
        </div>

        <!-- Progress bar chạy 100% -->
        <div class="space-y-1.5">
          <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full transition-all duration-300"
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>
          <div class="flex justify-between text-[11px] text-slate-400">
            <span>Tiến trình</span>
            <span class="font-bold text-sky-600">{{ progressPercent }}%</span>
          </div>
        </div>

        <p class="text-[11px] text-slate-400 italic">
          Vui lòng không tắt trình duyệt trong giây lát...
        </p>
      </div>
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
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const orderDraft = ref<any>(null)
const voucherCode = ref('')
const discountAmount = ref(0)
const isValidatingVoucher = ref(false)
const isVoucherValid = ref(false)
const voucherMessage = ref('')
const isSubmitting = ref(false)
const progressPercent = ref(0)

onMounted(async () => {
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

// Danh sách code
const codeList = computed<string[]>(() => {
  if (!orderDraft.value) return []
  if (Array.isArray(orderDraft.value.codes) && orderDraft.value.codes.length > 0) {
    return orderDraft.value.codes
  }
  if (orderDraft.value.inputs?.accountId) {
    return [orderDraft.value.inputs.accountId]
  }
  return ['']
})

const rawTotalPrice = computed(() => {
  if (!orderDraft.value?.product) return 0
  return orderDraft.value.product.price * codeList.value.length
})

const finalPrice = computed(() => {
  const total = rawTotalPrice.value - discountAmount.value
  return total > 0 ? total : 0
})

const applyVoucher = async () => {
  if (!voucherCode.value) return
  isValidatingVoucher.value = true
  voucherMessage.value = ''
  try {
    const res = await orderService.validateVoucher({
      code: voucherCode.value.trim().toUpperCase(),
      productId: orderDraft.value.product.id,
      quantity: codeList.value.length,
    })

    if (res.valid && res.discountAmount > 0) {
      discountAmount.value = res.discountAmount
      isVoucherValid.value = true
      voucherMessage.value = `Áp dụng mã thành công: Giảm ${formatVND(res.discountAmount)} trên tổng đơn!`
    } else {
      discountAmount.value = 0
      isVoucherValid.value = false
      voucherMessage.value = res.message || 'Mã giảm giá không hợp lệ hoặc chưa đủ điều kiện áp dụng.'
    }
  } catch (err: any) {
    discountAmount.value = 0
    isVoucherValid.value = false
    const msg = err.response?.data?.error?.message || err.response?.data?.message
    voucherMessage.value = msg || 'Mã giảm giá không hợp lệ hoặc đã hết lượt dùng.'
  } finally {
    isValidatingVoucher.value = false
  }
}

const submitOrder = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  progressPercent.value = 15

  const codesToOrder = codeList.value
  const masterKey = generateIdempotencyKey()

  // Giả lập thanh tiến trình trực quan
  const interval = setInterval(() => {
    if (progressPercent.value < 85) {
      progressPercent.value += 15
    }
  }, 120)

  try {
    if (codesToOrder.length > 1) {
      // Import thẳng cùng lúc 1 lần toàn bộ codes vào DB (splitOrders = true)
      await orderService.createMultiOrders({
        productId: orderDraft.value.product.id,
        codes: codesToOrder,
        voucherCode: voucherCode.value || undefined,
        customerNote: orderDraft.value.customerNote,
      }, masterKey)
    } else {
      await orderService.createOrder({
        productId: orderDraft.value.product.id,
        inputs: {
          accountId: codesToOrder[0],
          code: codesToOrder[0],
        },
        voucherCode: voucherCode.value || undefined,
        customerNote: orderDraft.value.customerNote,
      }, masterKey)
    }

    progressPercent.value = 100
    clearInterval(interval)

    // Đồng bộ lại ví
    try {
      const w = await walletService.getWallet()
      authStore.updateBalance(w.balance)
    } catch {
      authStore.updateBalance(authStore.userBalance - finalPrice.value)
    }

    sessionStorage.removeItem('checkout_draft')

    // Chờ 300ms cho mượt rồi điều hướng sang trang đơn hàng
    setTimeout(() => {
      isSubmitting.value = false
      router.push('/orders')
    }, 300)
  } catch (apiErr: any) {
    clearInterval(interval)
    isSubmitting.value = false
    progressPercent.value = 0
    const errObj = apiErr.response?.data?.error
    const msg = errObj?.message || apiErr.message || 'Có lỗi xảy ra khi tạo đơn hàng'
    alert(msg)
  }
}
</script>
