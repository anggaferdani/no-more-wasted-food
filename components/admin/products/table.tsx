"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { MoreHorizontal, ImagePlus, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  createProductAction,
  updateProductAction,
  softDeleteProductAction,
  type ProductWithImages,
} from "@/actions/products"
import { getUsersAction } from "@/actions/users"
import type { User } from "@/db/schema"

type ModalMode = "create" | "edit" | null

interface Props {
  initialProducts: ProductWithImages[]
}

export default function ProductsTable({ initialProducts }: Props) {
  const [products, setProducts] = useState(initialProducts)
  const [globalFilter, setGlobalFilter] = useState("")
  const [mode, setMode] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<ProductWithImages | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductWithImages | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [displayPrice, setDisplayPrice] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [usersList, setUsersList] = useState<User[]>([])
  const [userPopoverOpen, setUserPopoverOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    percentage: "" as string | number,
    stock: "",
    userId: "",
  })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getUsersAction().then(setUsersList)
  }, [])

  function openCreate() {
    setForm({ name: "", description: "", price: 0, percentage: "", stock: "", userId: "" })
    setDisplayPrice("")
    setImageUrls([])
    setErrors({})
    setMode("create")
  }

  function openEdit(product: ProductWithImages) {
    setSelected(product)
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: product.price,
      percentage: product.percentage === 0 ? "" : product.percentage,
      stock: String(product.stock),
      userId: product.userId ? String(product.userId) : "",
    })
    setDisplayPrice(product.price ? Number(product.price).toLocaleString("id-ID") : "")
    setImageUrls(product.images.map((i) => i.url))
    setErrors({})
    setMode("edit")
  }

  function closeModal() {
    setMode(null)
    setSelected(null)
    setErrors({})
    setImageUrls([])
    setDisplayPrice("")
    setUserPopoverOpen(false)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = "Name is required"
    if (!form.price) {
      e.price = "Price is required"
    } else if (form.price < 0) {
      e.price = "Enter a valid price"
    }
    if (!form.stock) {
      e.stock = "Stock is required"
    } else if (isNaN(Number(form.stock)) || Number(form.stock) < 0) {
      e.stock = "Enter a valid stock"
    }
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
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      if (mode === "create") {
        await createProductAction({
          name: form.name,
          description: form.description,
          imageUrls,
          price: form.price,
          percentage: form.percentage === "" ? 0 : Number(form.percentage),
          stock: Number(form.stock),
          userId: form.userId ? Number(form.userId) : null,
        })
        toast.success("New product has been created successfully")
        const refreshed = await fetch("/api/products").then((r) => r.json()).catch(() => null)
        if (refreshed) setProducts(refreshed)
      } else if (mode === "edit" && selected) {
        await updateProductAction(selected.id, {
          name: form.name,
          description: form.description,
          imageUrls,
          price: form.price,
          percentage: form.percentage === "" ? 0 : Number(form.percentage),
          stock: Number(form.stock),
          userId: form.userId ? Number(form.userId) : null,
        })
        toast.success("Product has been updated successfully")
        const refreshed = await fetch("/api/products").then((r) => r.json()).catch(() => null)
        if (refreshed) setProducts(refreshed)
      }
      closeModal()
    } catch {
      toast.error("Something went wrong, please try again")
    }
    setLoading(false)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await softDeleteProductAction(deleteTarget.id)
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
    toast.success("Product has been permanently removed from the system")
    setDeleteTarget(null)
  }

  const columns = useMemo<ColumnDef<ProductWithImages>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => <span className="text-sm font-mono">{row.original.code}</span>,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.images[0] && (
              <img src={row.original.images[0].url} alt={row.original.name} className="h-8 w-8 rounded-md object-cover" />
            )}
            <span className="text-sm font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => (
          <span className="text-sm">Rp {Number(row.original.price).toLocaleString("id-ID")}</span>
        ),
      },
      {
        accessorKey: "percentage",
        header: "Disc",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.percentage}%</span>
        ),
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }) => <span className="text-sm">{row.original.stock}</span>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEdit(row.original)}>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteTarget(row.original)}>Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: products,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Input
          placeholder="Search products..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="outline" size="sm" onClick={openCreate}>
          Add Product
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-medium">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground py-10">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>

      <Dialog open={mode !== null} onOpenChange={(open) => { if (!open) closeModal() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Add Product" : "Edit Product"}</DialogTitle>
            <DialogDescription>
              {mode === "create" ? "Fill in the details to create a new product." : "Update the product's information below."}
            </DialogDescription>
          </DialogHeader>

          <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4 space-y-4">
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
                    const display = raw ? Number(raw).toLocaleString("id-ID") : ""
                    setDisplayPrice(display)
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
                  value={form.percentage}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === "") {
                      setForm({ ...form, percentage: "" })
                      return
                    }
                    setForm({ ...form, percentage: Math.min(100, Math.max(0, Number(val))) })
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
              <Label>Merchant</Label>
              <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    {form.userId
                      ? usersList.find((u) => u.id.toString() === form.userId)?.name ?? "Select option"
                      : "Select option"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No user found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            setForm({ ...form, userId: "" })
                            setUserPopoverOpen(false)
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", form.userId === "" ? "opacity-100" : "opacity-0")} />
                          None
                        </CommandItem>
                        {usersList.map((u) => (
                          <CommandItem
                            key={u.id}
                            value={u.name}
                            onSelect={() => {
                              setForm({ ...form, userId: u.id.toString() })
                              setUserPopoverOpen(false)
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", form.userId === u.id.toString() ? "opacity-100" : "opacity-0")} />
                            {u.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
                      <img src={src} alt={`preview-${i}`} className="h-full w-full object-cover" />
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

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading || uploading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}