import { api } from './client'
import type { LoginRequest, LoginResponse } from '../types'

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data),
}
