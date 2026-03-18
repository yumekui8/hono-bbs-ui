import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBoards } from '../../hooks/useBoards'
import { useAuthStore } from '../../stores/authStore'
import LoginModal from '../auth/LoginModal'

export default function BoardSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const { boardId } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useBoards()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn())
  const displayName = useAuthStore((s) => s.displayName)
  const clearSession = useAuthStore((s) => s.clearSession)

  const boards = data?.data ?? []

  async function handleLogout() {
    clearSession()
  }

  return (
    <>
      <aside
        className={`flex-shrink-0 border-r border-c-border bg-c-surface flex flex-col relative transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* ヘッダー */}
        <div className="p-6 border-b border-c-border flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-white text-sm">
              AB
            </div>
            {!collapsed && (
              <h1 className="font-bold text-lg tracking-tight truncate whitespace-nowrap text-slate-900 dark:text-white">
                AnonBoard
              </h1>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 flex-shrink-0"
            title="サイドバーを切り替え"
          >
            <span className="material-symbols-outlined text-xl">
              {collapsed ? 'menu' : 'menu_open'}
            </span>
          </button>
        </div>

        {/* 板一覧 */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-4">
          {!collapsed && (
            <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              板一覧
            </div>
          )}
          {isLoading ? (
            <div className="px-5 py-3 text-slate-500 text-sm">読み込み中...</div>
          ) : (
            <ul className="space-y-1">
              {boards.map((board) => (
                <li key={board.id}>
                  <button
                    onClick={() => navigate(`/${board.id}`)}
                    className={`w-full flex items-center px-5 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                      boardId === board.id ? 'active-board text-slate-900 dark:text-white' : ''
                    }`}
                    title={board.name}
                  >
                    <span className="material-symbols-outlined text-xl flex-shrink-0">
                      terminal
                    </span>
                    {!collapsed && (
                      <span className="ml-3 text-sm font-medium whitespace-nowrap truncate">
                        {board.name}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>

        {/* フッター（設定ボタン + ユーザー情報） */}
        <div className="border-t border-c-border p-2">
          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center px-3 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-lg group"
          >
            <span className="material-symbols-outlined text-xl group-hover:text-blue-400 flex-shrink-0">
              account_circle
            </span>
            {!collapsed && (
              <span className="ml-3 text-sm whitespace-nowrap">アカウント設定</span>
            )}
          </button>
        </div>

        {!collapsed && (
          <div className="p-4 border-t border-c-border">
            {isLoggedIn ? (
              <div className="flex items-center gap-3 mb-3 px-2">
                <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-xs flex-shrink-0">
                  {displayName?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{displayName}</span>
                  <span className="text-[10px] text-slate-500">一般会員</span>
                </div>
              </div>
            ) : null}
            <button
              onClick={isLoggedIn ? handleLogout : () => setShowLogin(true)}
              className="w-full py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">
                {isLoggedIn ? 'logout' : 'login'}
              </span>
              {isLoggedIn ? 'ログアウト' : 'ログイン'}
            </button>
          </div>
        )}

        {!collapsed && (
          <div className="p-4 border-t border-c-border text-[10px] text-slate-500 text-center">
            © 2024 AnonBoard
          </div>
        )}
      </aside>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}
