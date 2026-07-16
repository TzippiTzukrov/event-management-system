import { api } from './client'
import { UserRole } from '../types'

export interface AppUserDto {
  id: string
  username: string
  role: string
  email?: string
}

export interface CreateUserResponse extends AppUserDto {
  temporaryPassword: string
}

export const usersApi = {
  getAll: () =>
    api.get<AppUserDto[]>('/auth/users'),

  create: (data: { username: string; role: UserRole; email?: string }) =>
    api.post<CreateUserResponse>('/auth/create-user', data),

  delete: (id: string) =>
    api.delete<void>(`/auth/users/${id}`),
}
