<template>
  <div class="max-w-[1380px] mx-auto px-3 sm:px-6 py-6 space-y-5">
    <!-- Breadcrumb & Tiêu đề -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <div class="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
          <router-link to="/products" class="hover:text-sky-600 transition">Gói dịch vụ</router-link>
          <span>/</span>
          <span class="text-slate-700 font-semibold">{{ currentProduct?.name || 'Đặt đơn mới' }}</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <span>Đặt Đơn & Theo Dõi Tiến Độ</span>
          <span v-if="currentProduct" class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            {{ currentProduct.name }} • {{ formatVND(effectiveUnitPrice) }}/code
          </span>
        </h1>
      </div>

      <!-- Quick user wallet status -->
      <div v-if="authStore.isAuthenticated" class="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs">
        <div class="text-right">
          <div class="text-[11px] text-slate-400">Số dư ví khả dụng:</div>
          <div class="font-bold text-sky-600 text-sm">{{ formatVND(authStore.userBalance) }}</div>
        </div>
        <router-link
          to="/deposit"
          class="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-xl border border-sky-200 transition"
        >
          + Nạp Thêm
        </router-link>
      </div>
    </div>

    <!-- 1. Thanh chọn qua lại giữa các sản phẩm (Product Switcher Tabs) -->
    <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Chọn gói dịch vụ cần chạy:</span>
        <span class="text-xs text-slate-400">{{ allProducts.length }} gói có sẵn</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        <button
          v-for="p in allProducts"
          :key="p.id"
          type="button"
          @click="selectProduct(p)"
          :class="[
            'p-2.5 rounded-xl border text-left transition relative cursor-pointer',
            currentProduct?.id === p.id
              ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20 shadow-xs'
              : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
          ]"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
              {{ p.category }}
            </span>
            <span v-if="currentProduct?.id === p.id" class="w-2 h-2 rounded-full bg-sky-600"></span>
          </div>
          <div class="font-bold text-xs text-slate-800 truncate" :title="p.name">{{ p.name }}</div>
          <div class="text-xs font-extrabold text-sky-600 mt-1">
            {{ formatVND(calculateEffectiveUnitPrice(p)) }}
          </div>
        </button>
      </div>
    </div>

    <!-- Alert notification -->
    <div
      v-if="alertMessage"
      :class="[
        'p-3.5 rounded-2xl text-sm flex items-center justify-between shadow-xs animate-in fade-in',
        alertType === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      ]"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 v-if="alertType === 'success'" class="w-4 h-4 text-emerald-600 shrink-0" />
        <AlertCircle v-else class="w-4 h-4 text-rose-600 shrink-0" />
        <span>{{ alertMessage }}</span>
      </div>
      <button @click="alertMessage = ''" class="font-bold ml-4 text-slate-400 hover:text-slate-600">✕</button>
    </div>

    <!-- MAIN TWO-COLUMN LAYOUT -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <!-- CỘT TRÁI: KHU VỰC ĐẶT HÀNG (DIV CODE FLEX VỚI DIV THANH TOÁN) (6 / 12) -->
      <div v-if="currentProduct" class="lg:col-span-6 xl:col-span-6">
        <div class="flex flex-col sm:flex-row gap-3.5 items-stretch">
          <!-- DIV CODE: NHẬP DANH SÁCH CODE & SỐ LƯỢNG (FLEX-1, HEIGHT BẰNG THANH TOÁN, TỰ NỚI RỘNG KHI THÊM CODE) -->
          <div class="flex-1 min-w-0 w-full bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3 min-h-full">
            <div class="space-y-3 flex-1 flex flex-col">
              <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <div class="flex items-center gap-1.5">
                    <h3 class="text-xs sm:text-sm font-bold text-slate-900">Danh Sách Code</h3>
                    <span class="text-xs font-bold text-sky-600 truncate max-w-[120px]" :title="currentProduct.name">({{ currentProduct.name }})</span>
                  </div>
                  <p class="text-[10px] text-slate-400 mt-0.5">Nhập mã code và ô số lượng tương ứng</p>
                </div>

                <!-- Badge cấp bậc & số lượng dòng -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <span
                    v-if="authStore.isAdmin"
                    class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200"
                  >
                    👑 -100%
                  </span>
                  <span
                    v-else-if="authStore.userTierDiscount > 0"
                    class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
                  >
                    ⭐ -{{ authStore.userTierDiscount }}%
                  </span>
                  <span :class="['text-[11px] font-semibold px-2 py-0.2 rounded-full', codeRows.length >= 10 ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-700']">
                    {{ codeRows.length }}/10
                  </span>
                </div>
              </div>

              <!-- Danh sách từng dòng: STT, Code Input, Số lượng Box, Nút Xóa -->
              <div class="space-y-2 flex-1">
                <div
                  v-for="(row, idx) in codeRows"
                  :key="idx"
                  class="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-50/70 border border-slate-200 focus-within:border-sky-500 focus-within:bg-white transition"
                >
                  <!-- STT -->
                  <div class="w-5 h-5 rounded-md bg-sky-100 text-sky-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                    #{{ idx + 1 }}
                  </div>

                  <!-- Input Code -->
                  <input
                    v-model="row.code"
                    type="text"
                    required
                    :placeholder="`Mã code #${idx + 1}...`"
                    class="flex-1 px-2 py-1 text-xs bg-transparent outline-none font-mono font-medium text-slate-800 min-w-0"
                  />

                  <!-- Ô Số lượng bên cạnh code -->
                  <div class="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded-lg border border-slate-200 shrink-0">
                    <span class="text-[9px] font-semibold text-slate-400 uppercase">SL:</span>
                    <input
                      v-model.number="row.quantity"
                      type="number"
                      min="1"
                      max="1000"
                      class="w-10 text-center text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>

                  <!-- Nút Xóa dòng (nếu > 1 dòng) -->
                  <button
                    v-if="codeRows.length > 1"
                    type="button"
                    @click="removeCodeRow(idx)"
                    class="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition cursor-pointer shrink-0"
                    title="Xóa dòng này"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Bottom actions: Thêm dòng code + Ghi chú -->
            <div class="pt-2 border-t border-slate-100 space-y-2">
              <div class="flex items-center justify-between">
                <button
                  v-if="codeRows.length < 10"
                  type="button"
                  @click="addCodeRow"
                  class="flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200 transition cursor-pointer"
                >
                  <Plus class="w-3 h-3" /> Thêm Code
                </button>
                <span v-else class="text-[10px] text-amber-600 font-medium">
                  ⚠️ Tối đa 10 code.
                </span>

                <span class="text-[11px] text-slate-500 font-medium">
                  Tổng SL: <strong class="text-slate-900 font-bold">{{ totalItemsQuantity }} cái</strong>
                </span>
              </div>

              <!-- Ghi chú cho đơn hàng -->
              <div>
                <input
                  v-model="customerNote"
                  type="text"
                  placeholder="Ghi chú đơn hàng (nếu có)..."
                  class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-[11px] outline-none bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          <!-- DIV THANH TOÁN (FLEX BÊN CẠNH DIV CODE): VOUCHER, TẠM TÍNH, SỐ DƯ, NÚT ĐẶT ĐƠN -->
          <div class="w-full sm:w-[280px] xl:w-[290px] shrink-0 flex flex-col justify-between space-y-3">
            <!-- Form Voucher -->
            <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <TicketPercent class="w-3.5 h-3.5 text-sky-600" /> Mã Giảm Giá (Voucher)
                </h3>
                <span v-if="appliedVoucher" class="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Đã áp dụng
                </span>
              </div>

              <div class="flex gap-1.5">
                <input
                  v-model="voucherInput"
                  type="text"
                  :disabled="isValidatingVoucher || !!appliedVoucher"
                  placeholder="Nhập mã voucher..."
                  class="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs uppercase outline-none font-mono disabled:bg-slate-100"
                />
                <button
                  v-if="!appliedVoucher"
                  type="button"
                  @click="applyVoucher"
                  :disabled="isValidatingVoucher || !voucherInput.trim()"
                  class="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Loader2 v-if="isValidatingVoucher" class="w-3 h-3 animate-spin" />
                  <span>Áp Dụng</span>
                </button>
                <button
                  v-else
                  type="button"
                  @click="removeVoucher"
                  class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-semibold text-xs transition cursor-pointer shrink-0"
                >
                  Hủy
                </button>
              </div>

              <p v-if="voucherMessage" :class="['text-[11px]', isVoucherValid ? 'text-emerald-600 font-medium' : 'text-rose-500']">
                {{ voucherMessage }}
              </p>
            </div>

            <!-- Tóm Tắt Thanh Toán & Nút Đặt Đơn Ngay -->
            <div class="bg-white rounded-2xl border border-sky-100 p-4 shadow-xs space-y-3.5 flex-1 flex flex-col justify-between">
              <h3 class="text-xs font-bold text-slate-800 pb-2 border-b border-slate-100 uppercase tracking-wider">
                Thanh Toán Đơn Hàng
              </h3>

              <!-- Chi tiết bảng giá -->
              <div class="space-y-2 text-xs">
                <div class="flex justify-between text-slate-600">
                  <span>Đơn giá:</span>
                  <span class="font-semibold text-slate-800">{{ formatVND(effectiveUnitPrice) }} / cái</span>
                </div>

                <div class="flex justify-between text-slate-600">
                  <span>Tổng số lượng:</span>
                  <span class="font-bold text-slate-800">{{ totalItemsQuantity }} cái ({{ validCodeCount }} code)</span>
                </div>

                <div class="flex justify-between text-slate-600">
                  <span>Tạm tính:</span>
                  <span class="font-semibold text-slate-800">{{ formatVND(rawSubtotal) }}</span>
                </div>

                <!-- Giảm giá voucher -->
                <div v-if="voucherDiscount > 0" class="flex justify-between text-emerald-600 font-semibold">
                  <span>Giảm giá Voucher:</span>
                  <span>-{{ formatVND(voucherDiscount) }}</span>
                </div>

                <!-- Ưu đãi admin/CTV -->
                <div v-if="authStore.isAdmin" class="flex justify-between text-purple-600 font-semibold">
                  <span>Ưu đãi Admin:</span>
                  <span>Miễn phí 100% (0đ)</span>
                </div>

                <div class="pt-2 border-t border-slate-100 flex justify-between items-baseline font-bold text-xs text-slate-900">
                  <span class="text-xs">Tổng thanh toán:</span>
                  <span class="text-xl font-black text-sky-600">{{ formatVND(finalPaymentAmount) }}</span>
                </div>
              </div>

              <!-- Thông tin số dư ví -->
              <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                <div class="flex justify-between text-slate-500">
                  <span>Số dư ví:</span>
                  <span class="font-bold text-slate-800">{{ formatVND(authStore.userBalance) }}</span>
                </div>

                <div v-if="authStore.isAuthenticated && authStore.userBalance < finalPaymentAmount && finalPaymentAmount > 0" class="text-rose-500 font-medium pt-0.5 flex items-center gap-1 text-[11px]">
                  <AlertCircle class="w-3.5 h-3.5 shrink-0" />
                  <span>Số dư không đủ. Vui lòng nạp thêm.</span>
                </div>
              </div>

              <!-- Nút Đặt Đơn Ngay -->
              <div v-if="!authStore.isAuthenticated">
                <router-link
                  to="/login"
                  class="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs text-center block transition shadow-sm"
                >
                  Đăng Nhập Để Đặt Hàng
                </router-link>
              </div>

              <div v-else-if="authStore.userBalance < finalPaymentAmount && finalPaymentAmount > 0">
                <router-link
                  to="/deposit"
                  class="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs text-center block transition shadow-md"
                >
                  Nạp Thêm Vào Ví
                </router-link>
              </div>

              <button
                v-else
                type="button"
                @click="handleSubmitOrder"
                :disabled="isSubmitting || validCodeCount === 0"
                class="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-500/20 transition hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
                <span>{{ isSubmitting ? 'Đang khởi tạo...' : `Thanh Toán & Đặt ${validCodeCount} Đơn` }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CỘT PHẢI: TIẾN ĐỘ & LỊCH SỬ ĐƠN HÀNG (RỘNG HƠN - 6 / 12) -->
      <div class="lg:col-span-6 xl:col-span-6 space-y-4">
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3.5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h2 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>📦</span> Tiến Độ & Lịch Sử Đơn
              </h2>
              <p class="text-[11px] text-slate-400 mt-0.5">
                Tự động cập nhật trạng thái thời gian thực
              </p>
            </div>

            <div class="flex items-center gap-1.5">
              <!-- Switch tab lọc: Đang Chạy | Đã Done | Tất Cả -->
              <div class="flex bg-slate-100 p-0.5 rounded-xl">
                <button
                  v-for="tab in trackingTabs"
                  :key="tab.value"
                  @click="activeTrackingTab = tab.value"
                  :class="[
                    'px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer',
                    activeTrackingTab === tab.value ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                  ]"
                >
                  {{ tab.label }}
                  <span
                    v-if="tab.count !== undefined"
                    :class="[
                      'ml-1 px-1.5 py-0.2 rounded-full text-[10px]',
                      activeTrackingTab === tab.value ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-600'
                    ]"
                  >
                    {{ tab.count }}
                  </span>
                </button>
              </div>

              <!-- Nút Refresh Đơn -->
              <button
                @click="loadOrders"
                :disabled="isLoadingOrders"
                class="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                title="Làm mới tiến độ đơn hàng"
              >
                <RotateCcw :class="['w-3.5 h-3.5', isLoadingOrders && 'animate-spin text-sky-600']" />
              </button>
            </div>
          </div>

          <!-- Loading orders -->
          <div v-if="isLoadingOrders && ordersList.length === 0" class="p-8 text-center text-slate-400">
            <Loader2 class="w-5 h-5 animate-spin mx-auto mb-1.5 text-sky-500" />
            <span class="text-xs">Đang tải lịch sử đơn...</span>
          </div>

          <!-- Chưa đăng nhập -->
          <div v-else-if="!authStore.isAuthenticated" class="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 space-y-1.5">
            <PackageSearch class="w-7 h-7 mx-auto text-slate-300 stroke-[1.2]" />
            <p class="text-xs font-medium text-slate-600">Đăng nhập tài khoản để theo dõi tiến độ đơn hàng</p>
            <router-link to="/login" class="inline-block px-3 py-1 bg-sky-600 text-white rounded-lg text-xs font-semibold">
              Đăng nhập ngay
            </router-link>
          </div>

          <!-- Empty state -->
          <div v-else-if="filteredOrders.length === 0" class="p-6 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 space-y-1">
            <PackageSearch class="w-7 h-7 mx-auto text-slate-300 stroke-[1.2]" />
            <p class="text-xs font-medium text-slate-600">Không có đơn hàng nào trong mục này</p>
            <p class="text-[11px] text-slate-400">Đơn vừa đặt sẽ hiển thị trạng thái tại đây</p>
          </div>

          <!-- BẢNG ĐÃ BỎ CỘT MÃ ĐƠN, THANH TOÁN, CHI TIẾT -->
          <div v-else class="overflow-hidden rounded-xl border border-slate-100">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-500 text-[11px] border-b border-slate-100">
                  <tr>
                    <th class="py-2.5 px-3 font-semibold">Gói Dịch Vụ</th>
                    <th class="py-2.5 px-3 font-semibold">Code Sự Kiện</th>
                    <th class="py-2.5 px-2 font-semibold text-center">SL</th>
                    <th class="py-2.5 px-3 font-semibold text-right">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-700">
                  <tr v-for="ord in filteredOrders" :key="ord.id" class="hover:bg-slate-50/50 transition">
                    <!-- Gói Dịch Vụ -->
                    <td class="py-2.5 px-3">
                      <div class="font-bold text-xs text-slate-900">{{ ord.items?.[0]?.productName || 'Gói Dịch Vụ' }}</div>
                      <div class="text-[10px] text-slate-400 mt-0.5">{{ formatDate(ord.createdAt) }}</div>
                    </td>

                    <!-- Code Sự Kiện (với nút copy) -->
                    <td class="py-2.5 px-3">
                      <div class="flex items-center gap-1.5 font-mono text-xs font-bold text-sky-800">
                        <span class="truncate max-w-[110px] sm:max-w-[150px]" :title="getOrderCodeInput(ord)">
                          {{ getOrderCodeInput(ord) || '—' }}
                        </span>
                        <button
                          v-if="getOrderCodeInput(ord)"
                          @click="copyText(getOrderCodeInput(ord))"
                          class="text-slate-400 hover:text-sky-600 transition shrink-0"
                          title="Copy code"
                        >
                          <Copy class="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    <!-- Số Lượng -->
                    <td class="py-2.5 px-2 text-center font-bold text-slate-800">
                      x{{ ord.items?.[0]?.quantity || 1 }}
                    </td>

                    <!-- Trạng Thái & Tiến Độ Vé -->
                    <td class="py-2.5 px-3 text-right">
                      <div class="flex flex-col items-end gap-1">
                        <span
                          :class="[
                            'px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1',
                            statusStyles[ord.status] || 'bg-slate-100 text-slate-600'
                          ]"
                        >
                          <span :class="['w-1.5 h-1.5 rounded-full', statusDots[ord.status] || 'bg-slate-400']"></span>
                          {{ statusLabels[ord.status] || ord.status }}
                        </span>

                        <!-- Thanh % vé nếu có thông tin tiến độ -->
                        <div v-if="ord.ticketsTarget && ord.ticketsTarget > 0" class="w-24 text-right">
                          <div class="flex justify-between text-[9px] text-slate-400 font-mono">
                            <span>{{ ord.ticketsConfirmed || 0 }}/{{ ord.ticketsTarget }} vé</span>
                            <span>{{ Math.min(100, Math.round(((ord.ticketsConfirmed || 0) / ord.ticketsTarget) * 100)) }}%</span>
                          </div>
                          <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-0.5">
                            <div
                              class="h-full bg-sky-500 rounded-full transition-all duration-300"
                              :style="{ width: `${Math.min(100, Math.round(((ord.ticketsConfirmed || 0) / ord.ticketsTarget) * 100))}%` }"
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Popup Tiến Trình Đặt Đơn Siêu Tốc -->
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
            Đang thanh toán và tạo <strong>{{ validCodeCount }}</strong> đơn hàng vào hệ thống
          </p>
        </div>

        <div class="space-y-1.5">
          <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full transition-all duration-300"
              :style="{ width: submitProgressPercent + '%' }"
            ></div>
          </div>
          <div class="flex justify-between text-[11px] text-slate-400">
            <span>Tiến trình</span>
            <span class="font-bold text-sky-600">{{ submitProgressPercent }}%</span>
          </div>
        </div>

        <p class="text-[11px] text-slate-400 italic">
          Vui lòng đợi giây lát, hệ thống đang đồng bộ với đối tác...
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatVND, formatDate, generateIdempotencyKey } from '@/utils/format'
import { useAuthStore } from '@/stores/auth'
import { productService } from '@/services/product.service'
import { orderService } from '@/services/order.service'
import { walletService } from '@/services/wallet.service'
import type { Product, Order, OrderStatus } from '@/types'
import {
  Plus,
  Trash2,
  TicketPercent,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Copy,
  PackageSearch,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Danh sách toàn bộ sản phẩm để chọn qua lại
const allProducts = ref<Product[]>([])
const currentProduct = ref<Product | null>(null)
const isLoading = ref(true)

// Danh sách các dòng nhập Code & Số lượng
export interface CodeRowItem {
  code: string
  quantity: number
}

const codeRows = ref<CodeRowItem[]>([
  { code: '', quantity: 1 },
])
const customerNote = ref('')

// Voucher State
const voucherInput = ref('')
const appliedVoucher = ref<string | null>(null)
const voucherDiscount = ref(0)
const isValidatingVoucher = ref(false)
const isVoucherValid = ref(false)
const voucherMessage = ref('')

// Submit Order State
const isSubmitting = ref(false)
const submitProgressPercent = ref(0)
const alertMessage = ref('')
const alertType = ref<'success' | 'error'>('success')

// Orders List Tracking State
const ordersList = ref<Order[]>([])
const isLoadingOrders = ref(false)
const activeTrackingTab = ref<'active' | 'done' | 'all'>('active')
let pollingTimer: any = null

const statusLabels: Record<OrderStatus, string> = {
  queued: 'Chờ gửi',
  sending: 'Đang gửi đối tác',
  processing: 'Đang xử lý',
  completed: 'Hoàn tất (Done)',
  failed: 'Thất bại',
  refunded: 'Đã hoàn tiền',
  cancelled: 'Đã hủy',
}

const statusStyles: Record<OrderStatus, string> = {
  queued: 'bg-slate-100 text-slate-700',
  sending: 'bg-sky-50 text-sky-700',
  processing: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-rose-50 text-rose-700',
  refunded: 'bg-purple-50 text-purple-700',
  cancelled: 'bg-slate-100 text-slate-600',
}

const statusDots: Record<OrderStatus, string> = {
  queued: 'bg-slate-400',
  sending: 'bg-sky-500 animate-pulse',
  processing: 'bg-amber-500 animate-pulse',
  completed: 'bg-emerald-500',
  failed: 'bg-rose-500',
  refunded: 'bg-purple-500',
  cancelled: 'bg-slate-400',
}

const trackingTabs = computed(() => [
  { label: '⚡ Đang Chạy', value: 'active' as const, count: ordersList.value.filter(o => ['queued', 'sending', 'processing'].includes(o.status)).length },
  { label: '✅ Đã Done', value: 'done' as const, count: ordersList.value.filter(o => o.status === 'completed').length },
  { label: 'Tất Cả', value: 'all' as const, count: ordersList.value.length },
])

const filteredOrders = computed(() => {
  if (activeTrackingTab.value === 'active') {
    return ordersList.value.filter(o => ['queued', 'sending', 'processing'].includes(o.status))
  }
  if (activeTrackingTab.value === 'done') {
    return ordersList.value.filter(o => o.status === 'completed')
  }
  return ordersList.value
})

// Tính đơn giá theo tier của user
const calculateEffectiveUnitPrice = (p: Product) => {
  if (!p) return 0
  if (authStore.isAdmin) return 0 // Admin giảm 100%
  const base = p.price
  if (authStore.userTierDiscount > 0) {
    return Math.max(0, Math.round(base * (100 - authStore.userTierDiscount) / 100))
  }
  return base
}

const effectiveUnitPrice = computed(() => {
  if (!currentProduct.value) return 0
  return calculateEffectiveUnitPrice(currentProduct.value)
})

// Tổng số lượng
const totalItemsQuantity = computed(() => {
  return codeRows.value.reduce((sum, r) => sum + (Number(r.quantity) > 0 ? Number(r.quantity) : 1), 0)
})

const validCodeCount = computed(() => {
  return codeRows.value.filter(r => r.code.trim()).length
})

// Tạm tính
const rawSubtotal = computed(() => {
  return effectiveUnitPrice.value * totalItemsQuantity.value
})

// Tổng thanh toán sau voucher
const finalPaymentAmount = computed(() => {
  const total = rawSubtotal.value - voucherDiscount.value
  return total > 0 ? total : 0
})

const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
  alertMessage.value = msg
  alertType.value = type
  setTimeout(() => {
    if (alertMessage.value === msg) alertMessage.value = ''
  }, 6000)
}

