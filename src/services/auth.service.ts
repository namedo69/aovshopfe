import { apiClient } from './api'
import type { User, AuthResponse } from '@/types'

export interface RegisterDTO {
  email: string
  password: string
  name?: string
}

export interface LoginDTO {
  email: string
  password: string
}

export const authService = {
  // Đăng ký
  async register(data: RegisterDTO): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/register', data)
    return res.data
  },

  // Đăng nhập
  async login(data: LoginDTO): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/login', data)
    return res.data
  },

  // Khôi phục session & cấp mới Access Token qua cookie HttpOnly
  async refresh(): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/refresh')
    return res.data
  },

  // Đăng xuất
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
  },

  // Lấy thông tin user hiện tại
  async getMe(): Promise<User> {
    const res = await apiClient.get<User>('/me')
    return res.data
  },
}
