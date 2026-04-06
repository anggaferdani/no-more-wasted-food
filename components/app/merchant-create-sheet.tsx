"use client"

import { useState, useRef, useEffect } from "react"
import { ImagePlus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createProductAction } from "@/actions/products"

interface Props {
  open: boolean
  onClose: () => void
  userId: number | null
  onRefresh: () => void
}

export default function MerchantCreateSheet({ open, onClose, userId, onRefresh }: Props) {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [displayPrice, setDisplayPrice] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ name: "", description: "", price: 0, percentage: 0, stock: "" })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setForm({ name: "", description: "", price: 0, percentage: 0, stock: "" })
      setDisplayPrice("")
      setImageUrls([])
      setErrors({})
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [open])

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
      await createProductAction({
        name: form.name,
        description: form.description,
        imageUrls,
        price: form.price,
        percentage: form.percentage,
        stock: Number(form.stock),
        userId,
      })
      toast.success("Product created successfully")
      onRefresh()
      onClose()
    } catch {
      toast.error("Something went wrong")
    }
    setLoading(false)
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
          maxHeight: "90%",
        }}
      >
        <div className="flex items-center justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-neutral-200" />
        </div>

        <div className="px-4 pt-2 pb-1 shrink-0">
          <h2 className="text-base font-semibold text-neutral-900">Create Product</h2>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 space-y-4">
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
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
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
                      <button type="button" onClick={() => removeImage(i)} className="text-xs text-white cursor-pointer">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-neutral-100 bg-white p-4 space-y-2 shrink-0">
          <Button className="w-full" onClick={handleSubmit} disabled={loading || uploading}>
            {loading ? "Saving..." : "Save Product"}
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </>
  )
}