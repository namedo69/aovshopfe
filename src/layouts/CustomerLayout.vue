<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-800">
    <!-- Top banner nếu môi trường Staging/Dev -->
    <div v-if="appEnv !== 'production'" class="bg-amber-400 text-amber-950 text-xs py-1 px-4 text-center font-medium shadow-inner">
      ⚠️ Môi trường thử nghiệm ({{ appEnv.toUpperCase() }}) - Vui lòng không sử dụng giao dịch tiền thật!
    </div>

    <!-- Sky-blue Gradient Header -->
    <header class="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-sky-100 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-2 group">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Sparkles class="w-5 h-5" />
          </div>
          <div>
            <span class="text-xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">langxang.shop</span>
            <span class="hidden sm:inline-block ml-1 text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 font-semibold border border-sky-200">Sky</span>
          </div>
        </router-link>

        <!-- Navigation Links -->
        <nav class="hidden md:flex items-center gap-6">
          <router-link to="/products" class="text-slate-600 hover:text-sky-600 font-medium transition-colors" active-class="text-sky-600 font-semibold">
            Gói dịch vụ
          </router-link>
          <router-link v-if="authStore.isAuthenticated" to="/orders" class="text-slate-600 hover:text-sky-600 font-medium transition-colors" active-class="text-sky-600 font-semibold">
            Đơn hàng
          </router-link>
          <router-link v-if="authStore.isAdmin" to="/admin" class="text-sky-600 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg font-medium transition-colors border border-sky-200 flex items-center gap-1.5">
            <ShieldCheck class="w-4 h-4" />
            Quản trị Admin
          </router-link>
        </nav>

        <!-- Right Side / User Actions -->
        <div class="flex items-center gap-3">
          <template v-if="authStore.isAuthenticated">
            <!-- Balance pill -->
            <router-link to="/wallet" class="flex items-center gap-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 px-3 py-1.5 rounded-full text-sm font-medium transition-all shadow-xs">
              <Wallet class="w-4 h-4 text-sky-600" />
              <span>{{ formatVND(authStore.userBalance) }}</span>
            </router-link>

            <!-- Quick deposit button -->
            <router-link to="/deposit" class="hidden sm:flex items-center gap-1 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white px-3.5 py-1.5 rounded-full text-sm font-medium shadow-sm shadow-sky-500/20 transition-all hover:shadow">
              <PlusCircle class="w-4 h-4" />
              <span>Nạp tiền</span>
            </router-link>

            <!-- User Menu Trigger (Click toggle & Click outside to close) -->
            <div class="relative" ref="userMenuRef">
              <button
                @click="isUserMenuOpen = !isUserMenuOpen"
                class="flex items-center gap-2 text-slate-700 p-1 rounded-full hover:bg-sky-50 transition border border-transparent hover:border-sky-200"
              >
                <div class="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center border border-sky-300 shadow-xs">
                  {{ userInitial }}
                </div>
              </button>
              <!-- Dropdown menu -->
              <div
                v-show="isUserMenuOpen"
                class="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-sky-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                <div class="px-4 py-2 border-b border-slate-100 text-xs text-slate-500">
                  Xin chào, <strong class="text-slate-800 block truncate">{{ authStore.user?.email }}</strong>
                </div>
                <router-link
                  to="/wallet"
                  @click="isUserMenuOpen = false"
                  class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition"
                >
                  <Wallet class="w-4 h-4 text-sky-500" /> Số dư: {{ formatVND(authStore.userBalance) }}
                </router-link>
                <router-link
                  to="/orders"
                  @click="isUserMenuOpen = false"
                  class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition"
                >
                  <Package class="w-4 h-4 text-sky-500" /> Đơn hàng của tôi
                </router-link>
                <router-link
                  v-if="authStore.isAdmin"
                  to="/admin"
                  @click="isUserMenuOpen = false"
                  class="flex items-center gap-2.5 px-4 py-2 text-sm text-sky-700 font-medium hover:bg-sky-50 transition"
                >
                  <ShieldCheck class="w-4 h-4 text-sky-600" /> Quản trị Admin
                </router-link>
                <div class="my-1 border-t border-slate-100"></div>
                <button
                  @click="handleLogout"
                  class="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut class="w-4 h-4" /> Đăng xuất
                </button>
              </div>
            </div>
          </template>

          <template v-else>
            <router-link to="/login" class="text-slate-600 hover:text-sky-600 font-medium text-sm px-3 py-1.5">
              Đăng nhập
            </router-link>
            <router-link to="/register" class="bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm shadow-sky-500/20 transition hover:shadow">
              Đăng ký
            </router-link>
          </template>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1">
      <router-view />
    </main>

    <!-- Sky-toned Footer -->
    <footer class="bg-white border-t border-sky-100 mt-12 py-10 text-slate-500 text-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div class="md:col-span-2 space-y-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold">
              <Sparkles class="w-4 h-4" />
            </div>
            <span class="text-lg font-bold text-slate-800">langxang.shop</span>
          </div>
          <p class="text-slate-500 max-w-sm text-sm leading-relaxed">
            Hệ thống cung cấp dịch vụ và tài khoản game uy tín, tự động hoá thanh toán qua VietQR SePay nhanh chóng 24/7.
          </p>
        </div>

        <div>
          <h4 class="font-semibold text-slate-800 mb-3">Dịch vụ</h4>
          <ul class="space-y-2">
            <li><router-link to="/products" class="hover:text-sky-600 transition">Danh sách gói</router-link></li>
            <li><router-link to="/deposit" class="hover:text-sky-600 transition">Nạp tiền SePay</router-link></li>
            <li><router-link to="/orders" class="hover:text-sky-600 transition">Tra cứu đơn</router-link></li>
          </ul>
        </div>

        <div>
          <h4 class="font-semibold text-slate-800 mb-3">Hỗ trợ</h4>
          <ul class="space-y-2">
            <li><a href="#" class="hover:text-sky-600 transition">Điều khoản sử dụng</a></li>
            <li><a href="#" class="hover:text-sky-600 transition">Chính sách hoàn tiền</a></li>
            <li><a href="#" class="hover:text-sky-600 transition">Liên hệ CSKH</a></li>
          </ul>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-4">
        <span>© 2026 langxang.shop. Bản quyền thuộc về langxang.shop Team.</span>
        <div class="flex items-center gap-2">
          <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Hệ thống hoạt động bình thường</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { formatVND } from '@/utils/format'
import { Sparkles, Wallet, PlusCircle, ShieldCheck, Package, LogOut } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

const isUserMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

const appEnv = import.meta.env.VITE_APP_ENV || 'production'

const userInitial = computed(() => {
  if (!authStore.user?.email) return 'U'
  return authStore.user.email.charAt(0).toUpperCase()
})

const handleClickOutside = (event: MouseEvent) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    isUserMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleLogout = async () => {
  isUserMenuOpen.value = false
  await authStore.logout()
  router.push('/login')
}
</script>
