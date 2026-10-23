import { apiClient } from './api'
import type { Order } from '@/types'

export interface CreateOrderDTO {
  productId: string
  inputs: Record<string, any>
  voucherCode?: string
  customerNote?: string
}

export interface CodeQuantityItem {
  code: string
  quantity: number
}

export interface CreateMultiCodeOrderDTO {
  productId: string
  codes?: string[]
  items?: CodeQuantityItem[]
  voucherCode?: string
  customerNote?: string
}

export interface ValidateVoucherDTO {
  code: string
  productId: string
  quantity?: number
}

export interface ValidateVoucherResponse {
  valid: boolean
  discountAmount: number
  message?: string
}

// Hàm chuẩn hoá dữ liệu Order từ Backend (snake_case -> camelCase)
export function mapBackendOrder(raw: any): Order {
  const orderCode = raw.orderCode || raw.order_code || raw.id
  const totalAmount = raw.totalAmount ?? raw.total_amount ?? 0
  const subtotalAmount = raw.subtotalAmount ?? raw.subtotal_amount ?? totalAmount
  const discountAmount = raw.discountAmount ?? raw.discount_amount ?? 0

  let items = []
  if (Array.isArray(raw.items)) {
    items = raw.items.map((it: any) => {
      let inputs = it.customerInput ?? it.customer_input ?? it.inputs ?? {}
      if (typeof inputs === 'string') {
        try {
          inputs = JSON.parse(inputs)
        } catch {
          inputs = {}
        }
      }
      return {
        productId: it.productId ?? it.product_id,
        productName: it.productName ?? it.product_name ?? 'Gói Dịch Vụ',
        price: it.unitPrice ?? it.unit_price ?? it.price ?? 0,
        quantity: it.quantity ?? 1,
        inputs: inputs || {},
      }
    })
  }

  let user = raw.user
  if (typeof user === 'string') {
    try {
      user = JSON.parse(user)
    } catch {
      user = null
    }
  }
  if (!user && (raw.userEmail || raw.userName)) {
    user = { id: raw.user_id || raw.userId, email: raw.userEmail, name: raw.userName }
  }

  return {
    id: raw.id,
    orderCode,
    user,
    status: raw.status || 'queued',
    totalAmount: subtotalAmount,
    discountAmount,
    finalAmount: totalAmount,
    voucherCode: raw.voucherCode || raw.voucher_code,
    items,
    customerNote: raw.customerNote || raw.customer_note,
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
  }
}

export const orderService = {
  // Kiểm tra mã voucher (truyền đúng số lượng items theo tổng số code)
  async validateVoucher(data: ValidateVoucherDTO): Promise<ValidateVoucherResponse> {
    const qty = data.quantity && data.quantity > 0 ? data.quantity : 1
    const res = await apiClient.post<any>('/vouchers/validate', {
      code: data.code,
      items: [{ productId: data.productId, quantity: qty }],
    })
    const discountAmount = res.data?.estimatedDiscount ?? res.data?.discountAmount ?? 0
    return {
      valid: discountAmount > 0,
      discountAmount,
      message: res.data?.message,
    }
  },

  // Tạo đơn hàng đơn lẻ
  async createOrder(data: CreateOrderDTO, idempotencyKey: string): Promise<Order> {
    const payload = {
      items: [
        {
          productId: data.productId,
          quantity: 1,
          customerInput: data.inputs || {},
        },
      ],
      voucherCode: data.voucherCode,
      customerNote: data.customerNote,
    }

    const res = await apiClient.post<any>('/orders', payload, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    })
    return mapBackendOrder(res.data)
  },

  // Tạo nhiều đơn hàng cùng lúc kèm số lượng từng code và giảm giá voucher
  async createMultiOrders(data: CreateMultiCodeOrderDTO, idempotencyKey: string): Promise<any> {
    const rawItems: CodeQuantityItem[] = data.items && data.items.length > 0
      ? data.items
      : (data.codes || []).map(c => ({ code: c, quantity: 1 }))

    const payload = {
      items: rawItems.map(item => ({
        productId: data.productId,
        quantity: item.quantity > 0 ? item.quantity : 1,
        customerInput: {
          accountId: item.code,
          code: item.code,
        },
      })),
      voucherCode: data.voucherCode,
      customerNote: data.customerNote,
      splitOrders: true, // Backend sẽ tự động tách thành từng đơn riêng biệt
    }

    const res = await apiClient.post<any>('/orders', payload, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    })
    return res.data
  },

  // Danh sách đơn hàng của khách
  async getOrders(): Promise<Order[]> {
    const res = await apiClient.get<any[]>('/orders')
    if (Array.isArray(res.data)) {
      return res.data.map(mapBackendOrder)
    }
    return []
  },

  // Chi tiết đơn hàng theo orderCode
  async getOrderByCode(orderCode: string): Promise<Order> {
    const res = await apiClient.get<any>(`/orders/${orderCode}`)
    return mapBackendOrder(res.data)
  },
}
