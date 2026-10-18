<template>
  <div class="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-sky-100">
      <div class="text-center">
        <div class="mx-auto w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
          <UserPlus class="w-6 h-6" />
        </div>
        <h2 class="text-2xl font-bold text-slate-900">Tạo Tài Khoản Mới</h2>
        <p class="mt-2 text-sm text-slate-500">
          Đã có tài khoản?
          <router-link to="/login" class="font-medium text-sky-600 hover:text-sky-500">
            Đăng nhập
          </router-link>
        </p>
      </div>

      <!-- Error alert -->
      <div v-if="errorMessage" class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <form class="mt-8 space-y-5" @submit.prevent="handleRegister">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
          <input
            v-model="name"
            type="text"
            required
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition outline-none text-sm"
            placeholder="Nguyễn Văn A"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition outline-none text-sm"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Mật khẩu (tối thiểu 8 ký tự)</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition outline-none text-sm"
            placeholder="Tối thiểu 8 ký tự"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu</label>
          <input
            v-model="confirmPassword"
            type="password"
            required
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition outline-none text-sm"
            placeholder="Nhập lại mật khẩu"
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full flex justify-center py-2.5 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 transition"
        >
          <span v-if="isLoading">Đang đăng ký...</span>
          <span v-else>Đăng Ký Tài Khoản</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/auth.service'
import { UserPlus, AlertCircle } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const handleRegister = async () => {
  if (password.value.length < 8) {
    errorMessage.value = 'Mật khẩu phải có tối thiểu 8 ký tự theo quy định bảo mật!'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Mật khẩu xác nhận không khớp!'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await authService.register({
      name: name.value.trim() || email.value.split('@')[0],
      email: email.value.trim().toLowerCase(),
      password: password.value,
    })

    authStore.setUser(res.user, res.accessToken)
    router.push('/')
  } catch (err: any) {
    const errObj = err.response?.data?.error
    let backendMsg = errObj?.message || err.response?.data?.message

    // Nếu Zod validation trả về chi tiết fields
    if (errObj?.fields) {
      const fieldErrors = Object.entries(errObj.fields)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join('; ')
      if (fieldErrors) backendMsg += ` (${fieldErrors})`
    }

    errorMessage.value = backendMsg || 'Đăng ký thất bại. Vui lòng thử lại.'
  } finally {
    isLoading.value = false
  }
}
</script>
