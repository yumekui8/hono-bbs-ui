import { useRef, useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPost } from '../../api/posts'
import { useTurnstileStore } from '../../stores/turnstileStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { TurnstileRequiredError, ApiError } from '../../api/client'
import { env } from '../../config/env'
import { useDragResize } from '../../hooks/useDragResize'
import { getPostDraft, savePostDraft, clearPostDraft } from '../../utils/draftCache'

interface ReplyFormProps {
  boardId: string
  threadId: string
  layout: 'bottom' | 'right'
  insertAnchor?: { text: string; seq: number } | null
}

function TurnstileErrorMessage() {
  const returnTo = encodeURIComponent(window.location.href)
  return (
    <span>
      <a
        href={`${env.turnstileTokenUrl}?returnTo=${returnTo}`}
        className="underline font-medium hover:text-red-300"
      >
        Turnstile
      </a>
      セッションが必要です
    </span>
  )
}

export default function ReplyForm({ boardId, threadId, layout, insertAnchor }: ReplyFormProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isTurnstileError, setIsTurnstileError] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const defaultPosterName = useSettingsStore((s) => s.defaultPosterName)
  const defaultSubInfo = useSettingsStore((s) => s.defaultSubInfo)

  const [posterName, setPosterName] = useState(defaultPosterName)
  const [subInfo, setSubInfo] = useState(defaultSubInfo)

  // 下書き復元
  useEffect(() => {
    const draft = getPostDraft(boardId, threadId)
    if (draft?.content) {
      setContent(draft.content)
    }
  }, [boardId, threadId])

  // 下書き自動保存
  useEffect(() => {
    if (content.trim()) {
      savePostDraft(boardId, threadId, content, env.postCacheGen)
    }
  }, [content, boardId, threadId])

  useEffect(() => {
    setPosterName(defaultPosterName)
  }, [defaultPosterName])

  useEffect(() => {
    if (!insertAnchor) return
    const ta = textareaRef.current
    if (!ta) return
    const anchor = `>>${insertAnchor.text}\n`
    const start = ta.selectionStart ?? ta.value.length
    const newContent = ta.value.slice(0, start) + anchor + ta.value.slice(start)
    setContent(newContent)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + anchor.length, start + anchor.length)
    }, 0)
  }, [insertAnchor])

  const queryClient = useQueryClient()
  const turnstileValid = useTurnstileStore((s) => s.isValid())
  const setTurnstileSession = useTurnstileStore((s) => s.setSession)

  // 右パネル幅のリサイズ（左端ドラッグ）
  const { size: rightWidth, onMouseDown: onRightDrag } = useDragResize({
    cookieKey: 'bbs-reply-right-width',
    defaultSize: 320,
    direction: 'horizontal',
    inverted: true,
    min: 200,
    max: 600,
  })

  // 下フッター高さのリサイズ（上端ドラッグ）
  const { size: bottomHeight, onMouseDown: onBottomDrag } = useDragResize({
    cookieKey: 'bbs-reply-bottom-height',
    defaultSize: 160,
    direction: 'vertical',
    inverted: true,
    min: 80,
    max: 500,
  })

  const mutation = useMutation({
    mutationFn: () =>
      createPost(boardId, threadId, {
        content,
        ...(posterName.trim() ? { posterName: posterName.trim() } : {}),
        ...(subInfo.trim() ? { posterSubInfo: subInfo.trim() } : {}),
      }),
    onSuccess: () => {
      setContent('')
      setError(null)
      setIsTurnstileError(false)
      clearPostDraft(boardId, threadId)
      queryClient.invalidateQueries({ queryKey: ['posts', boardId, threadId] })
    },
    onError: (err) => {
      if (err instanceof TurnstileRequiredError) {
        setIsTurnstileError(true)
        setError('turnstile')
      } else {
        setIsTurnstileError(false)
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError('投稿に失敗しました')
        }
      }
    },
  })

  function handleInput() {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = '0'
    ta.style.height = `${ta.scrollHeight}px`
  }

  async function handleSubmit() {
    if (!content.trim()) return
    setError(null)
    setIsTurnstileError(false)

    if (env.disableTurnstile && !turnstileValid) {
      setTurnstileSession('dev-turnstile-disabled')
    }

    mutation.mutate()
  }

  function insertTag(before: string, after: string) {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.slice(start, end)
    const newContent =
      content.slice(0, start) + before + selected + after + content.slice(end)
    setContent(newContent)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 0)
  }

  const errorNode = error && (
    <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs flex-shrink-0">
      {isTurnstileError && !env.disableTurnstile && env.turnstileTokenUrl ? (
        <TurnstileErrorMessage />
      ) : (
        error
      )}
    </div>
  )

  if (layout === 'right') {
    return (
      <div
        style={{ width: rightWidth }}
        className="flex-shrink-0 flex h-full bg-c-surface border-l border-c-border relative"
      >
        {/* 左端ドラッグハンドル */}
        <div
          className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/30 transition-colors z-10"
          onMouseDown={onRightDrag}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden pl-2">
          <div className="px-4 py-3 border-b border-c-border flex items-center justify-between flex-shrink-0">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">書き込む</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => insertTag('**', '**')}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded transition-colors"
                title="太字"
              >
                <span className="material-symbols-outlined text-lg">format_bold</span>
              </button>
              <button
                type="button"
                onClick={() => insertTag('`', '`')}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded transition-colors"
                title="コード"
              >
                <span className="material-symbols-outlined text-lg">code</span>
              </button>
            </div>
          </div>
          {errorNode}
          <div className="flex-1 flex flex-col p-4 gap-3 min-h-0">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onInput={handleInput}
              className="flex-1 bg-transparent border border-c-border rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-600/50 focus:outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 resize-none custom-scrollbar text-sm min-h-[120px]"
              placeholder="返信を書き込む..."
            />
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center gap-1 transition-colors mb-2"
              >
                <span className="material-symbols-outlined text-sm">
                  {showOptions ? 'expand_less' : 'expand_more'}
                </span>
                オプション
              </button>
              {showOptions && (
                <div className="space-y-2 mb-3">
                  <input
                    type="text"
                    value={posterName}
                    onChange={(e) => setPosterName(e.target.value)}
                    placeholder="投稿者名"
                    className="w-full bg-transparent border border-c-border rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-600/50 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={subInfo}
                    onChange={(e) => setSubInfo(e.target.value)}
                    placeholder="オプション欄（sage など）"
                    className="w-full bg-transparent border border-c-border rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-600/50 focus:outline-none"
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={mutation.isPending || !content.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all flex-shrink-0"
            >
              {mutation.isPending ? '送信中...' : '書き込む'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // bottom layout
  return (
    <footer
      style={{ height: bottomHeight }}
      className="bg-c-surface border-t border-c-border flex flex-col flex-shrink-0"
    >
      {/* 上端ドラッグハンドル */}
      <div
        className="h-2 flex-shrink-0 cursor-row-resize hover:bg-blue-500/30 transition-colors"
        onMouseDown={onBottomDrag}
      />

      {errorNode}

      <div className="flex items-center px-4 py-2 border-b border-c-border bg-slate-100/50 dark:bg-slate-800/30 gap-3 flex-shrink-0">
        <button
          type="button"
          onClick={() => insertTag('**', '**')}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded transition-colors"
          title="太字"
        >
          <span className="material-symbols-outlined text-lg">format_bold</span>
        </button>
        <button
          type="button"
          onClick={() => insertTag('`', '`')}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded transition-colors"
          title="コード"
        >
          <span className="material-symbols-outlined text-lg">code</span>
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">
            {showOptions ? 'expand_less' : 'expand_more'}
          </span>
          オプション
        </button>
      </div>

      {showOptions && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-c-border bg-slate-50 dark:bg-slate-800/20 flex-shrink-0">
          <input
            type="text"
            value={posterName}
            onChange={(e) => setPosterName(e.target.value)}
            placeholder="投稿者名"
            className="flex-1 bg-transparent border border-c-border rounded-lg px-3 py-1 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-600/50 focus:outline-none"
          />
          <input
            type="text"
            value={subInfo}
            onChange={(e) => setSubInfo(e.target.value)}
            placeholder="オプション欄（sage など）"
            className="flex-1 bg-transparent border border-c-border rounded-lg px-3 py-1 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-600/50 focus:outline-none"
          />
        </div>
      )}

      <div className="flex items-stretch p-3 gap-4 flex-1 min-h-0">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 placeholder-slate-400 resize-none custom-scrollbar text-sm"
          placeholder="返信を書き込む..."
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={mutation.isPending || !content.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 rounded-xl font-bold text-sm transition-all flex-shrink-0 self-end py-2"
        >
          {mutation.isPending ? '送信中...' : '書き込む'}
        </button>
      </div>
    </footer>
  )
}
