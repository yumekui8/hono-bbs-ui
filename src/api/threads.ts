import { apiFetch } from './client'
import type { Thread, CreateThreadResponse, ApiResponse } from './types'

export interface CreateThreadInput {
  title: string
  content: string
  posterName?: string
  posterSubInfo?: string
}

export async function createThread(boardId: string, input: CreateThreadInput) {
  return apiFetch<CreateThreadResponse>(`/boards/${boardId}`, {
    method: 'POST',
    body: input,
    requiresTurnstile: true,
  })
}

export interface UpdateThreadInput {
  title?: string
  maxPosts?: number | null
  posterName?: string | null
  idFormat?: string | null
}

export async function updateThread(boardId: string, threadId: string, input: UpdateThreadInput) {
  return apiFetch<ApiResponse<Thread>>(`/boards/${boardId}/${threadId}`, {
    method: 'PUT',
    body: input,
    requiresTurnstile: true,
  })
}

export async function deleteThread(boardId: string, threadId: string) {
  return apiFetch<void>(`/boards/${boardId}/${threadId}`, {
    method: 'DELETE',
    requiresTurnstile: true,
  })
}
