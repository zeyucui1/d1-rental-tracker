// path: src/components/EditProductDialog.tsx
import { useEffect, useState } from 'react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

export type EditableProduct = {
  id: string
  name: string
  sku: string
  description: string
  serialNumber: string
  storeLocation: string
  status: 'Available' | 'Rented Out'
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

export default function EditProductDialog({
  open,
  onClose,
  product,
}: {
  open: boolean
  onClose: () => void
  product: EditableProduct | null
}) {
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [description, setDescription] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [storeLocation, setStoreLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && product) {
      setName(product.name ?? '')
      setSku(product.sku ?? '')
      setDescription(product.description ?? '')
      setSerialNumber(product.serialNumber ?? '')
      setStoreLocation(product.storeLocation ?? '') 
      setError(null)
    }
  }, [open, product])


  useEffect(() => {
    if (!open) {
      setName('')
      setSku('')
      setDescription('')
      setSerialNumber('')
      setStoreLocation('')
      setSubmitting(false)
      setError(null)
    }
  }, [open])

  if (!open || !product) return null

  const p: EditableProduct = product

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name || !sku || !serialNumber || !storeLocation) {
      setError('Please fill name, sku, serialNumber and storeLocation.')
      return
    }

    setSubmitting(true)
    try {
      await updateDoc(doc(db, 'products', p.id), {
        name,
        sku,
        description,
        serialNumber,
        storeLocation,
        updatedAt: serverTimestamp(),
      })
      window.dispatchEvent(new CustomEvent('products:refresh'))
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
          <h2 className="text-lg font-semibold">Edit Product</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">Status: {p.status}</p>

        <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              SKU *
            </label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              className="mt-1 w-full rounded-md border px-3 py-2"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              Serial Number *
            </label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
            />
          </div>

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
              {submitting ? 'Saving...' : 'Save Changes'}
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
