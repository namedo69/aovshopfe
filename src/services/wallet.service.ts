import { apiClient } from './api'
import type { Deposit } from '@/types'

export interface WalletTransaction {
  id: string
  type: 'deposit' | 'purchase' | 'refund' | 'adjustment'
  amount: number
  balanceBefore: number
  balanceAfter: number
  referenceType?: string
  referenceId?: string
  status: 'pending' | 'completed' | 'failed'
  description?: string
  createdAt: string
}

export interface BackendWalletResponse {
  userId: string
  balanceAmount?: number
  balance?: number
}

export interface WalletInfo {
  balance: number
  userId: string
}

export interface CreateDepositDTO {
  amount: number
}

export const walletService = {
  // Lấy số dư ví (hỗ trợ cả balanceAmount của BE và balance)
  async getWallet(): Promise<WalletInfo> {
    const res = await apiClient.get<BackendWalletResponse>('/wallet')
    const balance = res.data?.balanceAmount ?? res.data?.balance ?? 0
    return {
      userId: res.data?.userId,
      balance,
    }
  },

  // Lịch sử biến động số dư
  async getTransactions(): Promise<WalletTransaction[]> {
    const res = await apiClient.get<any[]>('/wallet/transactions')
    if (Array.isArray(res.data)) {
      return res.data.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        balanceBefore: tx.balanceBefore ?? tx.balance_before ?? 0,
        balanceAfter: tx.balanceAfter ?? tx.balance_after ?? 0,
        referenceType: tx.referenceType ?? tx.reference_type,
        referenceId: tx.referenceId ?? tx.reference_id,
        status: tx.status,
        description: tx.description,
        createdAt: tx.createdAt ?? tx.created_at,
      }))
    }
    return []
  },

  // Tạo yêu cầu nạp tiền SePay VietQR
  async createDeposit(data: CreateDepositDTO): Promise<Deposit> {
    const res = await apiClient.post<Deposit>('/deposits', data)
    return res.data
  },

  // Lấy danh sách yêu cầu nạp của khách
  async getDeposits(): Promise<Deposit[]> {
    const res = await apiClient.get<Deposit[]>('/deposits')
    return res.data
  },

  // Kiểm tra trạng thái nạp theo paymentCode
  async getDepositByCode(paymentCode: string): Promise<Deposit> {
    const res = await apiClient.get<Deposit>(`/deposits/${paymentCode}`)
    return res.data
  },
}
