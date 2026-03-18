import { classifyUrl } from './urlExtract'

export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'anchor'; raw: string; numbers: number[] }
  | { type: 'url'; url: string; linkType: 'image' | 'twitter' | 'youtube' | 'url' }

function expandAnchorStr(str: string): number[] {
  const nums: number[] = []
  for (const part of str.split(',')) {
    const rangeMatch = part.match(/^(\d+)-(\d+)$/)
    if (rangeMatch) {
      const s = parseInt(rangeMatch[1])
      const e = parseInt(rangeMatch[2])
      const limit = Math.min(e, s + 50)
      for (let i = s; i <= limit; i++) nums.push(i)
    } else {
      const n = parseInt(part)
      if (!isNaN(n)) nums.push(n)
    }
  }
  return [...new Set(nums)]
}

export function tokenizeContent(content: string): ContentPart[] {
  const parts: ContentPart[] = []
  // URL must match before anchors (priority)
  const combinedRe = /(https?:\/\/[^\s<>"]+)|(>>?\d[\d,\-]*)/g
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = combinedRe.exec(content)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ type: 'text', text: content.slice(lastIndex, m.index) })
    }
    if (m[1]) {
      const url = m[1]
      parts.push({ type: 'url', url, linkType: classifyUrl(url) })
    } else if (m[2]) {
      const raw = m[2]
      const afterGt = raw.replace(/^>>?/, '')
      const numbers = expandAnchorStr(afterGt)
      parts.push({ type: 'anchor', raw, numbers })
    }
    lastIndex = combinedRe.lastIndex
  }
  if (lastIndex < content.length) {
    parts.push({ type: 'text', text: content.slice(lastIndex) })
  }
  return parts
}

export function parseAnchorsFromContent(content: string): number[] {
  const parts = tokenizeContent(content)
  return parts
    .filter((p): p is { type: 'anchor'; raw: string; numbers: number[] } => p.type === 'anchor')
    .flatMap((p) => p.numbers)
}

export function buildAnchorTree(
  startNumber: number,
  allPosts: { postNumber: number; content: string }[],
): number[] {
  const anchorsTo = new Map<number, number[]>()
  const anchoredBy = new Map<number, number[]>()

  for (const post of allPosts) {
    const nums = parseAnchorsFromContent(post.content)
    anchorsTo.set(post.postNumber, nums)
    for (const n of nums) {
      const existing = anchoredBy.get(n) ?? []
      existing.push(post.postNumber)
      anchoredBy.set(n, existing)
    }
  }

  const visited = new Set<number>([startNumber])
  const queue = [startNumber]
  while (queue.length > 0) {
    const current = queue.shift()!
    const neighbors = [...(anchorsTo.get(current) ?? []), ...(anchoredBy.get(current) ?? [])]
    for (const n of neighbors) {
      if (!visited.has(n)) {
        visited.add(n)
        queue.push(n)
      }
    }
  }

  return [...visited].sort((a, b) => a - b)
}