// Chuyển đổi gói sản phẩm
const selectProduct = (p: Product) => {
  currentProduct.value = p
  router.replace(`/products/${p.slug}`)
  if (appliedVoucher.value) {
    // Re-validate voucher on product switch
    applyVoucher()
  }
}

// Thêm / Xóa dòng code
const addCodeRow = () => {
  if (codeRows.value.length >= 10) {
    showAlert('Mỗi lần đặt chỉ hỗ trợ tối đa 10 Code Sự kiện!', 'error')
    return
  }
  codeRows.value.push({ code: '', quantity: 1 })
}

const removeCodeRow = (idx: number) => {
  if (codeRows.value.length > 1) {
    codeRows.value.splice(idx, 1)
  }
}

// Áp dụng voucher trực tiếp
const applyVoucher = async () => {
  if (!voucherInput.value.trim() || !currentProduct.value) return
  isValidatingVoucher.value = true
  voucherMessage.value = ''

  try {
    const res = await orderService.validateVoucher({
      code: voucherInput.value.trim().toUpperCase(),
      productId: currentProduct.value.id,
      quantity: totalItemsQuantity.value,
    })

    if (res.valid && res.discountAmount > 0) {
      appliedVoucher.value = voucherInput.value.trim().toUpperCase()
      voucherDiscount.value = res.discountAmount
      isVoucherValid.value = true
      voucherMessage.value = `Áp dụng thành công! Đã giảm ${formatVND(res.discountAmount)}`
    } else {
      appliedVoucher.value = null
      voucherDiscount.value = 0
      isVoucherValid.value = false
      voucherMessage.value = res.message || 'Mã giảm giá không hợp lệ hoặc chưa đủ điều kiện áp dụng.'
    }
  } catch (err: any) {
    appliedVoucher.value = null
    voucherDiscount.value = 0
    isVoucherValid.value = false
    const msg = err.response?.data?.error?.message || err.message || 'Mã giảm giá không hợp lệ'
    voucherMessage.value = msg
  } finally {
    isValidatingVoucher.value = false
  }
}

