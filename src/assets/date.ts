
import type { Timestamp } from 'firebase/firestore'


export function toDate(
  ts: Timestamp | Date | string | null | undefined
): Date | null {
  if (!ts) return null
  if (typeof ts === 'string') return new Date(ts)
  if (ts instanceof Date) return ts
  if (typeof (ts as Timestamp).toDate === 'function')
    return (ts as Timestamp).toDate()
  return new Date(String(ts))
}


export function formatTs(
  ts: Timestamp | Date | string | null | undefined
): string {
  const d = toDate(ts)
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleString() : '-'
}
