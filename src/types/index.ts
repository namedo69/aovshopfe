export type UserRole = 'customer' | 'admin'

export interface UserTier {
  id: string
  code: string
  name: string
  discountPercent: number
  description?: string | null
  isDefault: boolean
  isActive: boolean
  sortOrder: number
  userCount?: number
  createdAt?: string | number
  updatedAt?: string | number
}

export interface TierProductPrice {
  productId: string
  productName: string
  productSlug: string
  originalPrice: number
  salePrice: number | null
  customPrice: number | null
}

export interface User {
  id: string
  email: string
  name?: string
  role: UserRole
  tierId?: string
  tierCode?: string
  tierName?: string
  tierDiscount?: number
  balance: number
  totalOrders?: number
  totalCodes?: number
  completedOrders?: number
  processingOrders?: number
  totalSpent?: number
  status?: 'active' | 'blocked'
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
  requestsPerItem?: number
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
  user?: { id?: string; email?: string; name?: string } | null
  status: OrderStatus
  totalAmount: number
  discountAmount: number
  finalAmount: number
  voucherCode?: string
  items: OrderItem[]
  customerNote?: string
  ticketsTarget?: number
  ticketsConfirmed?: number
  completedRequests?: number
  progressPercent?: number
  providerOrder?: {
    externalOrderId?: string
    status?: string
    response?: any
  } | null
  createdAt: string
  updatedAt: string
}

export interface ChungSucProviderInfo {
  provider: {
    id: string
    code: string
    name: string
    isActive: boolean
  }
  configured: boolean
  partnerInfo?: {
    user?: {
      id: number
      email: string
      balance: number
    }
    permissions?: {
      home: boolean
    }
    prices?: {
      home_per_request: number
    }
    tickets_per_request?: number
    purchases_open?: boolean
  } | null
  error?: string | null
}

export interface OrderLiveProgress {
  orderCode: string
  status: OrderStatus
  ticketsTarget: number
  ticketsConfirmed: number
  completedRequests: number
  progressPercent: number
}

export interface Voucher {
  id: string
  code: string
  type: 'fixed' | 'percent'
  value?: number
  valueAmount?: number | null
  valuePercent?: number | null
  minOrderAmount?: number
  maxDiscount?: number
  maxDiscountAmount?: number | null
  totalUsageLimit?: number | null
  perUserLimit?: number | null
  usedCount?: number
  startsAt?: string | number | null
  endsAt?: string | number | null
  startDate?: string
  endDate?: string
  usageLimit?: number
  status?: 'active' | 'inactive'
  isActive: boolean
}
