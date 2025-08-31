import { useEffect, useMemo, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase'

type ProductStatus = 'Available' | 'Rented Out'
type Product = {
  id: string
  name: string
  sku: string
  description: string
  serialNumber: string
  status: ProductStatus
  storeLocation: string
  currentRentalId?: string | null
  createdAt?: unknown
  updatedAt?: unknown
}

export default function InventorySummary() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [openDetail, setOpenDetail] = useState<boolean>(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const col = collection(db, 'products')
      const q = query(col, orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      const list: Product[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Product, 'id'>),
      }))
      setItems(list)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg || 'Failed to load summary')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const onRefresh = () => void load()
    window.addEventListener('products:refresh', onRefresh as EventListener)
    return () =>
      window.removeEventListener('products:refresh', onRefresh as EventListener)
  }, [])

  const { total, available, rented, bySku } = useMemo(() => {
    const totalCount = items.length
    const availableCount = items.filter((p) => p.status === 'Available').length
    const rentedCount = items.filter((p) => p.status === 'Rented Out').length

    const m = new Map<string, { available: number; rented: number }>()
    for (const p of items) {
      const s = m.get(p.sku) ?? { available: 0, rented: 0 }
      if (p.status === 'Available') s.available += 1
      else s.rented += 1
      m.set(p.sku, s)
    }

    return {
      total: totalCount,
      available: availableCount,
      rented: rentedCount,
      bySku: Array.from(m.entries()).map(([sku, v]) => ({ sku, ...v })),
    }
  }, [items])

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex flex-wrap items-center gap-4">
        <Stat label="Total" value={loading ? '…' : String(total)} />
        <Stat label="Available" value={loading ? '…' : String(available)} />
        <Stat label="Rented Out" value={loading ? '…' : String(rented)} />
        <button
          className="ml-auto rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
          onClick={() => setOpenDetail((v) => !v)}
          disabled={!!error || loading}
        >
          {openDetail ? 'Hide by SKU' : 'Show by SKU'}
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">Error: {error}</p>}

      {openDetail && !loading && !error && bySku.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[480px] border divide-y">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">SKU</th>
                <th className="px-3 py-2 text-left">Available</th>
                <th className="px-3 py-2 text-left">Rented Out</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {bySku.map((row) => (
                <tr key={row.sku}>
                  <td className="px-3 py-2">{row.sku}</td>
                  <td className="px-3 py-2">{row.available}</td>
                  <td className="px-3 py-2">{row.rented}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border px-4 py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  )
}
