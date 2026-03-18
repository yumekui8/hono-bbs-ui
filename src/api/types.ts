// 共通
export interface ApiResponse<T> {
  data: T
  endpoint?: EndpointMeta
}

export interface EndpointMeta {
  ownerUserId: string | null
  ownerGroupId: string | null
  permissions: string
}

export interface ApiError {
  error: string
  message: string
  errorCodes?: string[]
}

// Board
export type IdFormat =
  | 'daily_hash'
  | 'daily_hash_or_user'
  | 'api_key_hash'
  | 'api_key_hash_or_user'
  | 'none'

export interface Board {
  id: string
  ownerUserId: string | null
  ownerGroupId: string | null
  permissions: string
  name: string
  description: string | null
  maxThreads: number
  maxThreadTitleLength: number
  defaultMaxPosts: number
  defaultMaxPostLength: number
  defaultMaxPostLines: number
  defaultMaxPosterNameLength: number
  defaultMaxPosterSubInfoLength: number
  defaultMaxPosterMetaInfoLength: number
  defaultPosterName: string
  defaultIdFormat: IdFormat
  defaultThreadOwnerUserId: string | null
  defaultThreadOwnerGroupId: string | null
  defaultThreadPermissions: string
  category: string | null
  createdAt: string
  adminMeta?: AdminMeta
}

// Thread
export interface Thread {
  id: string
  boardId: string
  ownerUserId: string | null
  ownerGroupId: string | null
  permissions: string
  title: string
  maxPosts: number | null
  maxPostLength: number | null
  maxPostLines: number | null
  maxPosterNameLength: number | null
  maxPosterSubInfoLength: number | null
  maxPosterMetaInfoLength: number | null
  posterName: string | null
  idFormat: IdFormat | null
  postCount: number
  createdAt: string
  updatedAt: string
  firstPost?: Post
  adminMeta?: AdminMeta
}

// Post
export interface Post {
  id: string
  threadId: string
  postNumber: number
  ownerUserId: string | null
  ownerGroupId: string | null
  permissions: string
  userId: string | null
  displayUserId: string
  posterName: string
  posterSubInfo: string | null
  content: string
  createdAt: string
  adminMeta?: AdminMeta
}

// AdminMeta
export interface AdminMeta {
  creatorUserId: string | null
  creatorSessionId: string | null
  creatorTurnstileSessionId: string | null
}

// Profile
export interface Profile {
  id: string
  displayName: string
  bio: string | null
  email: string | null
  isActive: boolean
  primaryGroupId: string | null
  createdAt: string
  updatedAt: string
}

// Auth
export interface LoginResponse {
  sessionId: string
  userId: string
  displayName: string
  expiresAt: string
}

export interface TurnstileResponse {
  sessionId: string
  alreadyIssued: boolean
}

// Boards list response
export interface BoardsResponse {
  data: Board[]
  endpoint: EndpointMeta
}

// Board threads response
export interface BoardThreadsResponse {
  data: {
    board: Board
    threads: Thread[]
  }
}

// Thread posts response
export interface ThreadPostsResponse {
  data: {
    thread: Thread
    posts: Post[]
  }
}

// Create thread response
export interface CreateThreadResponse {
  data: {
    thread: Thread
    firstPost: Post
  }
}
