import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useSearchParams, useNavigate } from 'react-router-dom'
import { useTurnstileStore } from './stores/turnstileStore'
import { useSettingsStore } from './stores/settingsStore'
import MainBoardPage from './pages/MainBoardPage'
import NewThreadPage from './pages/NewThreadPage'
import SettingsPage from './pages/SettingsPage'

function TurnstileHandler() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setSession = useTurnstileStore((s) => s.setSession)

  useEffect(() => {
    const token = searchParams.get('setTurnstileToken')
    if (token) {
      setSession(token)
      const url = new URL(window.location.href)
      url.searchParams.delete('setTurnstileToken')
      navigate(url.pathname + url.search, { replace: true })
    }
  }, [searchParams, setSession, navigate])

  return null
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // auto: システム設定に従う
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      if (mq.matches) root.classList.add('dark')
      else root.classList.remove('dark')
    }
  }, [theme])

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <TurnstileHandler />
        <Routes>
          <Route path="/" element={<MainBoardPage />} />
          <Route path="/:boardId" element={<MainBoardPage />} />
          <Route path="/:boardId/:threadId" element={<MainBoardPage />} />
          <Route path="/new-thread/:boardId" element={<NewThreadPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  )
}
