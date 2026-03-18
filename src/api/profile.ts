import { apiFetch } from './client'
import type { Profile, ApiResponse } from './types'

export async function getProfile() {
  return apiFetch<ApiResponse<Profile>>('/profile', {
    requiresSession: true,
  })
}

export interface UpdateProfileInput {
  displayName?: string
  bio?: string | null
  email?: string | null
  currentPassword?: string
  newPassword?: string
}

export async function updateProfile(input: UpdateProfileInput) {
  return apiFetch<ApiResponse<Profile>>('/profile', {
    method: 'PUT',
    body: input,
    requiresTurnstile: true,
    requiresSession: true,
  })
}

export async function deleteProfile() {
  return apiFetch<void>('/profile', {
    method: 'DELETE',
    requiresTurnstile: true,
    requiresSession: true,
  })
}
