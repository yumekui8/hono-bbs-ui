import type { Thread } from '../../api/types'
import { relativeTime } from '../../utils/formatDate'
import { extractMedia } from '../../utils/urlExtract'

interface ThreadCardProps {
  thread: Thread
  isActive: boolean
  onClick: () => void
}

export default function ThreadCard({ thread, isActive, onClick }: ThreadCardProps) {
  const momentum = Math.round(
    thread.postCount /
      Math.max(1, (Date.now() - new Date(thread.createdAt).getTime()) / 3_600_000),
  )
  const isTrending = momentum > 50

  const thumbnailUrl = thread.firstPost
    ? extractMedia(thread.firstPost.content).find((m) => m.type === 'image')?.url ?? null
    : null

  const creatorId = thread.firstPost?.displayUserId ?? null

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-c-border cursor-pointer transition-colors relative ${
        isActive ? 'bg-slate-100 dark:bg-slate-800/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/20'
      }`}
    >
      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}

      <div className="flex justify-between items-start mb-1">
        {isTrending ? (
          <span className="text-[10px] font-bold text-orange-400 uppercase tracking-tighter">
            🔥 トレンド
          </span>
        ) : (
          <span className="text-[10px] text-slate-500" />
        )}
        <span className="text-[10px] text-slate-500">{relativeTime(thread.updatedAt)}</span>
      </div>

      <div className="flex gap-3">
        {thumbnailUrl ? (
          <div className="w-16 h-16 rounded bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden border border-c-border">
            <img
              src={thumbnailUrl}
              alt="thumbnail"
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                const img = e.target as HTMLImageElement
                img.style.display = 'none'
              }}
            />
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm leading-tight mb-1 line-clamp-2 ${
              isActive ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-200'
            }`}
          >
            {thread.title}
          </h3>
          <div className="flex items-center text-[10px] gap-3">
            <div className={`flex items-center gap-1 ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
              <span className="font-bold">レス:</span>
              <span className={`px-1 rounded ${isActive ? 'bg-blue-400/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {thread.postCount}
              </span>
            </div>
            <div className={`flex items-center gap-1 ${isTrending ? 'text-orange-400' : 'text-slate-400'}`}>
              <span className="font-bold">勢い:</span>
              <span className={`px-1 rounded ${isTrending ? 'bg-orange-400/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {momentum > 1000 ? `${(momentum / 1000).toFixed(1)}k` : momentum}
              </span>
            </div>
            {creatorId && (
              <div className="ml-auto text-slate-400 font-mono truncate">
                ID:{creatorId}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
