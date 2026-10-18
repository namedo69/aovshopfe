import { apiClient } from './api'
import type { Product, BackendProduct } from '@/types'

export interface ProductFilterParams {
  category?: string
  search?: string
}

// Hàm chuẩn hoá dữ liệu từ Backend schema sang Frontend Product model
export function mapBackendProduct(raw: BackendProduct | Product): Product {
  // Nếu đã được map sẵn
  if ('price' in raw && typeof raw.price === 'number') {
    return raw as Product
  }

  const b = raw as BackendProduct
  const price = b.salePriceAmount ?? b.priceAmount ?? 0
  const originalPrice = b.priceAmount ?? price

  // Chuẩn hoá inputSchema nếu BE trả về object key-value
  let inputSchemaList = []
  if (Array.isArray(b.inputSchema)) {
    inputSchemaList = b.inputSchema
  } else if (b.inputSchema && typeof b.inputSchema === 'object') {
    inputSchemaList = Object.entries(b.inputSchema).map(([key, val]: [string, any]) => {
      if (typeof val === 'object' && val !== null) {
        return {
          name: key,
          label: val.label || key,
          type: val.type || 'text',
          required: val.required ?? true,
          placeholder: val.placeholder || '',
          options: val.options || [],
          helpText: val.helpText || '',
        }
      }
      return {
        name: key,
        label: key,
        type: 'text',
        required: true,
      }
    })
  }

  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    category: b.categoryId || 'Gói Dịch Vụ',
    description: b.description || '',
    originalPrice,
    price,
    status: b.isActive ? 'active' : 'inactive',
    inputSchema: inputSchemaList,
    imageUrl: b.imageUrl,
    minQuantity: b.minQuantity,
    maxQuantity: b.maxQuantity,
    createdAt: b.createdAt,
  }
}

export const productService = {
  // Lấy danh sách sản phẩm từ BE
  async getProducts(params?: ProductFilterParams): Promise<Product[]> {
    const res = await apiClient.get<BackendProduct[]>('/products', { params })
    if (Array.isArray(res.data)) {
      return res.data.map(mapBackendProduct)
    }
    return []
  },

  // Chi tiết sản phẩm theo slug từ BE
  async getProductBySlug(slug: string): Promise<Product> {
    const res = await apiClient.get<BackendProduct>(`/products/${slug}`)
    return mapBackendProduct(res.data)
  },
}
