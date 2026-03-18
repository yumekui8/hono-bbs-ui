import { useEffect, useRef } from 'react'
import type { Post } from '../../api/types'
import { extractMedia } from '../../utils/urlExtract'

interface MinimapProps {
  posts: Post[]
  scrollAreaRef: React.RefObject<HTMLDivElement | null>
}

export default function Minimap({ posts, scrollAreaRef }: MinimapProps) {
  const thumbRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollArea = scrollAreaRef.current
    const thumb = thumbRef.current
    if (!scrollArea || !thumb) return

    function update() {
      if (!scrollArea || !thumb) return
      const { scrollHeight, clientHeight, scrollTop } = scrollArea
      const thumbHeight = (clientHeight / scrollHeight) * 100
      const thumbTop = (scrollTop / scrollHeight) * 100
      thumb.style.height = `${thumbHeight}%`
      thumb.style.top = `${thumbTop}%`
    }

    scrollArea.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    update()
    return () => {
      scrollArea.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [scrollAreaRef])

  function scrollToPost(postNumber: number) {
    const el = document.getElementById(`post-${postNumber}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const markers = posts
    .filter((p) => extractMedia(p.content).some((m) => m.type === 'image' || m.type === 'youtube'))
    .map((p) => ({
      postNumber: p.postNumber,
      percent: ((p.postNumber - 1) / Math.max(1, posts.length - 1)) * 90 + 5,
      type: extractMedia(p.content).some((m) => m.type === 'image') ? 'image' : 'youtube',
    }))

  return (
    <div
      className="w-8 flex-shrink-0 relative pt-4 pb-40"
      style={{ background: 'rgba(15,17,21,0.5)', borderLeft: '1px solid rgba(51,65,85,0.3)' }}
    >
      <div
        ref={thumbRef}
        className="absolute left-0.5 right-0.5 rounded"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />
      {markers.map((m) => (
        <button
          key={m.postNumber}
          onClick={() => scrollToPost(m.postNumber)}
          className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full hover:scale-150 transition-transform"
          style={{
            top: `${m.percent}%`,
            background: m.type === 'image' ? '#f59e0b' : '#a855f7',
          }}
          title={`${m.postNumber}: ${m.type === 'image' ? '画像' : 'YouTube'}あり`}
        />
      ))}
    </div>
  )
}
