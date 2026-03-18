import { useState } from 'react'
import { postLogin } from '../../api/auth'
import { useAuthStore } from '../../stores/authStore'
import { useTurnstileStore } from '../../stores/turnstileStore'
import { ApiError, TurnstileRequiredError } from '../../api/client'
import { env } from '../../config/env'

function TurnstileLoginError() {
  const returnTo = encodeURIComponent(window.location.href)
  return (
    <span>
      <a
        href={`${env.turnstileTokenUrl}?returnTo=${returnTo}`}
        className="underline font-medium hover:text-red-300"
      >
        Turnstile
      </a>
      セッションが必要です。ページを再読み込みしてください。
    </span>
  )
}

interface LoginModalProps {
  onClose: () => void
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isTurnstileError, setIsTurnstileError] = useState(false)
  const [loading, setLoading] = useState(false)
  const setSession = useAuthStore((s) => s.setSession)
  const turnstileValid = useTurnstileStore((s) => s.isValid())
  const setTurnstileSession = useTurnstileStore((s) => s.setSession)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // 開発環境ではTurnstileをスキップ
    if (env.disableTurnstile && !turnstileValid) {
      setTurnstileSession('dev-turnstile-disabled')
    }

    try {
      const res = await postLogin(id, password)
      setSession(res.data.sessionId, res.data.userId, res.data.displayName, res.data.expiresAt)
      onClose()
    } catch (err) {
      if (err instanceof TurnstileRequiredError) {
        setIsTurnstileError(true)
        setError('turnstile')
      } else if (err instanceof ApiError) {
        if (err.code === 'INVALID_CREDENTIALS') {
          setError('IDまたはパスワードが正しくありません')
        } else {
          setError(err.message)
        }
      } else {
        setError('ログインに失敗しました')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#161920] border border-slate-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">ログイン</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              ユーザーID
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full bg-[#1a1d24] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-sm"
              placeholder="ユーザーIDを入力"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1a1d24] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50 text-sm"
              placeholder="パスワードを入力"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {isTurnstileError && !env.disableTurnstile && env.turnstileTokenUrl ? (
                <TurnstileLoginError />
              ) : (
                error
              )}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  )
}
