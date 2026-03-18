import { useState, useEffect } from 'react'
import type { Post } from '../../api/types'
import { fullDateTime } from '../../utils/formatDate'
import { tokenizeContent, parseAnchorsFromContent } from '../../utils/anchorParse'
import { extractMedia, getYouTubeVideoId } from '../../utils/urlExtract'
import { heatClass } from '../../utils/heatColor'

export interface PostHandlers {
  onAnchorClick: (numbers: number[], triggerY: number) => void
  onBadgeClick: (postNumber: number, triggerY: number) => void
  onIdClick: (id: string, triggerY: number) => void
  onNameClick: (name: string, triggerY: number) => void
  onBodyClick: (postNumber: number, triggerY: number) => void
  onReply: (postNumber: number) => void
}

interface PostArticleProps {
  post: Post
  anchorCount: number
  idCount: number
  handlers: PostHandlers
  isInPopup?: boolean
}

const LINK_COLORS = {
  image: 'text-orange-400 hover:text-orange-300',
  twitter: 'text-sky-400 hover:text-sky-300',
  youtube: 'text-red-400 hover:text-red-300',
  url: 'text-blue-400 hover:text-blue-300',
} as const

function idColorClass(count: number): string {
  if (count >= 7) return 'text-red-500 font-bold'
  if (count >= 5) return 'text-orange-500 font-bold'
  if (count >= 3) return 'text-amber-500'
  if (count === 1) return 'text-slate-600'
  return 'text-slate-400'
}

