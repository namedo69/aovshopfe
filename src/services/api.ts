import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true, // Cho phép HttpOnly cookie gửi kèm (refresh token)
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Bộ nhớ lưu Access Token
let memoryToken: string | null = null

export const setAccessToken = (token: string | null) => {
  memoryToken = token
}

export const getAccessToken = () => memoryToken

// Request interceptor gắn token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (memoryToken && config.headers) {
    config.headers.Authorization = `Bearer ${memoryToken}`
  }
  return config
})

// Refresh token queue để tránh storm khi có nhiều request đồng thời bị 401
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Gọi refresh token endpoint qua cookie HttpOnly
        const res = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const newToken = res.data?.accessToken
        setAccessToken(newToken)
        processQueue(null, newToken)

        if (originalRequest.headers && newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
        }
        return apiClient(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr as Error, null)
        setAccessToken(null)
        window.dispatchEvent(new CustomEvent('auth:expired'))
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
