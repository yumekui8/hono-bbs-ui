import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getProfile, updateProfile, deleteProfile } from '../api/profile'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import type { Theme } from '../stores/settingsStore'
import Toggle from '../components/ui/Toggle'
import { useTurnstileStore } from '../stores/turnstileStore'
import { env } from '../config/env'
import { getHistory, clearHistory } from '../utils/threadHistory'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'


type TabType = 'profile' | 'history' | 'posts'

export default function SettingsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabType>('profile')
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn())
  const clearSession = useAuthStore((s) => s.clearSession)
  const {
    theme,
    safeSearch,
    ngWords,
    notifications,
    historyMaxGenerations,
    defaultPosterName,
    defaultSubInfo,
    setTheme,
    setSafeSearch,
    setNgWords,
    setNotification,
    setHistoryMaxGenerations,
    setDefaultPosterName,
    setDefaultSubInfo,
  } = useSettingsStore()
  const turnstileSessionId = useTurnstileStore((s) => s.sessionId)
  const setTurnstileSession = useTurnstileStore((s) => s.setSession)
  const clearTurnstileSession = useTurnstileStore((s) => s.clearSession)
  const [turnstileToken, setTurnstileToken] = useState(turnstileSessionId ?? '')
  const [turnstileSaved, setTurnstileSaved] = useState(false)
  const [historyEntries, setHistoryEntries] = useState(() => getHistory())

  useEffect(() => {
    setTurnstileToken(turnstileSessionId ?? '')
  }, [turnstileSessionId])

  function handleSaveTurnstile() {
    if (turnstileToken.trim()) {
      setTurnstileSession(turnstileToken.trim())
    } else {
      clearTurnstileSession()
    }
    setTurnstileSaved(true)
    setTimeout(() => setTurnstileSaved(false), 2000)
  }

  function handleClearHistory() {
    clearHistory()
    setHistoryEntries([])
  }

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: isLoggedIn,
  })

  const profile = profileData?.data
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName)
      setBio(profile.bio ?? '')
      setEmail(profile.email ?? '')
    }
  }, [profile])

  const updateMutation = useMutation({
    mutationFn: () => updateProfile({ displayName, bio: bio || null, email: email || null }),
    onSuccess: () => alert('設定を保存しました'),
    onError: () => alert('保存に失敗しました'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProfile,
    onSuccess: () => {
      clearSession()
      navigate('/')
    },
  })

  function handleDeleteAccount() {
    if (confirm('アカウントを削除しますか？この操作は取り消せません。')) {
      deleteMutation.mutate()
    }
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-c-base text-slate-700 dark:text-slate-200">
      {/* サイドバー */}
      <aside className="w-64 flex-shrink-0 border-r border-c-border bg-c-surface flex flex-col">
        <div className="p-6 border-b border-c-border flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">
            AB
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">AnonBoard</span>
        </div>
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-4">
          <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            メイン
          </div>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center px-5 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">house</span>
                <span className="ml-3 text-sm font-medium">ホーム</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center px-5 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">list</span>
                <span className="ml-3 text-sm font-medium">板一覧</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center px-5 py-3 active-nav">
                <span className="material-symbols-outlined text-xl">settings</span>
                <span className="ml-3 text-sm font-medium">設定</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* ユーザー情報 */}
        {isLoggedIn && profile && (
          <div className="p-4 border-t border-c-border">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-400 font-bold flex-shrink-0">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{profile.displayName}</span>
                <span className="text-[10px] text-slate-500 font-medium">一般会員</span>
              </div>
            </div>
            <button
              onClick={() => {
                clearSession()
                navigate('/')
              }}
              className="w-full py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              ログアウト
            </button>
          </div>
        )}
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col min-w-0 bg-c-base overflow-y-auto custom-scrollbar">
        {/* タブヘッダー */}
        <header className="bg-c-base/80 backdrop-blur-md border-b border-c-border sticky top-0 z-10 px-8">
          <div className="flex gap-8">
            {(['profile', 'history', 'posts'] as TabType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  tab === t
                    ? 'border-blue-500 text-blue-500 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {t === 'profile' ? 'プロフィール・設定' : t === 'history' ? '閲覧履歴' : '投稿履歴'}
              </button>
            ))}
          </div>
        </header>

        <div className="max-w-4xl w-full mx-auto p-8 space-y-10">
          {tab === 'profile' && (
            <>
              {/* プロフィールセクション */}
              {profile && (
                <section className="bg-c-surface p-8 rounded-2xl border border-c-border flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-black/5">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full bg-blue-600/10 flex items-center justify-center overflow-hidden border-2 border-blue-600/30">
                      <span className="text-4xl font-bold text-blue-400">
                        {profile.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-center md:text-left space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{profile.displayName}</h2>
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <span className="px-2.5 py-0.5 bg-blue-600/20 text-blue-400 text-xs font-bold rounded uppercase tracking-wider">
                        一般会員
                      </span>
                      <span className="text-sm text-slate-500 font-mono">ID: {profile.id}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 flex items-center justify-center md:justify-start gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      登録日: {new Date(profile.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </section>
              )}

              {/* プロフィール編集 */}
              {isLoggedIn && (
                <section className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-blue-500">edit</span>
                    プロフィール編集
                  </h3>
                  <div className="bg-c-surface p-6 rounded-2xl border border-c-border space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        表示名
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-c-surface2 border border-c-border rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        自己紹介
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full bg-c-surface2 border border-c-border rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-sm resize-none h-24 custom-scrollbar"
                        placeholder="自己紹介を入力..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        メールアドレス
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-c-surface2 border border-c-border rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-sm"
                        placeholder="メールアドレスを入力..."
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* Turnstileトークン設定 */}
              {!env.disableTurnstile && (
                <section className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-blue-500">verified_user</span>
                    Turnstileトークン設定
                  </h3>
                  <div className="bg-c-surface p-6 rounded-2xl border border-c-border space-y-4">
                    <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-4 flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-400 flex-shrink-0 text-xl mt-0.5">info</span>
                      <div className="space-y-1.5">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          書き込み・ログイン・登録・プロフィール更新に必要なセッショントークンです。
                        </p>
                        {env.turnstileTokenUrl && (
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            以下のページでトークンを取得してください（現在のタブで遷移します）:{' '}
                            <a
                              href={`${env.turnstileTokenUrl}?returnTo=${encodeURIComponent(window.location.href)}`}
                              className="text-blue-500 hover:underline font-medium"
                            >
                              Turnstile トークン取得
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        トークン
                      </label>
                      <input
                        type="text"
                        value={turnstileToken}
                        onChange={(e) => setTurnstileToken(e.target.value)}
                        placeholder="取得したトークンを貼り付け..."
                        className="w-full bg-c-surface2 border border-c-border rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-sm font-mono"
                      />
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        トークンはCookieに保存されます（有効期間: 30日）
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSaveTurnstile}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/30 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">save</span>
                        保存
                      </button>
                      {turnstileSaved && (
                        <span className="text-sm text-green-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-base">check_circle</span>
                          保存しました
                        </span>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* デフォルト書き込み設定 */}
              <section className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-500">edit_note</span>
                  デフォルト書き込み設定
                </h3>
                <div className="bg-c-surface p-6 rounded-2xl border border-c-border space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      デフォルト投稿者名
                    </label>
                    <input
                      type="text"
                      value={defaultPosterName}
                      onChange={(e) => setDefaultPosterName(e.target.value)}
                      placeholder="（板のデフォルト名が使われます）"
                      className="w-full bg-c-surface2 border border-c-border rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      デフォルトオプション欄
                    </label>
                    <input
                      type="text"
                      value={defaultSubInfo}
                      onChange={(e) => setDefaultSubInfo(e.target.value)}
                      placeholder="sage など"
                      className="w-full bg-c-surface2 border border-c-border rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-sm"
                    />
                  </div>
                </div>
              </section>

              {/* NGワード設定 */}
              <section className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-500">filter_list</span>
                  NGワード・フィルタリング設定
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* スレッドタイトル */}
                  <div className="bg-c-surface2 rounded-2xl border border-c-border shadow-lg overflow-hidden flex flex-col">
                    <div className="px-5 py-3 bg-slate-100/50 dark:bg-slate-800/30 border-b border-c-border flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        スレッドタイトル
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={ngWords.threadTitleRegex}
                          onChange={(e) => setNgWords({ threadTitleRegex: e.target.checked })}
                          className="rounded border-c-border bg-c-surface2 text-blue-600 focus:ring-blue-500/50 h-3.5 w-3.5"
                        />
                        <span className="text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors">
                          正規表現
                        </span>
                      </label>
                    </div>
                    <div className="p-4 bg-transparent">
                      <textarea
                        value={ngWords.threadTitle}
                        onChange={(e) => setNgWords({ threadTitle: e.target.value })}
                        className="w-full h-32 bg-transparent border-none text-slate-700 dark:text-slate-200 placeholder-slate-400 text-sm p-0 focus:ring-0 resize-none custom-scrollbar"
                        placeholder="1行に1つずつ入力..."
                      />
                    </div>
                  </div>

                  {/* 投稿者ID */}
                  <div className="bg-c-surface2 rounded-2xl border border-c-border shadow-lg overflow-hidden flex flex-col">
                    <div className="px-5 py-3 bg-slate-100/50 dark:bg-slate-800/30 border-b border-c-border">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        投稿者ID
                      </label>
                    </div>
                    <div className="p-4 bg-transparent">
                      <textarea
                        value={ngWords.posterId}
                        onChange={(e) => setNgWords({ posterId: e.target.value })}
                        className="w-full h-32 bg-transparent border-none text-slate-700 dark:text-slate-200 placeholder-slate-400 text-sm p-0 focus:ring-0 resize-none custom-scrollbar"
                        placeholder="1行に1つずつ入力..."
                      />
                    </div>
                  </div>

                  {/* 名前 */}
                  <div className="bg-c-surface2 rounded-2xl border border-c-border shadow-lg overflow-hidden flex flex-col">
                    <div className="px-5 py-3 bg-slate-100/50 dark:bg-slate-800/30 border-b border-c-border">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        名前（コテハン）
                      </label>
                    </div>
                    <div className="p-4 bg-transparent">
                      <textarea
                        value={ngWords.posterName}
                        onChange={(e) => setNgWords({ posterName: e.target.value })}
                        className="w-full h-32 bg-transparent border-none text-slate-700 dark:text-slate-200 placeholder-slate-400 text-sm p-0 focus:ring-0 resize-none custom-scrollbar"
                        placeholder="1行に1つずつ入力..."
                      />
                    </div>
                  </div>

                  {/* レス（本文） */}
                  <div className="bg-c-surface2 rounded-2xl border border-c-border shadow-lg overflow-hidden flex flex-col">
                    <div className="px-5 py-3 bg-slate-100/50 dark:bg-slate-800/30 border-b border-c-border flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        レス（本文）
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={ngWords.contentRegex}
                          onChange={(e) => setNgWords({ contentRegex: e.target.checked })}
                          className="rounded border-c-border bg-c-surface2 text-blue-600 focus:ring-blue-500/50 h-3.5 w-3.5"
                        />
                        <span className="text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors">
                          正規表現
                        </span>
                      </label>
                    </div>
                    <div className="p-4 bg-transparent">
                      <textarea
                        value={ngWords.content}
                        onChange={(e) => setNgWords({ content: e.target.value })}
                        className="w-full h-32 bg-transparent border-none text-slate-700 dark:text-slate-200 placeholder-slate-400 text-sm p-0 focus:ring-0 resize-none custom-scrollbar"
                        placeholder="1行に1つずつ入力..."
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 外観・通知 */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* 外観 */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-blue-500">palette</span>
                    外観
                  </h3>
                  <div className="bg-c-surface p-6 rounded-2xl border border-c-border space-y-6 shadow-lg shadow-black/5">
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">テーマ</p>
                      <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-c-border">
                        {(['light', 'dark', 'auto'] as Theme[]).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTheme(t)}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                              theme === t
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                          >
                            {t === 'light' ? 'ライト' : t === 'dark' ? 'ダーク' : '自動'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">セーフサーチ</p>
                        <p className="text-[10px] text-slate-500">不適切なコンテンツを非表示にする</p>
                      </div>
                      <Toggle checked={safeSearch} onChange={setSafeSearch} />
                    </div>
                  </div>
                </div>

                {/* 通知 */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-blue-500">notifications</span>
                    通知設定
                  </h3>
                  <div className="bg-c-surface p-6 rounded-2xl border border-c-border space-y-4 shadow-lg shadow-black/5">
                    <div className="flex items-center justify-between group">
                      <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        自分の投稿へのレス
                      </span>
                      <input
                        type="checkbox"
                        checked={notifications.ownPostReply}
                        onChange={(e) => setNotification('ownPostReply', e.target.checked)}
                        className="w-5 h-5 rounded border-c-border bg-c-surface2 text-blue-600 focus:ring-blue-500/50"
                      />
                    </div>
                    <div className="flex items-center justify-between group">
                      <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        ダイレクトメッセージ
                      </span>
                      <input
                        type="checkbox"
                        checked={notifications.directMessage}
                        onChange={(e) => setNotification('directMessage', e.target.checked)}
                        className="w-5 h-5 rounded border-c-border bg-c-surface2 text-blue-600 focus:ring-blue-500/50"
                      />
                    </div>
                    <div className="flex items-center justify-between group">
                      <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        運営からのお知らせ
                      </span>
                      <input
                        type="checkbox"
                        checked={notifications.announcement}
                        onChange={(e) => setNotification('announcement', e.target.checked)}
                        className="w-5 h-5 rounded border-c-border bg-c-surface2 text-blue-600 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Danger Zone */}
              {isLoggedIn && (
                <section className="space-y-6">
                  <h3 className="text-lg font-bold text-red-500 flex items-center gap-3">
                    <span className="material-symbols-outlined">warning</span>
                    危険な操作（Danger Zone）
                  </h3>
                  <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-2xl space-y-4 shadow-lg shadow-red-950/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <p className="text-sm font-bold text-red-400">アカウントの削除</p>
                        <p className="text-xs text-slate-500 mt-1">
                          一度削除したアカウントとデータは復旧できません。
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deleteMutation.isPending}
                        className="px-6 py-2.5 bg-red-600/10 border border-red-600/30 hover:bg-red-600/20 text-red-500 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                      >
                        アカウントを削除
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* 保存ボタン */}
              {isLoggedIn && (
                <div className="flex justify-end gap-4 pb-16">
                  <button
                    type="button"
                    onClick={() => {
                      if (profile) {
                        setDisplayName(profile.displayName)
                        setBio(profile.bio ?? '')
                        setEmail(profile.email ?? '')
                      }
                    }}
                    className="px-8 py-2.5 border border-c-border bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-sm font-bold transition-all"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={() => updateMutation.mutate()}
                    disabled={updateMutation.isPending}
                    className="px-10 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/30 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">save</span>
                    設定を保存
                  </button>
                </div>
              )}
            </>
          )}

          {tab === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-500">history</span>
                  閲覧履歴
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500">保存件数:</label>
                    <input
                      type="number"
                      min={10}
                      max={1000}
                      value={historyMaxGenerations}
                      onChange={(e) => setHistoryMaxGenerations(Number(e.target.value))}
                      className="w-20 bg-c-surface2 border border-c-border rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                    />
                  </div>
                  {historyEntries.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="px-3 py-1.5 text-xs font-bold text-red-500 border border-red-500/30 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      履歴をクリア
                    </button>
                  )}
                </div>
              </div>
              {historyEntries.length === 0 ? (
                <div className="text-slate-500 text-sm text-center py-16">閲覧履歴はありません</div>
              ) : (
                <div className="space-y-2">
                  {historyEntries.map((entry) => (
                    <button
                      key={`${entry.boardId}-${entry.threadId}`}
                      type="button"
                      onClick={() => navigate(`/${entry.boardId}/${entry.threadId}`)}
                      className="w-full text-left p-4 bg-c-surface border border-c-border rounded-xl hover:border-blue-500/40 hover:bg-blue-500/5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {entry.threadTitle}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-500">{entry.boardName}</span>
                            <span className="text-xs text-slate-400">最終閲覧: {entry.lastReadCount}件</span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true, locale: ja })}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'posts' && (
            <div className="text-slate-500 text-sm text-center py-16">投稿履歴（未実装）</div>
          )}
        </div>
      </main>
    </div>
  )
}