export default function PostArticle({
  post,
  anchorCount,
  idCount,
  handlers,
  isInPopup,
}: PostArticleProps) {
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const lbNext = () =>
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % lightboxImages.length : 0,
    )
  const lbPrev = () =>
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + lightboxImages.length) % lightboxImages.length : 0,
    )

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') lbNext()
      else if (e.key === 'ArrowLeft') lbPrev()
      else if (e.key === 'Escape') setLightboxIndex(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex, lightboxImages.length])

  const isDeleted = post.content.startsWith('\x00') || post.content === '[削除済み]'
  const numHeat = heatClass(anchorCount)
  const outgoingAnchors = parseAnchorsFromContent(post.content)
  const hasConnections = outgoingAnchors.length > 0 || anchorCount > 0

  const media = extractMedia(post.content)
  const imageUrls = media.filter((m) => m.type === 'image').map((m) => m.url)
  const youtubeItems = media.filter((m) => m.type === 'youtube')

  function getTriggerY(e: React.MouseEvent): number {
    return (e.currentTarget as HTMLElement).getBoundingClientRect().top
  }

  function handleBodyClick(e: React.MouseEvent) {
    if (window.getSelection()?.toString().trim()) return
    if (!hasConnections) return
    handlers.onBodyClick(post.postNumber, (e.currentTarget as HTMLElement).getBoundingClientRect().top)
  }

  function handleAnchorClick(numbers: number[], e: React.MouseEvent) {
    e.stopPropagation()
    if (window.getSelection()?.toString().trim()) return
    handlers.onAnchorClick(numbers, (e.currentTarget as HTMLElement).getBoundingClientRect().top)
  }

  const parts = tokenizeContent(post.content)
  const bodyTextClass = !isDeleted && anchorCount >= 3 ? numHeat : isDeleted ? 'text-slate-500 italic' : 'text-slate-700 dark:text-slate-300'

  const renderedContent = parts.map((part, i) => {
    if (part.type === 'anchor') {
      return (
        <button
          key={i}
          type="button"
          className="text-blue-400 hover:text-blue-300 hover:underline text-sm"
          onClick={(e) => handleAnchorClick(part.numbers, e)}
        >
          {part.raw}
        </button>
      )
    }
    if (part.type === 'url') {
      return (
        <a
          key={i}
          href={part.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-sm break-all hover:underline ${LINK_COLORS[part.linkType]}`}
          onClick={(e) => e.stopPropagation()}
        >
          {part.url}
        </a>
      )
    }
    return (
      <span key={i} className={bodyTextClass}>
        {part.text}
      </span>
    )
  })

  return (
    <article className="w-full" id={isInPopup ? undefined : `post-${post.postNumber}`}>
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        {/* レス番号バッジ */}
        <button
          type="button"
          className={`font-bold text-sm flex items-center gap-1 ${numHeat || 'text-blue-400'} ${anchorCount > 0 ? 'hover:opacity-80' : 'cursor-default'}`}
          onClick={anchorCount > 0 ? (e) => handlers.onBadgeClick(post.postNumber, getTriggerY(e)) : undefined}
        >
          <span>{post.postNumber}</span>
          {anchorCount > 0 && (
            <span className={`text-xs ${numHeat || 'text-slate-500'}`}>({anchorCount})</span>
          )}
        </button>

        {/* 投稿者名 */}
        <button
          type="button"
          className="font-bold text-green-500 text-xs hover:text-green-400"
          onClick={(e) => handlers.onNameClick(post.posterName, getTriggerY(e))}
        >
          {post.posterName}
        </button>

        {post.posterSubInfo && (
          <span className="text-xs text-slate-500">{post.posterSubInfo}</span>
        )}
        <span className="text-xs text-slate-500">{fullDateTime(post.createdAt)}</span>

        {/* ID */}
        {post.displayUserId && (
          <button
            type="button"
            className={`text-xs font-mono flex items-center gap-0.5 hover:opacity-80 ${idColorClass(idCount)}`}
            onClick={(e) => handlers.onIdClick(post.displayUserId, getTriggerY(e))}
          >
            <span>ID:{post.displayUserId}</span>
            {idCount >= 2 && <span className="text-xs">({idCount})</span>}
          </button>
        )}

        {/* 返信ボタン */}
        <button
          type="button"
          className="text-xs text-slate-500 dark:text-slate-600 bg-slate-100 dark:bg-slate-800/50 px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 transition-colors ml-auto"
          onClick={() => handlers.onReply(post.postNumber)}
        >
          返信
        </button>
      </div>

      {/* 本文 */}
      <div
        className={`${
          post.postNumber === 1
            ? 'bg-slate-100/50 dark:bg-slate-800/20 rounded-xl p-5 border border-c-border'
            : 'pl-4 border-l-2 border-c-border ml-1'
        } ${hasConnections ? 'cursor-pointer' : ''}`}
        onClick={handleBodyClick}
      >
        <p className="leading-relaxed whitespace-pre-wrap text-sm">{renderedContent}</p>

        {/* サムネイル */}
        {(imageUrls.length > 0 || youtubeItems.length > 0) && (
          <div className="mt-4 pt-4 border-t border-c-border flex flex-wrap gap-2">
            {imageUrls.map((url, i) => (
              <button
                key={i}
                type="button"
                className="w-20 h-20 bg-slate-900 border border-slate-700 rounded overflow-hidden flex-shrink-0 flex items-center justify-center hover:border-slate-500 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxImages(imageUrls)
                  setLightboxIndex(i)
                }}
              >
                <img
                  src={url}
                  alt="thumbnail"
                  className="w-full h-full object-contain"
                  loading="lazy"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement
                    img.style.display = 'none'
                    const parent = img.parentElement
                    if (parent && !parent.querySelector('span')) {
                      const span = document.createElement('span')
                      span.className = 'text-slate-600 text-[10px] p-1 text-center leading-tight'
                      span.textContent = '画像を取得できません'
                      parent.appendChild(span)
                    }
                  }}
                />
              </button>
            ))}
            {youtubeItems.map((item, i) => {
              const videoId = item.videoId ?? getYouTubeVideoId(item.url)
              if (!videoId) return null
              return (
                <a
                  key={`yt-${i}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-20 h-20 bg-slate-900 border border-slate-700 rounded overflow-hidden flex-shrink-0 flex items-center justify-center hover:border-slate-500 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={`https://img.youtube.com/vi/${videoId}/default.jpg`}
                    alt="YouTube thumbnail"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement
                      img.style.display = 'none'
                      const parent = img.parentElement
                      if (parent && !parent.querySelector('span')) {
                        const span = document.createElement('span')
                        span.className = 'text-slate-600 text-[10px] p-1 text-center leading-tight'
                        span.textContent = '画像を取得できません'
                        parent.appendChild(span)
                      }
                    }}
                  />
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-0.5 rounded leading-none pointer-events-none">
                    ▶
                  </span>
                </a>
              )
            })}
          </div>
        )}
      </div>

      {/* ライトボックス */}
      {lightboxIndex !== null && lightboxImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
          onWheel={(e) => {
            if (lightboxImages.length <= 1) return
            e.deltaY > 0 ? lbNext() : lbPrev()
          }}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white hover:text-slate-300 z-10"
            onClick={() => setLightboxIndex(null)}
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>

          {/* 画像 + 左右ボタンをまとめたコンテナ */}
          <div
            className="relative inline-flex items-stretch"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxImages.length > 1 && (
              <button
                type="button"
                className="flex items-center justify-center w-16 bg-black/40 hover:bg-black/70 text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); lbPrev() }}
              >
                <span className="material-symbols-outlined text-6xl">chevron_left</span>
              </button>
            )}
            <img
              src={lightboxImages[lightboxIndex]}
              alt="expanded"
              className="max-w-[80vw] max-h-[90vh] object-contain block"
            />
            {lightboxImages.length > 1 && (
              <button
                type="button"
                className="flex items-center justify-center w-16 bg-black/40 hover:bg-black/70 text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); lbNext() }}
              >
                <span className="material-symbols-outlined text-6xl">chevron_right</span>
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  )
}
