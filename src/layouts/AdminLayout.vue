<template>
  <div class="min-h-screen flex bg-slate-100 text-slate-800">
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
      <!-- Logo & Env -->
      <div class="p-4 border-b border-slate-800 flex items-center justify-between">
        <router-link to="/admin" class="flex items-center gap-2 text-white font-bold text-lg">
          <div class="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <span>langxang Admin</span>
        </router-link>
        <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
          {{ appEnv }}
        </span>
      </div>

      <!-- Navigation links -->
      <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
        <router-link
          to="/admin"
          exact
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition"
          active-class="bg-sky-600 text-white hover:bg-sky-600"
        >
          <LayoutDashboard class="w-4 h-4" />
          Dashboard
        </router-link>

        <router-link
          to="/admin/products"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition"
          active-class="bg-sky-600 text-white hover:bg-sky-600"
        >
          <Package class="w-4 h-4" />
          Gói sản phẩm
        </router-link>

        <router-link
          to="/admin/users"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition"
          active-class="bg-sky-600 text-white hover:bg-sky-600"
        >
          <Users class="w-4 h-4" />
          Người dùng
        </router-link>

        <router-link
          to="/admin/orders"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition"
          active-class="bg-sky-600 text-white hover:bg-sky-600"
        >
          <ShoppingCart class="w-4 h-4" />
          Đơn hàng
        </router-link>

        <router-link
          to="/admin/deposits"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition"
          active-class="bg-sky-600 text-white hover:bg-sky-600"
        >
          <Banknote class="w-4 h-4" />
          Giao dịch nạp tiền
        </router-link>

        <router-link
          to="/admin/vouchers"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition"
          active-class="bg-sky-600 text-white hover:bg-sky-600"
        >
          <TicketPercent class="w-4 h-4" />
          Mã giảm giá
        </router-link>
      </nav>

      <!-- Bottom User & Exit -->
      <div class="p-3 border-t border-slate-800 space-y-2">
        <router-link to="/" class="flex items-center gap-2 text-xs text-sky-400 hover:text-sky-300 px-3 py-2 rounded transition">
          <ArrowLeft class="w-4 h-4" /> Về trang khách hàng
        </router-link>
        <button @click="handleLogout" class="w-full flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300 px-3 py-2 rounded transition">
          <LogOut class="w-4 h-4" /> Đăng xuất
        </button>
      </div>
    </aside>

    <!-- Admin Body -->
    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-slate-400 text-sm">Hệ thống quản trị /</span>
          <span class="text-slate-800 font-semibold text-sm">{{ pageTitle }}</span>
        </div>

        <div class="flex items-center gap-4">
          <div class="text-right text-xs">
            <div class="font-medium text-slate-800">{{ authStore.user?.email }}</div>
            <div class="text-sky-600 font-semibold">Administrator</div>
          </div>
        </div>
      </header>

      <main class="flex-1 p-6 overflow-y-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  ShieldCheck,
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Banknote,
  TicketPercent,
  ArrowLeft,
  LogOut,
} from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const appEnv = import.meta.env.VITE_APP_ENV || 'production'

const pageTitle = computed(() => {
  return (route.meta?.title as string) || 'Dashboard'
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
