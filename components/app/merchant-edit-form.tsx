"use client"

import { useState, useRef } from "react"
import { ImagePlus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateProductAction } from "@/actions/products"
import type { ProductWithImages } from "@/actions/products"

interface Props {
  product: ProductWithImages
  onCancel: () => void
  onSuccess: () => void
}

export default function MerchantEditForm({ product, onCancel, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>(product.images.map((i) => i.url))
  const [displayPrice, setDisplayPrice] = useState(product.price ? Number(product.price).toLocaleString("id-ID") : "")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: product.name,
    description: product.description ?? "",
    price: product.price,
    percentage: product.percentage ?? 0,
    stock: String(product.stock),
  })
  const fileRef = useRef<HTMLInputElement>(null)

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = "Name is required"
    if (!form.price) e.price = "Price is required"
    if (!form.stock) e.stock = "Stock is required"
    if (imageUrls.length === 0) e.images = "At least 1 image is required"
    return e
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    try {
      const formData = new FormData()
      files.forEach((f) => formData.append("files", f))
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      setImageUrls((prev) => [...prev, ...data.urls])
      setErrors((prev) => ({ ...prev, images: "" }))
    } catch {
      toast.error("Failed to upload images")
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ""
  }

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    setLoading(true)
    try {
      await updateProductAction(product.id, {
        name: form.name,
        description: form.description,
        imageUrls,
        price: form.price,
        percentage: form.percentage,
        stock: Number(form.stock),
        userId: product.userId,
      })
      toast.success("Product updated successfully")
      onSuccess()
    } catch {
      toast.error("Something went wrong")
    }
    setLoading(false)
  }

  return (
    <>
      <div className="pb-3 shrink-0">
        <h2 className="text-base font-semibold text-neutral-900">Edit Product</h2>
      </div>

      <div className="overflow-y-auto no-scrollbar flex-1 space-y-4 pb-2">
        <div className="space-y-1.5">
          <Label>Name <span className="text-destructive">*</span></Label>
          <Input
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value })
              setErrors({ ...errors, name: "" })
            }}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Price <span className="text-destructive">*</span></Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
            <Input
              className="pl-9"
              value={displayPrice}
              onChange={(e) => {
                const raw = e.target.value.replace(/\./g, "").replace(/\D/g, "")
                setDisplayPrice(raw ? Number(raw).toLocaleString("id-ID") : "")
                setForm({ ...form, price: raw ? Number(raw) : 0 })
                setErrors({ ...errors, price: "" })
              }}
              placeholder="0"
            />
          </div>
          {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Discount Percentage</Label>
          <div className="relative">
            <Input
              type="number"
              min="0"
              max="100"
              value={form.percentage === 0 ? "" : form.percentage}
              onChange={(e) => {
                const val = e.target.value
                setForm({ ...form, percentage: val === "" ? 0 : Math.min(100, Math.max(0, Number(val))) })
              }}
              placeholder="0"
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Stock <span className="text-destructive">*</span></Label>
          <Input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => {
              setForm({ ...form, stock: e.target.value })
              setErrors({ ...errors, stock: "" })
            }}
            placeholder="0"
          />
          {errors.stock && <p className="text-xs text-destructive">{errors.stock}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Images <span className="text-destructive">*</span></Label>
          <div
            className="flex items-center justify-center rounded-lg border border-dashed p-6 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-1 text-center">
              <ImagePlus size={20} className="text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {uploading ? "Uploading..." : "Click to upload images"}
              </p>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
          {errors.images && <p className="text-xs text-destructive">{errors.images}</p>}
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {imageUrls.map((src, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-md">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="text-xs text-white cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-neutral-100 bg-white pt-4 space-y-2 shrink-0">
        <Button className="w-full" onClick={handleSubmit} disabled={loading || uploading}>
          {loading ? "Saving..." : "Save Product"}
        </Button>
        <Button variant="outline" className="w-full" onClick={onCancel}>Cancel</Button>
      </div>
    </>
  )
}