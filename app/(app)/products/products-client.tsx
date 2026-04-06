"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Search, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import ProductCard from "@/components/app/product-card"
import ProductSheet from "@/components/app/product-sheet"
import MerchantCreateSheet from "@/components/app/merchant-create-sheet"
import type { ProductWithImages } from "@/actions/products"
import { useDebouncedCallback } from "use-debounce"

const PAGE_SIZE = 10

export default function ProductsClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [allProducts, setAllProducts] = useState<ProductWithImages[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get("q") ?? "")
  const [selected, setSelected] = useState<ProductWithImages | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [page, setPage] = useState(1)

  const isMerchant = session?.user?.role === "merchant"

  const fetchProducts = useCallback(async (q: string) => {
    setLoading(true)
    const res = await fetch(`/api/products${q ? `?search=${encodeURIComponent(q)}` : ""}`)
    const data: ProductWithImages[] = await res.json()
    const filtered = isMerchant && session?.user?.id
      ? data.filter((p) => p.userId === Number(session.user.id))
      : data
    setAllProducts(filtered)
    setPage(1)
    setLoading(false)
  }, [isMerchant, session?.user?.id])

  const debouncedFetch = useDebouncedCallback((q: string) => {
    fetchProducts(q)
    router.replace(q ? `/products?q=${encodeURIComponent(q)}` : "/products")
  }, 400)

  useEffect(() => {
    fetchProducts(search)
  }, [])

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    debouncedFetch(e.target.value)
  }

  function openSheet(product: ProductWithImages) {
    setSelected(product)
    setSheetOpen(true)
  }

  const totalPages = Math.ceil(allProducts.length / PAGE_SIZE)
  const paginated = allProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const grouped = isMerchant
    ? paginated.reduce<Record<string, ProductWithImages[]>>((acc, p) => {
        const key = p.user?.name ?? "Unknown"
        if (!acc[key]) acc[key] = []
        acc[key].push(p)
        return acc
      }, {})
    : null

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-neutral-900">Products</h1>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <Input
          className="pl-8 text-sm"
          placeholder="Search products..."
          value={search}
          onChange={handleSearch}
        />
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-neutral-400">Loading...</div>
      ) : paginated.length === 0 ? (
        <div className="py-10 text-center text-sm text-neutral-400">No products found.</div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {paginated.map((p) => (
            <ProductCard key={p.id} product={p} onClick={() => openSheet(p)} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-neutral-400 pt-2">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={14} />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {isMerchant && (
        <button
          onClick={() => setCreateOpen(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 ml-[calc(theme(maxWidth.sm)/2-3rem)] flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-white z-40"
        >
          <Plus size={20} />
        </button>
      )}

      <ProductSheet
        product={selected}
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setSelected(null) }}
        onRefresh={() => fetchProducts(search)}
        isMerchant={isMerchant}
        currentUserId={session?.user?.id ? Number(session.user.id) : null}
      />

      {isMerchant && createOpen && (
        <MerchantCreateSheet
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          userId={session?.user?.id ? Number(session.user.id) : null}
          onRefresh={() => fetchProducts(search)}
        />
      )}
    </div>
  )
}