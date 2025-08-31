// path: src/components/BookOutDialog.tsx
import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

type ProductLite = {
  id: string
  name: string
  sku: string
  serialNumber: string
  storeLocation: string
}

const LOCATIONS = [
  { value: 'MEL', label: 'Melbourne (MEL)' },
  { value: 'SYD', label: 'Sydney (SYD)' },
  { value: 'BNE', label: 'Brisbane (BNE)' },
  { value: 'PER', label: 'Perth (PER)' },
  { value: 'ADL', label: 'Adelaide (ADL)' },
  { value: 'CBR', label: 'Canberra (CBR)' },
  { value: 'HBA', label: 'Hobart (HBA)' },
  { value: 'DRW', label: 'Darwin (DRW)' },
] as const

function todayLocalYMD(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function BookOutDialog({
  open,
  onClose,
  product,
}: {
  open: boolean
  onClose: () => void
  product: ProductLite | null
}) {
  const [storeLocation, setStoreLocation] = useState<string>('')
  const [staffName, setStaffName] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const minDueDate = useMemo(() => todayLocalYMD(), [])

  useEffect(() => {
    if (open && product) {
      setStoreLocation(product.storeLocation ?? '')
      setError(null)

      if (!dueDate) setDueDate(minDueDate)
    }
  }, [open, product, minDueDate, dueDate])

  useEffect(() => {
    if (!open) {
      setStoreLocation('')
      setStaffName('')
      setDueDate('')
      setSubmitting(false)
      setError(null)
    }
  }, [open])

  if (!open || !product) return null
  const p: ProductLite = product

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!staffName || !storeLocation || !dueDate) {
      setError('Please fill store location, staff name and due date.')
      return
    }

    const today = todayLocalYMD()
    if (dueDate < today) {
      setError('Due date cannot be earlier than today.')
      return
    }

    setSubmitting(true)
    try {
      const rentalsRef = collection(db, 'rentals')
      const rentalDoc = await addDoc(rentalsRef, {
        productId: p.id,
        productSnapshot: {
          name: p.name,
          sku: p.sku,
          serialNumber: p.serialNumber,
        },
        storeLocation,
        staffName,
        rentalDate: serverTimestamp(),
        dueDate: Timestamp.fromDate(new Date(`${dueDate}T00:00:00`)),
        returnDate: null,
        status: 'Active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      await updateDoc(doc(db, 'products', p.id), {
        status: 'Rented Out',
        currentRentalId: rentalDoc.id,
        updatedAt: serverTimestamp(),
      })

      window.dispatchEvent(new CustomEvent('products:refresh'))
      window.dispatchEvent(new CustomEvent('rentals:refresh'))

      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 top-20 mx-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Book Out Product</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          {p.name}{' '}
          <span className="text-gray-400">
            ({p.sku} · {p.serialNumber})
          </span>
        </p>

        <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              Store Location *
            </label>
            <select
              className="mt-1 w-full rounded-md border bg-white px-3 py-2"
              value={storeLocation}
              onChange={(e) => setStoreLocation(e.target.value)}
              required
            >
              <option value="" disabled>
                Select a store location
              </option>
              {LOCATIONS.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Default: product location {p.storeLocation}
            </p>
          </div>

          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              Staff Name *
            </label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Due Date *
            </label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={dueDate}
              min={minDueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Must be today or later.
            </p>
          </div>

          {error && (
            <p className="sm:col-span-2 text-sm text-red-600">Error: {error}</p>
          )}

          <div className="sm:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              className="rounded-md border px-4 py-2 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Booking...' : 'Book Out'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
