<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
    <div>
      <p class="text-xs uppercase tracking-wider text-sky-600 font-bold">Sản phẩm nhóm</p>
      <h1 class="text-3xl font-black text-slate-900">Mở rương nhóm</h1>
      <p class="text-sm text-slate-500 mt-2">Nhập danh sách tài khoản cần mở rương. Đơn hàng sẽ tự động được gửi về tool PC để mở rương.</p>
    </div>

    <div class="bg-sky-50 border border-sky-200 text-sky-900 rounded-2xl p-4 text-sm flex items-start gap-3">
      <div class="font-bold text-sky-600">💡 Hướng dẫn:</div>
      <div>
        Mỗi dòng nhập 1 tài khoản theo cú pháp: <code class="bg-white px-2 py-0.5 rounded font-mono border border-sky-200">taikhoan|matkhau</code> hoặc <code class="bg-white px-2 py-0.5 rounded font-mono border border-sky-200">taikhoan:matkhau</code>. Hỗ trợ tối đa 100 tài khoản mỗi lượt đặt.
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <section class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <label class="block text-sm font-bold text-slate-800">Sản phẩm</label>
        <select v-model="productId" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <option value="" disabled>Chọn sản phẩm Mở rương nhóm</option>
          <option v-for="product in groupProducts" :key="product.id" :value="product.id">{{ product.name }} — {{ formatVND(product.price) }}</option>
        </select>

        <label class="block text-sm font-bold text-slate-800">Danh sách tài khoản (user|pass hoặc user:pass)</label>
        <textarea v-model="rawAccounts" rows="12" placeholder="taikhoan1|matkhau1&#10;taikhoan2:matkhau2&#10;taikhoan3|matkhau3" class="w-full rounded-xl border border-slate-200 px-3 py-3 font-mono text-sm outline-none focus:border-sky-500"></textarea>
        <p class="text-xs text-slate-500">{{ parsedAccounts.length }} tài khoản hợp lệ · tối đa 100</p>

        <label class="block text-sm font-bold text-slate-800">Ghi chú</label>
        <input v-model="note" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Ghi chú tùy chọn" />
      </section>

      <aside class="bg-white rounded-2xl border border-sky-100 p-6 h-fit space-y-4">
        <div class="flex justify-between text-sm"><span>Số tài khoản</span><b>{{ parsedAccounts.length }}</b></div>
        <div class="flex justify-between text-sm"><span>Đơn giá</span><b>{{ formatVND(selectedProduct?.price || 0) }}</b></div>
        <div class="border-t pt-3 flex justify-between font-black"><span>Tạm tính</span><span class="text-sky-600">{{ formatVND(total) }}</span></div>
        <button @click="submit" :disabled="submitting || !productId || !parsedAccounts.length" class="w-full rounded-xl bg-sky-600 hover:bg-sky-700 text-white py-3 font-bold disabled:opacity-50">
          {{ submitting ? 'Đang tạo đơn...' : 'Tạo đơn Mở rương nhóm' }}
        </button>
        <p v-if="message" class="text-sm text-emerald-600">{{ message }}</p>
        <p v-if="error" class="text-sm text-rose-600">{{ error }}</p>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatVND, generateIdempotencyKey } from '@/utils/format'
import { productService } from '@/services/product.service'
import { orderService, type GroupChestAccountInput } from '@/services/order.service'
import type { Product } from '@/types'

const route = useRoute()
const router = useRouter()
const products = ref<Product[]>([])
const productId = ref('')
const rawAccounts = ref('')
const note = ref('')
const submitting = ref(false)
const message = ref('')
const error = ref('')

const groupProducts = computed(() => products.value.filter(p => p.productType === 'group_chest_open'))
const selectedProduct = computed(() => groupProducts.value.find(p => p.id === productId.value))
const parsedAccounts = computed<GroupChestAccountInput[]>(() => rawAccounts.value.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
  const parts = line.includes(':') ? line.split(':', 2) : line.split('|', 2)
  const externalAccountId = parts[0]?.trim() || ''
  const credentialRef = parts[1]?.trim() || ''
  return { externalAccountId, credentialRef }
}).filter(item => item.externalAccountId && item.credentialRef).slice(0, 100))
const total = computed(() => (selectedProduct.value?.price || 0) * parsedAccounts.value.length)

async function submit() {
  if (!productId.value || !parsedAccounts.value.length) return
  submitting.value = true; message.value = ''; error.value = ''
  try {
    await orderService.createGroupChestOrder({ productId: productId.value, accounts: parsedAccounts.value, customerNote: note.value.trim() || undefined }, generateIdempotencyKey())
    message.value = 'Đã tạo đơn. Đang chờ PC agent xử lý.'
    setTimeout(() => router.push('/orders'), 500)
  } catch (err: any) {
    error.value = err.response?.data?.error?.message || err.message || 'Không thể tạo đơn'
  } finally { submitting.value = false }
}

onMounted(async () => {
  products.value = await productService.getProducts()
  const qProd = route.query.product as string
  if (qProd && groupProducts.value.some(p => p.id === qProd)) {
    productId.value = qProd
  } else {
    productId.value = groupProducts.value[0]?.id || ''
  }
})
</script>
