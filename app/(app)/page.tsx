"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import ProductCard from "@/components/app/product-card"
import ProductSheet from "@/components/app/product-sheet"
import BannerSlider from "@/components/app/banner-slider"
import type { ProductWithImages } from "@/actions/products"
import type { Banner } from "@/db/schema"

export default function HomePage() {
  const router = useRouter()
  const [products, setProducts] = useState<ProductWithImages[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<ProductWithImages | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setProducts(data.slice(0, 5)))
    fetch("/api/banners")
      .then((r) => r.json())
      .then(setBanners)
  }, [])

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && search.trim()) {
      router.push(`/products?q=${encodeURIComponent(search.trim())}`)
    }
  }

  function openSheet(product: ProductWithImages) {
    setSelected(product)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <Input
          className="pl-8 text-sm"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      </div>

      {banners.length > 0 && <BannerSlider banners={banners} />}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">Products</h2>
          <button
            className="text-xs text-neutral-500 cursor-pointer"
            onClick={() => router.push("/products")}
          >
            More
          </button>
        </div>
        <div className="divide-y divide-neutral-100">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onClick={() => openSheet(p)} />
          ))}
        </div>
      </div>

      <ProductSheet product={selected} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}