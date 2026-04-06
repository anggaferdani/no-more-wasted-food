"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { createTransactionAction } from "@/actions/transactions"
import { softDeleteProductAction } from "@/actions/products"
import MerchantEditForm from "@/components/app/merchant-edit-form"
import type { ProductWithImages } from "@/actions/products"

interface Props {
  product: ProductWithImages | null
  open: boolean
  onClose: () => void
  onRefresh?: () => void
  isMerchant?: boolean
  currentUserId?: number | null
}

export default function ProductSheet({ product, open, onClose, onRefresh, isMerchant, currentUserId }: Props) {
  const [activeImage, setActiveImage] = useState(0)
  const [visible, setVisible] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [sheetMode, setSheetMode] = useState<"detail" | "edit" | "delete">("detail")
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    if (open) {
      setActiveImage(0)
      setQuantity(1)
      setSheetMode("detail")
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [open])

  if (!product && !open) return null

  const percentage = product?.percentage ?? 0
  const originalPrice = product?.price ?? 0
  const discountedPrice = percentage > 0
    ? Math.round(originalPrice - (originalPrice * percentage) / 100)
    : originalPrice
  const totalPrice = discountedPrice * quantity
  const images = product?.images ?? []
  const maxQty = product?.stock ?? 0
  const isOwner = isMerchant && currentUserId != null && Number(product?.userId) === Number(currentUserId)

  const footerHeight = !isMerchant
    ? "pb-[180px]"
    : isOwner
    ? "pb-[160px]"
    : "pb-[72px]"

  function prev() {
    setActiveImage((i) => (i === 0 ? images.length - 1 : i - 1))
  }

  function next() {
    setActiveImage((i) => (i === images.length - 1 ? 0 : i + 1))
  }

  async function handleBuy() {
    if (!product) return
    setLoading(true)
    const res = await createTransactionAction({
      userId: session?.user?.id ? Number(session.user.id) : null,
      productId: product.id,
      merchantId: product.userId ?? null,
      originalPrice,
      percentage,
      unitPrice: discountedPrice,
      quantity,
      totalPrice,
    })
    setLoading(false)
    if (res.success) {
      onClose()
      router.push(`/transactions/${res.code}`)
    }
  }

  async function handleDelete() {
    if (!product) return
    setLoading(true)
    await softDeleteProductAction(product.id)
    toast.success("Product deleted successfully")
    setLoading(false)
    onRefresh?.()
    onClose()
  }

  return (
    <>
      {open && (
        <div
          className="absolute inset-0 z-50 bg-black/40 transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
          onClick={onClose}
        />
      )}
      <div
        className="absolute bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-white transition-transform duration-300"
        style={{
          transform: open && visible ? "translateY(0)" : "translateY(100%)",
          height: "90%",
        }}
      >
        {product && (
          <>
            <div className="flex items-center justify-center pt-3 pb-1 shrink-0">
              <div className="h-1 w-10 rounded-full bg-neutral-200" />
            </div>

            {sheetMode === "edit" ? (
              <div className="flex-1 flex flex-col overflow-hidden px-4 pt-2 pb-4">
                <MerchantEditForm
                  product={product}
                  onCancel={() => setSheetMode("detail")}
                  onSuccess={() => { onRefresh?.(); onClose() }}
                />
              </div>
            ) : (
              <>
                <div className={`flex-1 overflow-y-auto no-scrollbar ${footerHeight}`}>
                  {images.length > 0 && (
                    <div className="px-4 pt-2">
                      <div className="relative w-full overflow-hidden rounded-xl">
                        <div className="aspect-video w-full">
                          <img
                            src={images[activeImage]?.url}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        {images.length > 1 && (
                          <>
                            <button
                              onClick={prev}
                              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-neutral-700"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <button
                              onClick={next}
                              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-neutral-700"
                            >
                              <ChevronRight size={16} />
                            </button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
                              {images.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setActiveImage(i)}
                                  className={`h-1.5 rounded-full transition-all ${
                                    activeImage === i ? "w-4 bg-white" : "w-1.5 bg-white/50"
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="px-4 pt-4 pb-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-base font-semibold text-neutral-900 leading-tight">{product.name}</h2>
                      {product.stock === 0 ? (
                        <span className="shrink-0 text-xs text-red-500 font-medium">Habis</span>
                      ) : (
                        <span className="shrink-0 text-xs text-neutral-500">Stok: {product.stock}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-bold text-neutral-900">
                        Rp {discountedPrice.toLocaleString("id-ID")}
                      </span>
                      {percentage > 0 && (
                        <>
                          <span className="text-sm text-neutral-400 line-through">
                            Rp {originalPrice.toLocaleString("id-ID")}
                          </span>
                          <span className="text-xs font-medium text-green-600">{percentage}% off</span>
                        </>
                      )}
                    </div>

                    {product.description && (
                      <p className="text-sm text-neutral-600 leading-relaxed">{product.description}</p>
                    )}

                    {product.user && (
                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
                          {product.user.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-xs font-medium text-neutral-900">{product.user.name}</p>
                      </div>
                    )}
                  </div>
                </div>

                {sheetMode === "detail" && (
                  <div className="absolute bottom-0 left-0 right-0 border-t border-neutral-100 bg-white p-4 space-y-3 rounded-b-2xl">
                    {isOwner && (
                      <>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setSheetMode("edit")}
                        >
                          Edit Product
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full text-red-500 hover:text-red-500 hover:bg-red-50"
                          onClick={() => setSheetMode("delete")}
                        >
                          Delete Product
                        </Button>
                      </>
                    )}
                    {!isMerchant && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-500">Quantity</span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 text-neutral-600"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-medium w-6 text-center">{quantity}</span>
                            <button
                              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                              disabled={quantity >= maxQty}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 disabled:opacity-40"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                        <Button
                          className="w-full"
                          disabled={product.stock === 0 || loading}
                          onClick={handleBuy}
                        >
                          {loading ? "Processing..." : `Buy Now · Rp ${totalPrice.toLocaleString("id-ID")}`}
                        </Button>
                      </>
                    )}
                    <Button variant="outline" className="w-full" onClick={onClose}>
                      Cancel
                    </Button>
                  </div>
                )}

                {sheetMode === "delete" && (
                  <div className="absolute bottom-0 left-0 right-0 border-t border-neutral-100 bg-white p-4 space-y-3 rounded-b-2xl">
                    <p className="text-sm text-neutral-600 text-center pb-1">
                      Are you sure you want to delete <strong>{product.name}</strong>?
                    </p>
                    <Button
                      variant="outline"
                      className="w-full text-red-500 hover:text-red-500 hover:bg-red-50"
                      onClick={handleDelete}
                      disabled={loading}
                    >
                      {loading ? "Deleting..." : "Delete"}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setSheetMode("detail")}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}