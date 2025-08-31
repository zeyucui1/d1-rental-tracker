import { formatTs } from '../assets/date'
import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

type Rental = {
  id: string
  productId: string
  productSnapshot?: { name: string; sku: string; serialNumber: string }
  storeLocation: string
  staffName: string
  rentalDate: Timestamp | Date | string | null
  dueDate: Timestamp | Date | string | null
  status: 'Active' | 'Returned'
}

export default function ActiveRentalsTable() {
  const [items, setItems] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const col = collection(db, 'rentals')
      const qy = query(
        col,
        where('status', '==', 'Active'),
        orderBy('rentalDate', 'desc')
      )
      const snap = await getDocs(qy)
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Rental, 'id'>),
        }))
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg || 'Failed to load rentals')
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

  async function onCheckIn(r: Rental) {
    if (pendingId) return
    setPendingId(r.id)
    try {
      // rentals → Returned
      await updateDoc(doc(db, 'rentals', r.id), {
        status: 'Returned',
        returnDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      // products → Available
      await updateDoc(doc(db, 'products', r.productId), {
        status: 'Available',
        currentRentalId: null,
        updatedAt: serverTimestamp(),
      })
      // refresh
      window.dispatchEvent(new CustomEvent('rentals:refresh'))
      window.dispatchEvent(new CustomEvent('products:refresh'))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      alert('Check-in failed: ' + msg)
    } finally {
      setPendingId(null)
    }
  }

  if (loading) return <p className="mt-6">Loading rentals…</p>
  if (error) return <p className="mt-6 text-red-600">Error: {error}</p>

  if (!items.length) {
    return (
      <div className="mt-6 rounded-xl border p-6 bg-white">
        <p className="text-gray-700">No active rentals.</p>
        <p className="text-sm text-gray-500 mt-1">
          Book out a product to see it here.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <h2 className="text-lg font-semibold mb-2">Active Rentals Record</h2>
      <table className="min-w-full border divide-y">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">Product</th>
            <th className="px-4 py-2 text-left">Staff</th>
            <th className="px-4 py-2 text-left">Store</th>
            <th className="px-4 py-2 text-left">Rental Date</th>
            <th className="px-4 py-2 text-left">Due Date</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y bg-white">
          
          {items.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-2">
                {r.productSnapshot?.name ?? r.productId}
                <div className="text-xs text-gray-500">
                  {r.productSnapshot?.sku} · {r.productSnapshot?.serialNumber}
                </div>
              </td>
              <td className="px-4 py-2">{r.staffName}</td>
              <td className="px-4 py-2">{r.storeLocation}</td>
              <td className="px-4 py-2">{formatTs(r.rentalDate)}</td>
              <td className="px-4 py-2">{formatTs(r.dueDate)}</td>
              <td className="px-4 py-2">
                <button
                  className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
                  disabled={pendingId === r.id}
                  onClick={() => onCheckIn(r)}
                >
                  {pendingId === r.id ? 'Checking…' : 'Check In'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
