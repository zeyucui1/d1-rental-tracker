// path: src/components/AddproductForm.tsx
import { useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

type FormState = {
  name: string
  sku: string
  description: string
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

const initial: FormState = {
  name: '',
  sku: '',
  description: '',
  serialNumber: '',
  storeLocation: '',
}

export default function AddProductForm() {
  const [form, setForm] = useState<FormState>(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  function isValidLocation(loc: string) {
    return LOCATIONS.some((l) => l.value === loc)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setOk(false)

    // 必填校验 + 下拉值校验
    if (!form.name || !form.sku || !form.serialNumber || !form.storeLocation) {
      setError('Please fill name, sku, serialNumber and storeLocation.')
      return
    }
    if (!isValidLocation(form.storeLocation)) {
      setError('Please select a valid store location.')
      return
    }

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'products'), {
        ...form,
        status: 'Available',
        currentRentalId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // 新增成功 → 通知产品列表刷新
      window.dispatchEvent(new CustomEvent('products:refresh'))

      setOk(true)
      setForm(initial)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-6 rounded-xl border bg-white p-6">
      <h2 className="text-lg font-semibold">Add Product</h2>
      <p className="text-sm text-gray-600">
        Status will default to “Available”.
      </p>

      <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Name *
          </label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="DJI Mavic 3 Pro"
            required
          />
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            SKU *
          </label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            placeholder="MAVIC3PRO"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Professional drone with Hasselblad camera"
          />
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Serial Number *
          </label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={form.serialNumber}
            onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
            placeholder="SN-DJI-M3P-0001"
            required
          />
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Store Location *
          </label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2 bg-white"
            value={form.storeLocation}
            onChange={(e) =>
              setForm({ ...form, storeLocation: e.target.value })
            }
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
        {ok && (
          <p className="sm:col-span-2 text-sm text-green-700">
            Product added. List will refresh.
          </p>
        )}

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-md border px-4 py-2 disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? 'Adding...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
