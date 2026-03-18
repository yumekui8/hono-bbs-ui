export interface ThreadHistoryEntry {
  threadId: string
  boardId: string
  threadTitle: string
  boardName: string
  lastReadCount: number
  timestamp: number
}

const COOKIE_NAME = 'bbs-thread-history'

function loadHistory(): ThreadHistoryEntry[] {
  try {
    const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]*)`))
    if (!match) return []
    const decoded = decodeURIComponent(match[1])
    const parsed = JSON.parse(decoded)
    if (!Array.isArray(parsed)) return []
    return parsed as ThreadHistoryEntry[]
  } catch {
    return []
  }
}

function saveHistory(entries: ThreadHistoryEntry[]) {
  const encoded = encodeURIComponent(JSON.stringify(entries))
  document.cookie = `${COOKIE_NAME}=${encoded}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Strict`
}

export function recordThreadView(
  entry: Omit<ThreadHistoryEntry, 'timestamp'>,
  maxGenerations: number,
) {
  const history = loadHistory()
  const filtered = history.filter((e) => e.threadId !== entry.threadId)
  const newEntry: ThreadHistoryEntry = { ...entry, timestamp: Date.now() }
  const trimmed = [newEntry, ...filtered].slice(0, maxGenerations)
  saveHistory(trimmed)
}

export function getHistory(): ThreadHistoryEntry[] {
  return loadHistory()
}

export function clearHistory() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Strict`
}
