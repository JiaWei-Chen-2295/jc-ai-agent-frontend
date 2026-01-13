import axios, { AxiosError } from 'axios'
import { OpenAPI } from '@/api'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8525/api'

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  withCredentials: false,
})

http.interceptors.request.use((config) => {
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const message =
      error.response?.data && typeof error.response.data === 'object'
        ? JSON.stringify(error.response.data)
        : error.message
    return Promise.reject(new Error(message))
  },
)

export const setAuthToken = (token?: string) => {
  if (!token) {
    delete http.defaults.headers.common.Authorization
    OpenAPI.TOKEN = undefined
    return
  }
  http.defaults.headers.common.Authorization = `Bearer ${token}`
  OpenAPI.TOKEN = token
}

export const apiBaseUrl = API_BASE_URL

// Sync generated client with runtime base URL
OpenAPI.BASE = API_BASE_URL
