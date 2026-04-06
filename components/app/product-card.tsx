"use client"

import type { ProductWithImages } from "@/actions/products"

interface Props {
  product: ProductWithImages
  onClick?: () => void
}

export default function ProductCard({ product, onClick }: Props) {
  const image = product.images[0]?.url
  const percentage = product.percentage ?? 0
  const originalPrice = product.price
  const discountedPrice = percentage > 0
    ? Math.round(originalPrice - (originalPrice * percentage) / 100)
    : originalPrice

  return (
    <div
      className="flex items-stretch gap-3 py-3 cursor-pointer active:opacity-70 transition-opacity"
      onClick={onClick}
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
        {image ? (
          <img src={image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-neutral-200" />
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <span className="text-[10px] font-medium text-white">Habis</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-900 truncate">{product.name}</p>
          {product.description && (
            <p className="text-xs text-neutral-500 truncate mt-0.5">{product.description}</p>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-neutral-900">
              Rp {discountedPrice.toLocaleString("id-ID")}
            </span>
            {percentage > 0 && (
              <>
                <span className="text-xs text-neutral-400 line-through">
                  Rp {originalPrice.toLocaleString("id-ID")}
                </span>
                <span className="text-xs font-medium text-green-600">{percentage}%</span>
              </>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            {product.stock === 0 ? "Habis" : `Stok: ${product.stock}`}
          </p>
        </div>
      </div>
    </div>
  )
}