const removeVoucher = () => {
  appliedVoucher.value = null
  voucherDiscount.value = 0
  voucherInput.value = ''
  voucherMessage.value = ''
}

// Đặt đơn trực tiếp
const handleSubmitOrder = async () => {
  const validRows = codeRows.value
    .map(r => ({ code: r.code.trim(), quantity: Number(r.quantity) > 0 ? Number(r.quantity) : 1 }))
    .filter(r => r.code)

  if (validRows.length === 0) {
    showAlert('Vui lòng nhập ít nhất một mã Code sự kiện hợp lệ!', 'error')
    return
  }

  if (validRows.length > 10) {
    showAlert('Giới hạn tối đa 10 code cho 1 lần thanh toán!', 'error')
    return
  }

  if (!currentProduct.value) return

  isSubmitting.value = true
  submitProgressPercent.value = 20

  const masterKey = generateIdempotencyKey()
  const interval = setInterval(() => {
    if (submitProgressPercent.value < 85) {
      submitProgressPercent.value += 15
    }
  }, 120)

  try {
    if (validRows.length > 1) {
      await orderService.createMultiOrders({
        productId: currentProduct.value.id,
        items: validRows,
        voucherCode: appliedVoucher.value || undefined,
        customerNote: customerNote.value.trim() || undefined,
      }, masterKey)
    } else {
      await orderService.createOrder({
        productId: currentProduct.value.id,
        inputs: {
          accountId: validRows[0]!.code,
          code: validRows[0]!.code,
        },
        voucherCode: appliedVoucher.value || undefined,
        customerNote: customerNote.value.trim() || undefined,
      }, masterKey)
    }

    submitProgressPercent.value = 100
    clearInterval(interval)

    // Đồng bộ lại ví
    try {
      const w = await walletService.getWallet()
      authStore.updateBalance(w.balance)
    } catch {
      authStore.updateBalance(authStore.userBalance - finalPaymentAmount.value)
    }

    showAlert(`🎉 Đã đặt thành công ${validRows.length} đơn hàng! Đang xử lý tự động...`, 'success')

    // Reset code inputs
    codeRows.value = [{ code: '', quantity: 1 }]
    customerNote.value = ''
    removeVoucher()

    // Chờ 300ms rồi ẩn modal và load lại tiến trình đơn hàng
    setTimeout(() => {
      isSubmitting.value = false
      submitProgressPercent.value = 0
      loadOrders()
    }, 400)
  } catch (err: any) {
    clearInterval(interval)
    isSubmitting.value = false
    submitProgressPercent.value = 0
    const msg = err.response?.data?.error?.message || err.message || 'Có lỗi xảy ra khi tạo đơn hàng'
    showAlert(msg, 'error')
  }
}

