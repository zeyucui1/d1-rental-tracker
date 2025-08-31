// path: src/components/ReturnedRentalsTable.tsx
import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { formatTs, toDate } from '../assets/date'

type Rental = {
  id: string
  productSnapshot?: { name: string; sku: string; serialNumber: string }
  staffName: string
  storeLocation: string
  rentalDate: Timestamp | Date | string | null
  dueDate: Timestamp | Date | string | null
  returnDate: Timestamp | Date | string | null
  status: 'Active' | 'Returned'
}

export default function ReturnedRentalsTable() {
  const [items, setItems] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const col = collection(db, 'rentals')
      let list: Rental[] = []

      try {
        const qy = query(
          col,
          where('status', '==', 'Returned'),
          orderBy('returnDate', 'desc')
        )
        const snap = await getDocs(qy)
        list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Rental, 'id'>),
        }))
      } catch (e) {
        const qy = query(col, where('status', '==', 'Returned'))
        const snap = await getDocs(qy)
        list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Rental, 'id'>),
        }))
        list.sort((a, b) => {
          const da = toDate(a.returnDate)?.getTime() ?? 0
          const dbt = toDate(b.returnDate)?.getTime() ?? 0
          return dbt - da // desc
        })
        console.log(e)
      }

      setItems(list)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const onRefresh = () => void load()
    window.addEventListener('rentals:refresh', onRefresh as EventListener)
    return () =>
      window.removeEventListener('rentals:refresh', onRefresh as EventListener)
  }, [])

  if (loading) return <p className="mt-6">Loading returned rentals…</p>
  if (error) return <p className="mt-6 text-red-600">Error: {error}</p>

  if (!items.length) {
    return (
      <div className="mt-6 rounded-xl border bg-white p-6">
        <p className="text-gray-700">No returned rentals yet.</p>
      </div>
    )
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <h2 className="text-lg font-semibold mb-2">Returned Rentals History</h2>
      <table className="min-w-full border divide-y">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">Product</th>
            <th className="px-4 py-2 text-left">Staff</th>
            <th className="px-4 py-2 text-left">Store</th>
            <th className="px-4 py-2 text-left">Rented At</th>
            <th className="px-4 py-2 text-left">Returned At</th>
          </tr>
        </thead>
        <tbody className="divide-y bg-white">
          {items.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-2">
                {r.productSnapshot?.name ?? '-'}{' '}
                {r.productSnapshot?.sku ? `(${r.productSnapshot.sku})` : ''}
                <div className="text-xs text-gray-500">
                  {r.productSnapshot?.serialNumber ?? ''}
                </div>
              </td>
              <td className="px-4 py-2">{r.staffName}</td>
              <td className="px-4 py-2">{r.storeLocation}</td>
              <td className="px-4 py-2">{formatTs(r.rentalDate)}</td>
              <td className="px-4 py-2">{formatTs(r.returnDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
