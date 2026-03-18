import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Post } from '../../api/types'
import PostArticle, { type PostHandlers } from './PostArticle'

export interface PopupEntry {
  id: string
  title: string
  posts: Post[]
  triggerY: number
}

const HEADER_HEIGHT = 64

interface PopupWindowProps {
  entry: PopupEntry
  stackIndex: number
  containerRect: DOMRect | null
  anchorCountMap: Map<number, number>
  idCountMap: Map<string, number>
  handlers: PostHandlers
}

function PopupWindow({
  entry,
  stackIndex,
  containerRect,
  anchorCountMap,
  idCountMap,
  handlers,
}: PopupWindowProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    visibility: 'hidden',
    left: containerRect ? containerRect.left : window.innerWidth / 2 - 300,
    width: containerRect ? containerRect.width : 600,
    maxWidth: '100vw',
    zIndex: 9001 + stackIndex,
  })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const height = el.scrollHeight
    const left = containerRect ? containerRect.left : window.innerWidth / 2 - Math.min(600, window.innerWidth - 32) / 2
    const width = containerRect ? containerRect.width : Math.min(600, window.innerWidth - 32)
    const spaceAbove = entry.triggerY - HEADER_HEIGHT
    const maxScreenHeight = window.innerHeight * 0.9

    let top: number
    let maxHeight: string
    if (height <= spaceAbove) {
      top = entry.triggerY - height
      maxHeight = `${spaceAbove}px`
    } else {
      top = HEADER_HEIGHT
      maxHeight = `${maxScreenHeight}px`
    }

    setStyle({
      position: 'fixed',
      visibility: 'visible',
      left,
      width,
      maxWidth: '100vw',
      top,
      maxHeight,
      overflowY: 'auto',
      zIndex: 9001 + stackIndex,
    })
  }, [entry.triggerY, entry.posts, containerRect, stackIndex])

  return (
    <div
      ref={ref}
      className="bg-c-surface border border-c-border rounded-xl shadow-2xl custom-scrollbar"
      style={style}
      onWheel={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-4 py-3 border-b border-c-border sticky top-0 bg-c-surface z-10">
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{entry.title}</span>
      </div>
      <div className="p-4 space-y-4">
        {entry.posts.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">投稿が見つかりません</p>
        ) : (
          entry.posts.map((post) => (
            <PostArticle
              key={post.id}
              post={post}
              anchorCount={anchorCountMap.get(post.postNumber) ?? 0}
              idCount={idCountMap.get(post.displayUserId) ?? 1}
              handlers={handlers}
              isInPopup
            />
          ))
        )}
      </div>
    </div>
  )
}

interface PostPopupProps {
  popups: PopupEntry[]
  containerRect: DOMRect | null
  anchorCountMap: Map<number, number>
  idCountMap: Map<string, number>
  handlers: PostHandlers
  onCloseTop: () => void
  onCloseAll: () => void
}

export default function PostPopup({
  popups,
  containerRect,
  anchorCountMap,
  idCountMap,
  handlers,
  onCloseTop,
  onCloseAll,
}: PostPopupProps) {
  if (popups.length === 0) return null

  return createPortal(
    <div
      className="fixed inset-0"
      style={{ zIndex: 9000 }}
      onClick={onCloseTop}
      onWheel={() => onCloseAll()}
    >
      {popups.map((entry, index) => (
        <PopupWindow
          key={entry.id}
          entry={entry}
          stackIndex={index}
          containerRect={containerRect}
          anchorCountMap={anchorCountMap}
          idCountMap={idCountMap}
          handlers={handlers}
        />
      ))}
    </div>,
    document.body,
  )
}
