import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'auto'

interface NgWords {
  threadTitle: string
  threadTitleRegex: boolean
  posterId: string
  posterName: string
  content: string
  contentRegex: boolean
}

interface SettingsState {
  theme: Theme
  safeSearch: boolean
  ngWords: NgWords
  notifications: {
    ownPostReply: boolean
    directMessage: boolean
    announcement: boolean
  }
  historyMaxGenerations: number
  defaultPosterName: string
  defaultSubInfo: string
  replyLayout: 'bottom' | 'right'
  setTheme: (theme: Theme) => void
  setSafeSearch: (val: boolean) => void
  setNgWords: (ngWords: Partial<NgWords>) => void
  setNotification: (key: keyof SettingsState['notifications'], val: boolean) => void
  setHistoryMaxGenerations: (n: number) => void
  setDefaultPosterName: (s: string) => void
  setDefaultSubInfo: (s: string) => void
  setReplyLayout: (l: 'bottom' | 'right') => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      safeSearch: true,
      ngWords: {
        threadTitle: '',
        threadTitleRegex: false,
        posterId: '',
        posterName: '',
        content: '',
        contentRegex: false,
      },
      notifications: {
        ownPostReply: true,
        directMessage: true,
        announcement: false,
      },
      historyMaxGenerations: 100,
      defaultPosterName: '',
      defaultSubInfo: '',
      replyLayout: 'bottom',
      setTheme: (theme) => set({ theme }),
      setSafeSearch: (safeSearch) => set({ safeSearch }),
      setNgWords: (words) =>
        set((s) => ({ ngWords: { ...s.ngWords, ...words } })),
      setNotification: (key, val) =>
        set((s) => ({ notifications: { ...s.notifications, [key]: val } })),
      setHistoryMaxGenerations: (historyMaxGenerations) => set({ historyMaxGenerations }),
      setDefaultPosterName: (defaultPosterName) => set({ defaultPosterName }),
      setDefaultSubInfo: (defaultSubInfo) => set({ defaultSubInfo }),
      setReplyLayout: (replyLayout) => set({ replyLayout }),
    }),
    {
      name: 'bbs-settings',
    },
  ),
)
