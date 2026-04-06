import { Suspense } from "react"
import ProductsClient from "./products-client"

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-sm text-neutral-400">Loading...</div>}>
      <ProductsClient />
    </Suspense>
  )
}