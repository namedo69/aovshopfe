import { apiClient } from './api'
import type { Product, BackendProduct, Order, Deposit, Voucher, User } from '@/types'
import { mapBackendProduct } from './product.service'

export interface AdminReportDashboard {
  totalDeposits: number
  totalRevenue: number
  processingOrders: number
  totalRefunds: number
}

export interface UpsertProductDTO {
  name: string
  slug: string
  description?: string
  categoryId?: string | null
  imageUrl?: string | null
  priceAmount: number
  salePriceAmount?: number | null
  inputSchema?: Record<string, any>
  minQuantity?: number
  maxQuantity?: number
  isActive?: boolean
  sortOrder?: number
}

export interface AdminUserListItem {
  id: string
  email: string
  name: string
  role: 'customer' | 'admin'
  status: 'active' | 'blocked'
  createdAt: string
  balance?: number
}

export const adminService = {
  // Quản lý người dùng
  async getUsers(): Promise<AdminUserListItem[]> {
    const res = await apiClient.get<AdminUserListItem[]>('/admin/users')
    return res.data
  },

  async updateUser(id: string, data: { status?: 'active' | 'blocked'; role?: 'customer' | 'admin'; name?: string }): Promise<User> {
    const res = await apiClient.patch<User>(`/admin/users/${id}`, data)
    return res.data
  },

  async adjustUserBalance(id: string, amount: number, reason: string): Promise<{ userId: string; balance: number; amountAdjusted: number }> {
    const res = await apiClient.post(`/admin/users/${id}/balance`, { amount, reason })
    return res.data
  },

  // Thống kê Dashboard: lấy từ cả orders report và cashflow report
  async getDashboardReport(): Promise<AdminReportDashboard> {
    const summary: AdminReportDashboard = {
      totalDeposits: 0,
      totalRevenue: 0,
      processingOrders: 0,
      totalRefunds: 0,
    }

    try {
      const [orderRowsRes, cashflowRowsRes] = await Promise.allSettled([
        apiClient.get<any[]>('/admin/reports/orders'),
        apiClient.get<any[]>('/admin/reports/cashflow'),
      ])

      // Parse order statistics
      if (orderRowsRes.status === 'fulfilled' && Array.isArray(orderRowsRes.value.data)) {
        for (const row of orderRowsRes.value.data) {
          const count = Number(row.count) || 0
          const total = Number(row.total_amount) || 0

          if (row.status === 'completed') {
            summary.totalRevenue += total
          } else if (['processing', 'sending', 'queued'].includes(row.status)) {
            summary.processingOrders += count
          }
        }
      }

      // Parse cashflow statistics
      if (cashflowRowsRes.status === 'fulfilled' && Array.isArray(cashflowRowsRes.value.data)) {
        for (const row of cashflowRowsRes.value.data) {
          const amt = Number(row.amount) || 0
          if (row.type === 'deposit') {
            summary.totalDeposits += amt
          } else if (row.type === 'refund') {
            summary.totalRefunds += Math.abs(amt)
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching dashboard reports:', e)
    }

    return summary
  },

  // Báo cáo dòng tiền
  async getCashflowReport(): Promise<any> {
    const res = await apiClient.get('/admin/reports/cashflow')
    return res.data
  },

  // Quản lý sản phẩm (CRUD)
  async getProducts(): Promise<Product[]> {
    const res = await apiClient.get<BackendProduct[]>('/admin/products')
    if (Array.isArray(res.data)) {
      return res.data.map(mapBackendProduct)
    }
    return []
  },

  async createProduct(data: UpsertProductDTO): Promise<Product> {
    const res = await apiClient.post<BackendProduct>('/admin/products', data)
    return mapBackendProduct(res.data)
  },

  async updateProduct(id: string, data: Partial<UpsertProductDTO>): Promise<Product> {
    const res = await apiClient.patch<BackendProduct>(`/admin/products/${id}`, data)
    return mapBackendProduct(res.data)
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/admin/products/${id}`)
  },

  // Quản lý đơn hàng
  async getOrders(params?: any): Promise<Order[]> {
    const res = await apiClient.get<Order[]>('/admin/orders', { params })
    return res.data
  },

  async getOrderById(id: string): Promise<Order> {
    const res = await apiClient.get<Order>(`/admin/orders/${id}`)
    return res.data
  },

  async updateOrderStatus(id: string, status: string, reason?: string): Promise<void> {
    await apiClient.patch(`/admin/orders/${id}/status`, { status, reason })
  },

  async retryOrder(id: string): Promise<void> {
    await apiClient.post(`/admin/orders/${id}/retry`)
  },

  async refundOrder(id: string, reason: string): Promise<void> {
    await apiClient.post(`/admin/orders/${id}/refund`, { reason })
  },

  // Quản lý giao dịch nạp SePay
  async getDeposits(params?: any): Promise<Deposit[]> {
    const res = await apiClient.get<Deposit[]>('/admin/deposits', { params })
    return res.data
  },

  async approveDeposit(id: string, reason: string): Promise<void> {
    await apiClient.post(`/admin/deposits/${id}/approve`, { reason })
  },

  // Quản lý Vouchers
  async getVouchers(): Promise<Voucher[]> {
    const res = await apiClient.get<Voucher[]>('/admin/vouchers')
    return res.data
  },

  async createVoucher(data: Partial<Voucher>): Promise<Voucher> {
    const res = await apiClient.post<Voucher>('/admin/vouchers', data)
    return res.data
  },
}
