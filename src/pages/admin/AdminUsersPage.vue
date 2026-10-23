<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Quản Lý Người Dùng</h1>
        <p class="text-sm text-slate-500">Danh sách tài khoản khách hàng, cộng/trừ số dư ví và phân quyền</p>
      </div>

      <button
        @click="loadUsers"
        :disabled="isLoading"
        class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
      >
        <RotateCcw :class="['w-3.5 h-3.5', isLoading && 'animate-spin text-sky-600']" />
        <span>Làm mới</span>
      </button>
    </div>

    <!-- Alert notification -->
    <div v-if="alertMessage" :class="['p-4 rounded-xl text-sm flex items-center justify-between', alertType === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200']">
      <span>{{ alertMessage }}</span>
      <button @click="alertMessage = ''" class="font-bold ml-4">✕</button>
    </div>

    <!-- Search & Filter bar -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="relative w-full md:w-80">
        <input
          v-model="userSearchQuery"
          type="text"
          placeholder="Tìm theo email hoặc họ tên..."
          class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs outline-none bg-slate-50/50"
        />
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
      </div>

      <div class="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
        <button
          v-for="role in roleFilters"
          :key="role.value"
          @click="currentRoleFilter = role.value"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer',
            currentRoleFilter === role.value
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
          ]"
        >
          {{ role.label }}
          <span
            v-if="role.count !== undefined"
            :class="[
              'ml-1 px-1.5 py-0.2 rounded-full text-[10px]',
              currentRoleFilter === role.value ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'
            ]"
          >
            {{ role.count }}
          </span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
      <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2 text-sky-500" />
      <span>Đang tải danh sách người dùng...</span>
    </div>

    <!-- Users Table -->
    <div v-else class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div v-if="filteredUsers.length === 0" class="p-12 text-center text-slate-400">
        <Users class="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.2]" />
        <p class="font-medium text-slate-600">Không tìm thấy người dùng nào phù hợp</p>
      </div>

      <table v-else class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-slate-500 text-xs border-b border-slate-100">
          <tr>
            <th class="py-3.5 px-6 font-semibold">Tên & Email</th>
            <th class="py-3.5 px-6 font-semibold">Loại Tài Khoản</th>
            <th class="py-3.5 px-6 font-semibold">Thống Kê Đơn</th>
            <th class="py-3.5 px-6 font-semibold">Số Dư Ví</th>
            <th class="py-3.5 px-6 font-semibold">Trạng Thái</th>
            <th class="py-3.5 px-6 font-semibold text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-slate-700">
          <tr v-for="user in paginatedUsers" :key="user.id" class="hover:bg-slate-50/50 transition">
            <td class="py-4 px-6">
              <div class="font-medium text-slate-900">{{ user.name || 'Chưa đặt tên' }}</div>
              <div class="text-xs text-slate-400 font-mono">{{ user.email }}</div>
              <div class="text-[11px] text-slate-400 mt-0.5">Tạo: {{ formatDate(user.createdAt) }}</div>
            </td>
            <td class="py-4 px-6">
              <div class="space-y-1">
                <span
                  :class="[
                    'px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1',
                    user.role === 'admin' || user.tierCode === 'admin'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : user.tierCode === 'ctv'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  ]"
                >
                  <span>{{ user.role === 'admin' ? '👑' : user.tierCode === 'ctv' ? '⭐' : '👤' }}</span>
                  <span>{{ user.tierName || (user.role === 'admin' ? 'Quản trị viên' : 'Thành viên') }}</span>
                  <span class="text-[10px] opacity-75 font-mono">({{ user.role === 'admin' ? '-100%' : `-${user.tierDiscount || 0}%` }})</span>
                </span>
                <button
                  @click="openTierModal(user)"
                  class="block text-[11px] text-sky-600 hover:text-sky-700 font-medium hover:underline cursor-pointer"
                >
                  Đổi loại tài khoản
                </button>
              </div>
            </td>
            <!-- Thống kê số đơn của từng tài khoản -->
            <td class="py-4 px-6">
              <div class="space-y-1">
                <div class="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <span>{{ user.totalOrders || 0 }} đơn</span>
                  <span class="text-sky-700 font-extrabold bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                    {{ user.totalCodes || user.totalOrders || 0 }} code
                  </span>
                </div>
                <div class="flex items-center gap-1.5 text-[11px]">
                  <span class="text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                    {{ user.completedOrders || 0 }} xong
                  </span>
                  <span v-if="(user.processingOrders || 0) > 0" class="text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.2 rounded">
                    {{ user.processingOrders }} đang chạy
                  </span>
                </div>
                <div class="flex items-center justify-between text-[11px] pt-0.5">
                  <span class="text-slate-400">Chi: <strong class="text-slate-700">{{ formatVND(user.totalSpent || 0) }}</strong></span>
                  <button
                    @click="openUserOrdersModal(user)"
                    class="text-sky-600 hover:text-sky-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer ml-2"
                  >
                    <Eye class="w-3 h-3" /> Xem {{ user.totalCodes || user.totalOrders || 0 }} code
                  </button>
                </div>
              </div>
            </td>
            <td class="py-4 px-6 font-bold text-sky-600">
              {{ formatVND(user.balance ?? 0) }}
            </td>
            <td class="py-4 px-6">
              <span
                :class="[
                  'px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5',
                  user.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                ]"
              >
                <span :class="['w-1.5 h-1.5 rounded-full', user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500']"></span>
                {{ user.status === 'active' ? 'Hoạt động' : 'Đã khóa' }}
              </span>
            </td>
            <td class="py-4 px-6 text-right space-y-1">
              <!-- Nút Xem Code & Đơn Hàng -->
              <div>
                <button
                  @click="openUserOrdersModal(user)"
                  class="text-xs text-sky-600 hover:text-sky-700 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Eye class="w-3.5 h-3.5" /> Xem Code ({{ user.totalCodes || user.totalOrders || 0 }})
                </button>
              </div>

              <!-- Nút cộng/trừ tiền ví -->
              <div>
                <button
                  @click="openBalanceModal(user)"
                  class="text-xs text-emerald-600 hover:text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle class="w-3.5 h-3.5" /> Chỉnh số dư
                </button>
              </div>

              <!-- Khóa / Mở khóa -->
              <div>
                <button
                  v-if="user.status === 'active'"
                  @click="toggleStatus(user, 'blocked')"
                  class="text-xs text-rose-600 font-medium hover:underline cursor-pointer"
                >
                  Khóa tài khoản
                </button>
                <button
                  v-else
                  @click="toggleStatus(user, 'active')"
                  class="text-xs text-emerald-600 font-medium hover:underline cursor-pointer"
                >
                  Mở khóa
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Thanh Phân Trang Người Dùng -->
      <AdminPagination
        v-if="filteredUsers.length > 0"
        v-model:currentPage="currentPage"
        v-model:pageSize="pageSize"
        :totalItems="filteredUsers.length"
      />
    </div>

    <!-- Modal Điều chỉnh số dư ví -->
    <div v-if="isBalanceModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-800">Điều Chỉnh Số Dư Ví</h3>
            <p class="text-xs text-slate-400 mt-0.5">Tài khoản: {{ targetUser?.email }}</p>
          </div>
          <button @click="isBalanceModalOpen = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
        </div>

        <form @submit.prevent="handleAdjustBalance" class="p-6 space-y-4">
          <!-- Số dư hiện tại -->
          <div class="p-3 bg-sky-50 rounded-xl border border-sky-100 flex justify-between items-center text-sm">
            <span class="text-slate-500">Số dư hiện tại:</span>
            <span class="font-bold text-sky-700">{{ formatVND(targetUser?.balance ?? 0) }}</span>
          </div>

          <!-- Loại điều chỉnh -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1.5">Loại thao tác</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="adjustType = 'credit'"
                :class="[
                  'py-2 px-3 text-xs font-semibold rounded-xl border transition text-center cursor-pointer',
                  adjustType === 'credit' ? 'bg-emerald-50 text-emerald-700 border-emerald-500' : 'border-slate-200 text-slate-600'
                ]"
              >
                ➕ Cộng Thêm Tiền
              </button>
              <button
                type="button"
                @click="adjustType = 'debit'"
                :class="[
                  'py-2 px-3 text-xs font-semibold rounded-xl border transition text-center cursor-pointer',
                  adjustType === 'debit' ? 'bg-rose-50 text-rose-700 border-rose-500' : 'border-slate-200 text-slate-600'
                ]"
              >
                ➖ Trừ Bớt Tiền
              </button>
            </div>
          </div>

          <!-- Nhập số tiền -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Số tiền (VNĐ) *</label>
            <input
              v-model.number="adjustAmount"
              type="number"
              min="1000"
              step="1000"
              required
              placeholder="VD: 50000"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none font-bold"
            />
          </div>

          <!-- Lý do -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Lý do điều chỉnh (lưu sổ giao dịch) *</label>
            <input
              v-model="adjustReason"
              type="text"
              required
              placeholder="VD: Nạp bù sự kiện, hoàn tiền giao dịch..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm outline-none"
            />
          </div>

          <!-- Xem trước số dư sau điều chỉnh -->
          <div class="pt-2 flex justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>Dự kiến sau điều chỉnh:</span>
            <span class="font-bold text-slate-800">{{ formatVND(predictedBalance) }}</span>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="isBalanceModalOpen = false"
              class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || adjustAmount <= 0"
              class="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <span>Xác Nhận Cập Nhật</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Phân Loại Người Dùng (Tier) -->
    <div v-if="isTierModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-800">Phân Loại Người Dùng</h3>
            <p class="text-xs text-slate-400 mt-0.5">Tài khoản: {{ targetTierUser?.email }}</p>
          </div>
          <button @click="isTierModalOpen = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
        </div>

        <form @submit.prevent="handleSaveTier" class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-2">Chọn Loại Tài Khoản</label>
            <div class="space-y-2">
              <div
                v-for="t in availableTiers"
                :key="t.id"
                @click="selectedTierId = t.id"
                :class="[
                  'p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between',
                  selectedTierId === t.id
                    ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                ]"
              >
                <div>
                  <div class="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <span>{{ t.code === 'admin' ? '👑' : t.code === 'ctv' ? '⭐' : '👤' }}</span>
                    <span>{{ t.name }}</span>
                  </div>
                  <div class="text-xs text-slate-400 mt-0.5">{{ t.description || 'Chưa có mô tả' }}</div>
                </div>

                <div class="text-right">
                  <span
                    :class="[
                      'px-2.5 py-1 rounded-full text-xs font-bold font-mono',
                      t.discountPercent > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    ]"
                  >
                    -{{ t.discountPercent }}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
            <div class="font-bold">Lưu ý khi phân loại:</div>
            <div>• Quản trị viên (Admin) mặc định được giảm giá 100% khi tạo đơn.</div>
            <div>• CTV sẽ được hưởng mức chiết khấu riêng theo cấu hình của loại.</div>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="isTierModalOpen = false"
              class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <span>Cập Nhật Loại Tài Khoản</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Xem Chi Tiết Code & Đơn Hàng Của Tài Khoản Cụ Thể -->
    <div v-if="isOrdersModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-bold text-slate-800">Chi Tiết Code & Đơn Hàng</h3>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                {{ targetOrdersUser?.name || 'Khách hàng' }}
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              Email: <strong class="text-slate-700 font-mono">{{ targetOrdersUser?.email }}</strong> • 
              Loại: <span class="font-bold text-sky-600">{{ targetOrdersUser?.tierName || 'Thành viên' }}</span> • 
              Số dư: <span class="font-bold text-emerald-600">{{ formatVND(targetOrdersUser?.balance ?? 0) }}</span>
            </p>
          </div>
          <button @click="isOrdersModalOpen = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
        </div>

        <!-- 4 Thẻ KPI thống kê nhanh -->
        <div class="p-6 pb-2 shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div class="text-[11px] font-semibold text-slate-400 uppercase">Tổng số đơn</div>
            <div class="text-xl font-black text-slate-800 mt-1">{{ userOrdersList.length }} đơn</div>
          </div>

          <div class="bg-sky-50 p-3.5 rounded-xl border border-sky-200">
            <div class="text-[11px] font-semibold text-sky-700 uppercase">Tổng số code đã đặt</div>
            <div class="text-xl font-black text-sky-600 mt-1">{{ modalTotalCodes }} code</div>
          </div>

          <div class="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
            <div class="text-[11px] font-semibold text-emerald-700 uppercase">Đã hoàn thành</div>
            <div class="text-xl font-black text-emerald-600 mt-1">{{ modalCompletedCodes }} code</div>
          </div>

          <div class="bg-purple-50 p-3.5 rounded-xl border border-purple-200">
            <div class="text-[11px] font-semibold text-purple-700 uppercase">Tổng chi tiêu</div>
            <div class="text-xl font-black text-purple-700 mt-1">{{ formatVND(modalTotalSpent) }}</div>
          </div>
        </div>

        <!-- Search bar inside modal -->
        <div class="px-6 py-2 shrink-0 flex items-center justify-between gap-4">
          <div class="relative flex-1">
            <input
              v-model="orderModalSearchQuery"
              type="text"
              placeholder="Tìm theo mã đơn, mã code sự kiện, tên gói..."
              class="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none bg-slate-50/50 focus:border-sky-500"
            />
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <button
            @click="refreshUserOrders"
            :disabled="isLoadingUserOrders"
            class="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw :class="['w-3.5 h-3.5', isLoadingUserOrders && 'animate-spin text-sky-600']" />
            <span>Làm mới</span>
          </button>
        </div>

        <!-- Orders Table List -->
        <div class="p-6 pt-2 overflow-y-auto flex-1">
          <div v-if="isLoadingUserOrders" class="py-16 text-center text-slate-400">
            <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2 text-sky-500" />
            <span class="text-xs">Đang tải toàn bộ code và đơn hàng của tài khoản...</span>
          </div>

          <div v-else-if="filteredUserOrders.length === 0" class="py-16 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Users class="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.2]" />
            <p class="font-medium text-slate-600 text-sm">Tài khoản này chưa đặt đơn hàng nào</p>
          </div>

          <div v-else class="overflow-hidden rounded-2xl border border-slate-200">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 text-[11px] border-b border-slate-100">
                <tr>
                  <th class="py-2.5 px-4 font-semibold">Mã Đơn & Thời Gian</th>
                  <th class="py-2.5 px-4 font-semibold">Gói Dịch Vụ</th>
                  <th class="py-2.5 px-4 font-semibold">Mã Code Sự Kiện</th>
                  <th class="py-2.5 px-3 font-semibold text-center">Số Lượng</th>
                  <th class="py-2.5 px-4 font-semibold">Thanh Toán</th>
                  <th class="py-2.5 px-4 font-semibold text-right">Trạng Thái</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr v-for="ord in filteredUserOrders" :key="ord.id" class="hover:bg-slate-50/50 transition">
                  <td class="py-3 px-4 font-mono font-bold text-slate-800">
                    <div>{{ ord.orderCode }}</div>
                    <div class="text-[10px] text-slate-400 font-sans font-normal mt-0.5">{{ formatDate(ord.createdAt) }}</div>
                  </td>

                  <td class="py-3 px-4 font-semibold text-slate-800">
                    {{ ord.items?.[0]?.productName || 'Gói Dịch Vụ' }}
                  </td>

                  <td class="py-3 px-4">
                    <div class="flex items-center gap-1.5 font-mono text-xs font-bold text-sky-800">
                      <span>{{ getOrderCode(ord) || '—' }}</span>
                      <button
                        v-if="getOrderCode(ord)"
                        @click="copyCode(getOrderCode(ord))"
                        class="text-slate-400 hover:text-sky-600 transition p-1 rounded hover:bg-sky-50"
                        title="Copy mã code"
                      >
                        <Copy class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  <td class="py-3 px-3 text-center font-bold text-slate-800">
                    x{{ ord.items?.[0]?.quantity || 1 }}
                  </td>

                  <td class="py-3 px-4 font-bold text-slate-800">
                    {{ formatVND(ord.finalAmount) }}
                  </td>

                  <td class="py-3 px-4 text-right">
                    <span
                      :class="[
                        'px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center gap-1',
                        statusStyles[ord.status] || 'bg-slate-100 text-slate-600'
                      ]"
                    >
                      <span :class="['w-1.5 h-1.5 rounded-full', statusDots[ord.status] || 'bg-slate-400']"></span>
                      {{ statusLabels[ord.status] || ord.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="p-4 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            type="button"
            @click="isOrdersModalOpen = false"
            class="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { formatVND, formatDate } from '@/utils/format'
import { Users, RotateCcw, Loader2, PlusCircle, Search, Eye, Copy } from 'lucide-vue-next'
import AdminPagination from '@/components/common/AdminPagination.vue'
import { adminService, type AdminUserListItem } from '@/services/admin.service'
import type { UserTier, Order, OrderStatus } from '@/types'

const usersList = ref<AdminUserListItem[]>([])
const availableTiers = ref<UserTier[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const alertMessage = ref('')
const alertType = ref<'success' | 'error'>('success')

// Modal Xem Chi Tiết Code & Đơn Hàng của User
const isOrdersModalOpen = ref(false)
const targetOrdersUser = ref<AdminUserListItem | null>(null)
const userOrdersList = ref<Order[]>([])
const isLoadingUserOrders = ref(false)
const orderModalSearchQuery = ref('')

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

const openUserOrdersModal = async (user: AdminUserListItem) => {
  targetOrdersUser.value = user
  isOrdersModalOpen.value = true
  orderModalSearchQuery.value = ''
  await refreshUserOrders()
}

const refreshUserOrders = async () => {
  if (!targetOrdersUser.value) return
  isLoadingUserOrders.value = true
  try {
    userOrdersList.value = await adminService.getUserOrders(targetOrdersUser.value.id)
  } catch (err) {
    console.warn('Lỗi tải danh sách đơn của user:', err)
  } finally {
    isLoadingUserOrders.value = false
  }
}

const getOrderCode = (ord: Order) => {
  const item = ord.items?.[0]
  if (!item) return ''
  let inp = item.inputs || (item as any).customerInput || (item as any).customer_input
  if (typeof inp === 'string') {
    try {
      inp = JSON.parse(inp)
    } catch {}
  }
  if (inp && typeof inp === 'object') {
    return inp.code || inp.accountId || inp.eventCode || Object.values(inp)[0] || ''
  }
  if (typeof inp === 'string') return inp
  return ''
}

const copyCode = (code: string) => {
  if (!code) return
  navigator.clipboard.writeText(code)
  showAlert(`Đã copy mã code: "${code}"`, 'success')
}

const filteredUserOrders = computed(() => {
  if (!orderModalSearchQuery.value.trim()) return userOrdersList.value
  const q = orderModalSearchQuery.value.trim().toLowerCase()
  return userOrdersList.value.filter(ord => {
    const code = getOrderCode(ord).toLowerCase()
    const orderCode = ord.orderCode.toLowerCase()
    const prodName = (ord.items?.[0]?.productName || '').toLowerCase()
    return code.includes(q) || orderCode.includes(q) || prodName.includes(q)
  })
})

const modalTotalCodes = computed(() => {
  return userOrdersList.value.reduce((sum, ord) => sum + (ord.items?.[0]?.quantity || 1), 0)
})

const modalCompletedCodes = computed(() => {
  return userOrdersList.value
    .filter(ord => ord.status === 'completed')
    .reduce((sum, ord) => sum + (ord.items?.[0]?.quantity || 1), 0)
})

const modalTotalSpent = computed(() => {
  return userOrdersList.value
    .filter(ord => ord.status === 'completed')
    .reduce((sum, ord) => sum + (ord.finalAmount || 0), 0)
})

// Pagination
const currentPage = ref(1)
const pageSize = ref(20)

// Filter & Search
const userSearchQuery = ref('')
const currentRoleFilter = ref<string>('all')

const roleFilters = computed(() => [
  { label: 'Tất cả', value: 'all', count: usersList.value.length },
  { label: 'Admin', value: 'admin', count: usersList.value.filter(u => u.role === 'admin' || u.tierCode === 'admin').length },
  { label: 'CTV', value: 'ctv', count: usersList.value.filter(u => u.tierCode === 'ctv').length },
  { label: 'Thành viên', value: 'member', count: usersList.value.filter(u => u.role !== 'admin' && u.tierCode !== 'ctv').length },
  { label: 'Đã khóa', value: 'blocked', count: usersList.value.filter(u => u.status === 'blocked').length },
])

const filteredUsers = computed(() => {
  return usersList.value.filter((user) => {
    // Lọc theo tier/role hoặc status
    if (currentRoleFilter.value === 'blocked') {
      if (user.status !== 'blocked') return false
    } else if (currentRoleFilter.value === 'admin') {
      if (user.role !== 'admin' && user.tierCode !== 'admin') return false
    } else if (currentRoleFilter.value === 'ctv') {
      if (user.tierCode !== 'ctv') return false
    } else if (currentRoleFilter.value === 'member') {
      if (user.role === 'admin' || user.tierCode === 'ctv') return false
    }

    // Tìm kiếm
    if (userSearchQuery.value.trim()) {
      const q = userSearchQuery.value.trim().toLowerCase()
      const matchEmail = user.email?.toLowerCase().includes(q)
      const matchName = user.name?.toLowerCase().includes(q)
      if (!matchEmail && !matchName) return false
    }

    return true
  })
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredUsers.value.slice(start, start + pageSize.value)
})

// Modal State
const isBalanceModalOpen = ref(false)
const targetUser = ref<AdminUserListItem | null>(null)
const adjustType = ref<'credit' | 'debit'>('credit')
const adjustAmount = ref<number>(50000)
const adjustReason = ref('')

const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
  alertMessage.value = msg
  alertType.value = type
  setTimeout(() => {
    if (alertMessage.value === msg) alertMessage.value = ''
  }, 4000)
}

const loadUsers = async () => {
  isLoading.value = true
  try {
    const [users, tiers] = await Promise.all([
      adminService.getUsers(),
      adminService.getUserTiers(),
    ])
    usersList.value = users
    availableTiers.value = tiers
  } catch (err: any) {
    showAlert('Không thể tải danh sách người dùng: ' + (err.message || ''), 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadUsers()
})

// Modal Phân Loại
const isTierModalOpen = ref(false)
const targetTierUser = ref<AdminUserListItem | null>(null)
const selectedTierId = ref<string>('')

const openTierModal = (user: AdminUserListItem) => {
  targetTierUser.value = user
  selectedTierId.value = user.tierId || (user.role === 'admin' ? 'tier_admin' : 'tier_member')
  isTierModalOpen.value = true
}

const handleSaveTier = async () => {
  if (!targetTierUser.value || !selectedTierId.value) return
  isSubmitting.value = true

  try {
    const chosenTier = availableTiers.value.find(t => t.id === selectedTierId.value)
    const newRole = chosenTier?.code === 'admin' ? 'admin' : 'customer'

    await adminService.updateUser(targetTierUser.value.id, {
      tierId: selectedTierId.value,
      role: newRole,
    })

    showAlert(`Đã cập nhật phân loại tài khoản "${targetTierUser.value.email}" thành ${chosenTier?.name || selectedTierId.value}!`)
    isTierModalOpen.value = false
    await loadUsers()
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message || 'Lỗi cập nhật phân loại'
    showAlert(msg, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const predictedBalance = computed(() => {
  const current = targetUser.value?.balance ?? 0
  const amt = adjustAmount.value || 0
  return adjustType.value === 'credit' ? current + amt : current - amt
})

const openBalanceModal = (user: AdminUserListItem) => {
  targetUser.value = user
  adjustType.value = 'credit'
  adjustAmount.value = 50000
  adjustReason.value = 'Admin nạp điều chỉnh thủ công'
  isBalanceModalOpen.value = true
}

const handleAdjustBalance = async () => {
  if (!targetUser.value) return
  if (predictedBalance.value < 0) {
    showAlert('Số dư sau khi trừ không thể âm!', 'error')
    return
  }

  isSubmitting.value = true
  try {
    const finalAmount = adjustType.value === 'credit' ? adjustAmount.value : -adjustAmount.value
    await adminService.adjustUserBalance(targetUser.value.id, finalAmount, adjustReason.value.trim())

    showAlert(`Đã ${adjustType.value === 'credit' ? 'cộng' : 'trừ'} ${formatVND(adjustAmount.value)} cho tài khoản ${targetUser.value.email} thành công!`)
    isBalanceModalOpen.value = false
    await loadUsers()
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message || 'Lỗi điều chỉnh số dư'
    showAlert(msg, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const toggleStatus = async (user: AdminUserListItem, newStatus: 'active' | 'blocked') => {
  const actionText = newStatus === 'blocked' ? 'khóa' : 'mở khóa'
  if (!confirm(`Bạn có chắc muốn ${actionText} tài khoản "${user.email}"?`)) return

  try {
    await adminService.updateUser(user.id, { status: newStatus })
    showAlert(`Đã ${actionText} tài khoản "${user.email}" thành công!`)
    await loadUsers()
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message || 'Lỗi thao tác'
    showAlert(msg, 'error')
  }
}
</script>
