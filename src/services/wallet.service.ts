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

// Chuẩn hoá dữ liệu Deposit từ Backend
export function mapBackendDeposit(raw: any): Deposit {
  const code = raw.paymentCode || raw.payment_code || raw.orderCode || raw.order_code || raw.id
  const bank = raw.bank || {}
  const qrUrl = raw.qrUrl || raw.qr_url || raw.qrCodeUrl || ''

  return {
    id: raw.id,
    orderCode: code,
    amount: raw.amount,
    status: raw.status || 'pending',
    accountNumber: bank.accountNumber || raw.accountNumber || '',
    accountName: bank.accountName || raw.accountName || '',
    bankName: bank.bankCode || raw.bankName || '',
    qrCodeUrl: qrUrl,
    transferContent: code,
    expiresAt: raw.expiresAt || raw.expires_at || '',
    createdAt: raw.createdAt || raw.created_at || '',
  }
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
    const res = await apiClient.post<any>('/deposits', data)
    return mapBackendDeposit(res.data)
  },

  // Lấy danh sách yêu cầu nạp của khách
  async getDeposits(): Promise<Deposit[]> {
    const res = await apiClient.get<any[]>('/deposits')
    if (Array.isArray(res.data)) {
      return res.data.map(mapBackendDeposit)
    }
    return []
  },

  // Kiểm tra trạng thái nạp theo paymentCode
  async getDepositByCode(paymentCode: string): Promise<Deposit> {
    const res = await apiClient.get<any>(`/deposits/${paymentCode}`)
    return mapBackendDeposit(res.data)
  },
}
