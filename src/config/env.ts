export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  apiBasePath: import.meta.env.VITE_API_BASE_PATH ?? '/api/v1',
  turnstileSiteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '',
  disableTurnstile: import.meta.env.VITE_DISABLE_TURNSTILE === 'true',
  turnstileTokenUrl: import.meta.env.VITE_TURNSTILE_TOKEN_URL ?? '',
  threadCacheGen: parseInt(import.meta.env.VITE_THREAD_CACHE_GEN ?? '20', 10),
  postCacheGen: parseInt(import.meta.env.VITE_POST_CACHE_GEN ?? '30', 10),
  imageUploaderUrl: import.meta.env.VITE_IMAGE_UPLOADER_URL ?? '',
} as const
