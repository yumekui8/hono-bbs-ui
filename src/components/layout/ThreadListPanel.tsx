import { useNavigate, useParams } from 'react-router-dom'
import { useThreads } from '../../hooks/useThreads'
import { useSettingsStore } from '../../stores/settingsStore'
import { filterThreads } from '../../utils/filter'
import ThreadCard from '../thread/ThreadCard'
import { useDragResize } from '../../hooks/useDragResize'

export default function ThreadListPanel() {
  const { boardId, threadId } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useThreads(boardId)
  const ngWords = useSettingsStore((s) => s.ngWords)

  const board = data?.data.board
  const rawThreads = data?.data.threads ?? []
  const threads = filterThreads(rawThreads, ngWords)

  const { size: panelWidth, onMouseDown } = useDragResize({
    cookieKey: 'bbs-thread-list-width',
    defaultSize: 320,
    direction: 'horizontal',
    min: 160,
    max: 600,
  })

  return (
    <section
      style={{ width: panelWidth }}
      className="flex-shrink-0 border-r border-c-border bg-c-base flex flex-col relative"
    >
      {/* 右端ドラッグハンドル */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/30 transition-colors z-10"
        onMouseDown={onMouseDown}
      />

      <div className="p-4 border-b border-c-border space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-slate-900 dark:text-white text-lg">
            {board ? board.name : boardId ? '読み込み中...' : '板を選択'}
          </h2>
        </div>
        {boardId && (
          <button
            onClick={() => navigate(`/new-thread/${boardId}`)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add_comment</span>
            新規スレッド作成
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {!boardId ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            左のサイドバーから板を選択してください
          </div>
        ) : isLoading ? (
          <div className="p-8 text-center text-slate-500 text-sm">読み込み中...</div>
        ) : threads.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">スレッドがありません</div>
        ) : (
          threads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              isActive={threadId === thread.id}
              onClick={() => navigate(`/${boardId}/${thread.id}`)}
            />
          ))
        )}
      </div>
    </section>
  )
}
