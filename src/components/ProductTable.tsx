// path: src/components/ProductsTable.tsx
import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  serverTimestamp,
  where,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import BookOutDialog from './BookOutDialog'
import EditProductDialog, { type EditableProduct } from './EditProductDialog'

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

type ProductLite = {
  id: string
  name: string
  sku: string
  serialNumber: string
  storeLocation: string
}

export default function ProductsTable() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [openBook, setOpenBook] = useState(false)
  const [selected, setSelected] = useState<ProductLite | null>(null)

  const [openEdit, setOpenEdit] = useState(false)
  const [editing, setEditing] = useState<EditableProduct | null>(null)

  async function loadProducts() {
    setLoading(true)
    setError(null)
    try {
      const col = collection(db, 'products')
      const qy = query(col, orderBy('createdAt', 'desc'))
      const snap = await getDocs(qy)
      const list: Product[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Product, 'id'>),
      }))
      setItems(list)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProducts()
    const onRefresh = () => void loadProducts()
    window.addEventListener('products:refresh', onRefresh as EventListener)
    return () =>
      window.removeEventListener('products:refresh', onRefresh as EventListener)
  }, [])

  function onBookOutClick(p: Product) {
    const lite: ProductLite = {
      id: p.id,
      name: p.name,
      sku: p.sku,
      serialNumber: p.serialNumber,
      storeLocation: p.storeLocation,
    }
    setSelected(lite)
    setOpenBook(true)
  }

  function onEditClick(p: Product) {
    const ep: EditableProduct = {
      id: p.id,
      name: p.name,
      sku: p.sku,
      description: p.description,
      serialNumber: p.serialNumber,
      storeLocation: p.storeLocation,
      status: p.status,
    }
    setEditing(ep)
    setOpenEdit(true)
  }

  async function onDeleteClick(p: Product) {
    if (p.status !== 'Available') {
      alert('Only products with status "Available" can be deleted.')
      return
    }
    const ok = confirm(
      `Delete product "${p.name}" (${p.sku})? This cannot be undone.`
    )
    if (!ok) return
    try {
      await deleteDoc(doc(db, 'products', p.id))
      window.dispatchEvent(new CustomEvent('products:refresh'))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      alert('Delete failed: ' + msg)
    }
  }

  async function onCheckInClick(p: Product) {
    const rid =
      p.currentRentalId && p.currentRentalId !== 'null'
        ? p.currentRentalId
        : null
    try {
      let rentalId = rid
      if (!rentalId) {
        const rentalsCol = collection(db, 'rentals')
        const qy = query(
          rentalsCol,
          where('productId', '==', p.id),
          where('status', '==', 'Active'),
          orderBy('rentalDate', 'desc')
        )
        const snap = await getDocs(qy)
        if (!snap.empty) rentalId = snap.docs[0].id
      }
      if (!rentalId) {
        alert('No active rental found for this product.')
        return
      }
      await updateDoc(doc(db, 'rentals', rentalId), {
        status: 'Returned',
        returnDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      await updateDoc(doc(db, 'products', p.id), {
        status: 'Available',
        currentRentalId: null,
        updatedAt: serverTimestamp(),
      })
      window.dispatchEvent(new CustomEvent('products:refresh'))
      window.dispatchEvent(new CustomEvent('rentals:refresh'))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      alert('Check-in failed: ' + msg)
    }
  }

  if (loading) return <p className="mt-6">Loading products…</p>
  if (error) return <p className="mt-6 text-red-600">Error: {error}</p>

  if (!items.length) {
    return (
      <div className="mt-6 rounded-xl border p-6 bg-white">
        <p className="text-gray-700">No products found.</p>
        <p className="text-sm text-gray-500 mt-1">
          Add some documents in Firestore collection <code>products</code>.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border divide-y">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">SKU</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white">
            {items.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">{p.sku}</td>
                <td className="px-4 py-2 text-gray-700">{p.description}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-sm ${
                      p.status === 'Available'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
                    onClick={() => onEditClick(p)}
                  >
                    Edit
                  </button>

                  {p.status === 'Available' ? (
                    <>
                      <button
                        className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
                        onClick={() => onBookOutClick(p)}
                      >
                        Book Out
                      </button>
                      <button
                        className="rounded-md border px-3 py-1 text-sm hover:bg-red-50"
                        onClick={() => onDeleteClick(p)}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <button
                      className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
                      onClick={() => onCheckInClick(p)}
                    >
                      Check In
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BookOutDialog
        open={openBook}
        onClose={() => setOpenBook(false)}
        product={selected}
      />

      <EditProductDialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        product={editing}
      />
    </>
  )
}
