export function heatClass(count: number): string {
  if (count >= 7) return 'text-red-500 font-bold'
  if (count >= 5) return 'text-orange-500 font-bold'
  if (count >= 3) return 'text-amber-500'
  return ''
}
