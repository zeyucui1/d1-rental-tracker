// path: src/components/TabsLayout.tsx
import { useState } from 'react'
import AddProductForm from './AddproductForm'
import ProductsTable from './ProductTable'
import ActiveRentalsTable from './ActiveRentalTable'
import ReturnedRentalsTable from './ReturnedRentalsTable'
import InventorySummary from './InventorySummary'

type TabKey = 'products' | 'rentals'

export default function TabsLayout() {
  const [active, setActive] = useState<TabKey>('products')

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <h1 className="text-lg font-bold">
            D1 Store – Staff Product Rental Tracker
          </h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="mx-auto max-w-6xl px-6 pt-4">
        <div className="inline-flex rounded-xl border bg-white p-1">
          <TabButton
            label="Products"
            active={active === 'products'}
            onClick={() => setActive('products')}
          />
          <TabButton
            label="Rentals"
            active={active === 'rentals'}
            onClick={() => setActive('rentals')}
          />
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-6xl p-6">
        {active === 'products' ? <ProductsView /> : <RentalsView />}
      </main>
    </div>
  )
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={
        'px-4 py-2 rounded-lg text-sm ' +
        (active ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100')
      }
    >
      {label}
    </button>
  )
}

function ProductsView() {
  return (
    <>
      <InventorySummary />
      <div className="mt-6" />
      <AddProductForm />
      <ProductsTable />
    </>
  )
}

function RentalsView() {
  return (
    <>
      <ActiveRentalsTable />
      <ReturnedRentalsTable />
    </>
  )
}