// Tải danh sách đơn hàng để theo dõi tiến độ
const loadOrders = async () => {
  if (!authStore.isAuthenticated) return
  isLoadingOrders.value = true
  try {
    ordersList.value = await orderService.getOrders()
  } catch (err) {
    console.warn('Lỗi tải danh sách đơn:', err)
  } finally {
    isLoadingOrders.value = false
  }
}

const getOrderCodeInput = (ord: Order) => {
  const item = ord.items?.[0]
  if (!item?.inputs) return ''
  return item.inputs.code || item.inputs.accountId || ''
}

const copyText = (txt: string) => {
  if (!txt) return
  navigator.clipboard.writeText(txt)
  showAlert(`Đã copy: "${txt}"`, 'success')
}

onMounted(async () => {
  isLoading.value = true
  try {
    // 1. Tải toàn bộ danh sách sản phẩm
    const prods = await productService.getProducts()
    // Sắp xếp theo giá gói từ nhỏ đến lớn
    prods.sort((a, b) => a.price - b.price)
    allProducts.value = prods

    // 2. Tìm sản phẩm hiện tại theo slug từ router params
    const slug = route.params.slug as string
    if (slug) {
      currentProduct.value = prods.find(p => p.slug === slug) || prods[0] || null
    } else if (prods.length > 0) {
      currentProduct.value = prods[0] || null
    }

    // 3. Tải đơn hàng của người dùng để hiển thị tiến độ
    if (authStore.isAuthenticated) {
      await loadOrders()
    }
  } catch (err) {
    console.warn('Error loading product detail data:', err)
  } finally {
    isLoading.value = false
  }

  // 4. Polling tự động kiểm tra tiến độ mỗi 6 giây nếu có đơn đang chạy
  pollingTimer = setInterval(() => {
    const hasActiveOrders = ordersList.value.some(o => ['queued', 'sending', 'processing'].includes(o.status))
    if (authStore.isAuthenticated && hasActiveOrders && !isLoadingOrders.value && !isSubmitting.value) {
      orderService.getOrders().then(orders => {
        ordersList.value = orders
      }).catch(() => {})
    }
  }, 6000)
})

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
  }
})
</script>
