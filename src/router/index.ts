import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Layouts
import CustomerLayout from '@/layouts/CustomerLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'

// Customer Pages
import HomePage from '@/pages/shop/HomePage.vue'
import ProductListPage from '@/pages/shop/ProductListPage.vue'
import ProductDetailPage from '@/pages/shop/ProductDetailPage.vue'
import LoginPage from '@/pages/auth/LoginPage.vue'
import RegisterPage from '@/pages/auth/RegisterPage.vue'
import WalletPage from '@/pages/wallet/WalletPage.vue'
import DepositPage from '@/pages/wallet/DepositPage.vue'
import CheckoutPage from '@/pages/orders/CheckoutPage.vue'
import OrderListPage from '@/pages/orders/OrderListPage.vue'
import OrderDetailPage from '@/pages/orders/OrderDetailPage.vue'

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard.vue'
import AdminProductsPage from '@/pages/admin/AdminProductsPage.vue'
import AdminUsersPage from '@/pages/admin/AdminUsersPage.vue'
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage.vue'
import AdminDepositsPage from '@/pages/admin/AdminDepositsPage.vue'
import AdminVouchersPage from '@/pages/admin/AdminVouchersPage.vue'
import AdminUserTiersPage from '@/pages/admin/AdminUserTiersPage.vue'

const routes: RouteRecordRaw[] = [
  // Customer Routes
  {
    path: '/',
    component: CustomerLayout,
    children: [
      { path: '', name: 'home', component: HomePage, meta: { title: 'Trang chủ' } },
      { path: 'products', name: 'products', component: ProductListPage, meta: { title: 'Danh sách gói' } },
      { path: 'products/:slug', name: 'product-detail', component: ProductDetailPage, meta: { title: 'Chi tiết gói' } },
      { path: 'login', name: 'login', component: LoginPage, meta: { guestOnly: true, title: 'Đăng nhập' } },
      { path: 'register', name: 'register', component: RegisterPage, meta: { guestOnly: true, title: 'Đăng ký' } },
      { path: 'wallet', name: 'wallet', component: WalletPage, meta: { requiresAuth: true, title: 'Ví cá nhân' } },
      { path: 'deposit', name: 'deposit', component: DepositPage, meta: { requiresAuth: true, title: 'Nạp tiền vào ví' } },
      { path: 'checkout', name: 'checkout', component: CheckoutPage, meta: { requiresAuth: true, title: 'Thanh toán' } },
      { path: 'orders', name: 'orders', component: OrderListPage, meta: { requiresAuth: true, title: 'Đơn hàng' } },
      { path: 'orders/:orderCode', name: 'order-detail', component: OrderDetailPage, meta: { requiresAuth: true, title: 'Chi tiết đơn' } },
    ],
  },

  // Admin Routes
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAdmin: true },
    children: [
      { path: '', name: 'admin-dashboard', component: AdminDashboard, meta: { title: 'Dashboard Quản trị' } },
      { path: 'products', name: 'admin-products', component: AdminProductsPage, meta: { title: 'Quản lý gói' } },
      { path: 'users', name: 'admin-users', component: AdminUsersPage, meta: { title: 'Quản lý người dùng' } },
      { path: 'orders', name: 'admin-orders', component: AdminOrdersPage, meta: { title: 'Quản lý đơn hàng' } },
      { path: 'deposits', name: 'admin-deposits', component: AdminDepositsPage, meta: { title: 'Lịch sử nạp tiền' } },
      { path: 'vouchers', name: 'admin-vouchers', component: AdminVouchersPage, meta: { title: 'Quản lý Voucher' } },
      { path: 'tiers', name: 'admin-tiers', component: AdminUserTiersPage, meta: { title: 'Loại người dùng & Giá' } },
    ],
  },

  // Fallback 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// Route Guards
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Đảm bảo khởi tạo auth một lần từ cookie HttpOnly
  if (!authStore.isInitialized) {
    await authStore.initAuth()
  }

  // Cập nhật title trình duyệt
  const appName = import.meta.env.VITE_APP_NAME || 'langxang.shop'
  document.title = to.meta.title ? `${to.meta.title} — ${appName}` : appName

  // Kiểm tra guest only
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next({ path: '/' })
  }

  // Kiểm tra yêu cầu đăng nhập
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  // Kiểm tra yêu cầu quyền admin
  if (to.meta.requiresAdmin) {
    if (!authStore.isAuthenticated) {
      return next({ path: '/login', query: { redirect: to.fullPath } })
    }
    if (!authStore.isAdmin) {
      return next({ path: '/' })
    }
  }

  next()
})
