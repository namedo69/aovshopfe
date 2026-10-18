export type UserRole = 'customer' | 'admin'

export interface User {
  id: string
  email: string
  name?: string
  role: UserRole
  balance: number
  createdAt: string
}

export interface AuthResponse {
  user: User
  accessToken: string
}

export interface ApiErrorResponse {
  message: string
  code?: string
  errors?: Record<string, string[]>
}

export interface InputFieldSchema {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea'
  required: boolean
  placeholder?: string
  options?: { label: string; value: string | number }[]
  min?: number
  max?: number
  helpText?: string
}

export interface BackendProduct {
  id: string
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  categoryId?: string | null
  priceAmount: number
  salePriceAmount?: number | null
  inputSchema?: any
  minQuantity?: number
  maxQuantity?: number
  isActive: boolean
  sortOrder?: number
  createdAt?: string
  updatedAt?: string
}

export interface Product {
  id: string
  name: string
  slug: string
  category: string
  description?: string
  originalPrice: number
  price: number
  status: 'active' | 'inactive'
  providerServiceId?: string
  inputSchema: InputFieldSchema[]
  imageUrl?: string | null
  minQuantity?: number
  maxQuantity?: number
  createdAt?: string
}

export interface Deposit {
  id: string
  orderCode: string
  amount: number
  status: 'pending' | 'completed' | 'expired' | 'failed'
  accountNumber: string
  accountName: string
  bankName: string
  qrCodeUrl: string
  transferContent: string
  expiresAt: string
  createdAt: string
}

export interface OrderItem {
  productId: string
  productName: string
  price: number
  quantity: number
  inputs: Record<string, any>
}

export type OrderStatus =
  | 'queued'
  | 'sending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled'

export interface Order {
  id: string
  orderCode: string
  status: OrderStatus
  totalAmount: number
  discountAmount: number
  finalAmount: number
  voucherCode?: string
  items: OrderItem[]
  customerNote?: string
  createdAt: string
  updatedAt: string
}

export interface Voucher {
  id: string
  code: string
  type: 'fixed' | 'percent'
  value: number
  minOrderAmount: number
  maxDiscount?: number
  startDate: string
  endDate: string
  usageLimit: number
  usedCount: number
  status: 'active' | 'inactive'
}
