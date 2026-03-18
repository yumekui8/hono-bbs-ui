import { useMemo, useRef, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import BoardSidebar from '../components/layout/BoardSidebar'
import ThreadListPanel from '../components/layout/ThreadListPanel'
import { usePosts } from '../hooks/usePosts'
import { useSettingsStore } from '../stores/settingsStore'
import { filterPosts } from '../utils/filter'
import PostArticle, { type PostHandlers } from '../components/post/PostArticle'
import PostPopup, { type PopupEntry } from '../components/post/PostPopup'
import Minimap from '../components/post/Minimap'
import ReplyForm from '../components/post/ReplyForm'
import { parseAnchorsFromContent, buildAnchorTree } from '../utils/anchorParse'
import { recordThreadView } from '../utils/threadHistory'

interface ThreadViewProps {
  replyLayout: 'bottom' | 'right'
}

function ThreadView({ replyLayout }: ThreadViewProps) {
  const { boardId, threadId } = useParams()
  const { data, isLoading } = usePosts(boardId, threadId)
  const ngWords = useSettingsStore((s) => s.ngWords)
  const historyMaxGenerations = useSettingsStore((s) => s.historyMaxGenerations)
  const setReplyLayout = useSettingsStore((s) => s.setReplyLayout)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [popups, setPopups] = useState<PopupEntry[]>([])
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null)
  const insertSeqRef = useRef(0)
  const [insertAnchor, setInsertAnchor] = useState<{ text: string; seq: number } | null>(null)

  const thread = data?.data.thread
  const rawPosts = data?.data.posts ?? []
  const posts = useMemo(() => filterPosts(rawPosts, ngWords), [rawPosts, ngWords])

  useEffect(() => {
    const el = scrollAreaRef.current
    if (!el) return
    const update = () => setContainerRect(el.getBoundingClientRect())
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [posts])

  useEffect(() => {
    if (!data || !boardId || !threadId) return
    const t = data.data.thread
    const board = (data as { data: { board?: { name: string } } }).data.board
    recordThreadView(
      {
        threadId,
        boardId,
        threadTitle: t.title,
        boardName: board?.name ?? boardId,
        lastReadCount: t.postCount,
      },
      historyMaxGenerations,
    )
  }, [data, boardId, threadId, historyMaxGenerations])

  const anchorCountMap = useMemo(() => {
    const map = new Map<number, number>()
    for (const post of posts) {
      for (const n of parseAnchorsFromContent(post.content)) {
        map.set(n, (map.get(n) ?? 0) + 1)
      }
    }
    return map
  }, [posts])

  const idCountMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const post of posts) {
      if (post.displayUserId) {
        map.set(post.displayUserId, (map.get(post.displayUserId) ?? 0) + 1)
      }
    }
    return map
  }, [posts])

  function openPopup(entry: Omit<PopupEntry, 'id'>) {
    setPopups((prev) => [...prev, { ...entry, id: crypto.randomUUID() }])
  }

  function closeTop() {
    setPopups((prev) => prev.slice(0, -1))
  }

  function closeAll() {
    setPopups([])
  }

  const handlers: PostHandlers = {
    onAnchorClick: (numbers, triggerY) => {
      const matched = posts.filter((p) => numbers.includes(p.postNumber))
      const title = numbers.map((n) => `>>${n}`).join(' ')
      openPopup({ title, posts: matched, triggerY })
    },
    onBadgeClick: (postNumber, triggerY) => {
      const repliers = posts.filter((p) =>
        parseAnchorsFromContent(p.content).includes(postNumber),
      )
      openPopup({
        title: `>>${postNumber} へのレス (${repliers.length}件)`,
        posts: repliers,
        triggerY,
      })
    },
    onIdClick: (id, triggerY) => {
      const idPosts = posts.filter((p) => p.displayUserId === id)
      openPopup({ title: `ID:${id} (${idPosts.length}件)`, posts: idPosts, triggerY })
    },
    onNameClick: (name, triggerY) => {
      const namePosts = posts.filter((p) => p.posterName === name)
      openPopup({ title: `${name} (${namePosts.length}件)`, posts: namePosts, triggerY })
    },
    onBodyClick: (postNumber, triggerY) => {
      const treeNumbers = buildAnchorTree(postNumber, posts)
      if (treeNumbers.length <= 1) return
      const treePosts = posts
        .filter((p) => treeNumbers.includes(p.postNumber))
        .sort((a, b) => a.postNumber - b.postNumber)
      openPopup({ title: `>>${postNumber} のアンカーツリー`, posts: treePosts, triggerY })
    },
    onReply: (postNumber) => {
      insertSeqRef.current += 1
      setInsertAnchor({ text: String(postNumber), seq: insertSeqRef.current })
    },
  }

  if (!boardId || !threadId) {
    return (
      <main className="flex-1 flex items-center justify-center bg-c-base">
        <div className="text-slate-600 text-sm">スレッドを選択してください</div>
      </main>
    )
  }

  const postsArea = (
    <div
      ref={scrollAreaRef}
      className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6"
    >
      {isLoading ? (
        <div className="text-slate-500 text-sm">読み込み中...</div>
      ) : posts.length === 0 ? (
        <div className="text-slate-500 text-sm">投稿がありません</div>
      ) : (
        posts.map((post) => (
          <PostArticle
            key={post.id}
            post={post}
            anchorCount={anchorCountMap.get(post.postNumber) ?? 0}
            idCount={idCountMap.get(post.displayUserId) ?? 1}
            handlers={handlers}
          />
        ))
      )}
    </div>
  )

  const header = (
    <header className="h-16 flex-shrink-0 border-b border-c-border bg-c-base/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="min-w-0">
        <h2 className="font-bold text-slate-900 dark:text-white truncate text-base">
          {thread ? thread.title : '読み込み中...'}
        </h2>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <button
          className={`p-2 transition-colors rounded-lg ${replyLayout === 'right' ? 'text-blue-500 bg-blue-500/10' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
          title={replyLayout === 'right' ? '書き込みパネル: 右側' : '書き込みパネル: 下部'}
          onClick={() => setReplyLayout(replyLayout === 'bottom' ? 'right' : 'bottom')}
        >
          <span className="material-symbols-outlined text-xl">
            {replyLayout === 'right' ? 'view_sidebar' : 'view_agenda'}
          </span>
        </button>
        <button
          className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          title="更新"
          onClick={() => {}}
        >
          <span className="material-symbols-outlined text-xl">refresh</span>
        </button>
      </div>
    </header>
  )

  return (
    <main className="flex-1 flex flex-col bg-c-base overflow-hidden">
      {header}

      {replyLayout === 'bottom' ? (
        <>
          <div className="flex flex-1 overflow-hidden">
            {postsArea}
            {posts.length > 0 && (
              <Minimap posts={posts} scrollAreaRef={scrollAreaRef} />
            )}
          </div>
          <ReplyForm boardId={boardId} threadId={threadId} layout="bottom" insertAnchor={insertAnchor} />
        </>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            {postsArea}
            {posts.length > 0 && (
              <Minimap posts={posts} scrollAreaRef={scrollAreaRef} />
            )}
          </div>
          <ReplyForm boardId={boardId} threadId={threadId} layout="right" insertAnchor={insertAnchor} />
        </div>
      )}

      <PostPopup
        popups={popups}
        containerRect={containerRect}
        anchorCountMap={anchorCountMap}
        idCountMap={idCountMap}
        handlers={handlers}
        onCloseTop={closeTop}
        onCloseAll={closeAll}
      />
    </main>
  )
}

export default function MainBoardPage() {
  const { threadId } = useParams()
  const replyLayout = useSettingsStore((s) => s.replyLayout)

  return (
    <div className="flex h-full w-full overflow-hidden bg-c-base text-slate-700 dark:text-slate-200">
      <BoardSidebar />
      <ThreadListPanel />
      <ThreadView key={threadId ?? 'none'} replyLayout={replyLayout} />
    </div>
  )
}
