"use client"

import { useState, useMemo, useRef } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { MoreHorizontal, ImagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { createBannerAction, updateBannerAction, softDeleteBannerAction } from "@/actions/banners"
import type { Banner } from "@/db/schema"

type ModalMode = "create" | "edit" | null

interface Props {
  initialBanners: Banner[]
}

export default function BannersTable({ initialBanners }: Props) {
  const [banners, setBanners] = useState(initialBanners)
  const [globalFilter, setGlobalFilter] = useState("")
  const [mode, setMode] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<Banner | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ name: "", imageUrl: "", linkUrl: "" })
  const fileRef = useRef<HTMLInputElement>(null)

  function openCreate() {
    setForm({ name: "", imageUrl: "", linkUrl: "" })
    setPreview("")
    setErrors({})
    setMode("create")
  }

  function openEdit(banner: Banner) {
    setSelected(banner)
    setForm({ name: banner.name, imageUrl: banner.imageUrl, linkUrl: banner.linkUrl ?? "" })
    setPreview(banner.imageUrl)
    setErrors({})
    setMode("edit")
  }

  function closeModal() {
    setMode(null)
    setSelected(null)
    setErrors({})
    setPreview("")
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = "Name is required"
    if (!form.imageUrl) e.imageUrl = "Image is required"
    return e
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("files", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      const url = data.urls[0]
      setForm((prev) => ({ ...prev, imageUrl: url }))
      setPreview(url)
      setErrors((prev) => ({ ...prev, imageUrl: "" }))
    } catch {
      toast.error("Failed to upload image")
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ""
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
        await createBannerAction({ name: form.name, imageUrl: form.imageUrl, linkUrl: form.linkUrl || undefined })
        toast.success("New banner has been created successfully")
        const refreshed = await fetch("/api/banners").then((r) => r.json()).catch(() => null)
        if (refreshed) setBanners(refreshed)
      } else if (mode === "edit" && selected) {
        await updateBannerAction(selected.id, { name: form.name, imageUrl: form.imageUrl, linkUrl: form.linkUrl || undefined })
        toast.success("Banner has been updated successfully")
        const refreshed = await fetch("/api/banners").then((r) => r.json()).catch(() => null)
        if (refreshed) setBanners(refreshed)
      }
      closeModal()
    } catch {
      toast.error("Something went wrong, please try again")
    }
    setLoading(false)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await softDeleteBannerAction(deleteTarget.id)
    setBanners((prev) => prev.filter((b) => b.id !== deleteTarget.id))
    toast.success("Banner has been permanently removed from the system")
    setDeleteTarget(null)
  }

  const columns = useMemo<ColumnDef<Banner>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <img
              src={row.original.imageUrl}
              alt={row.original.name}
              className="h-8 w-14 rounded-md object-cover"
            />
            <span className="text-sm font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "linkUrl",
        header: "Link",
        cell: ({ row }) => (
          <span className="text-sm truncate max-w-[160px] block">
            {row.original.linkUrl ?? "-"}
          </span>
        ),
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
    data: banners,
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
          placeholder="Search banners..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="outline" size="sm" onClick={openCreate}>
          Add Banner
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
                  No banners found.
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
            <DialogTitle>{mode === "create" ? "Add Banner" : "Edit Banner"}</DialogTitle>
            <DialogDescription>
              {mode === "create" ? "Fill in the details to create a new banner." : "Update the banner's information below."}
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
              <Label>Link URL</Label>
              <Input
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Image <span className="text-destructive">*</span></Label>
              {preview ? (
                <div className="relative overflow-hidden rounded-lg">
                  <img src={preview} alt="preview" className="w-full aspect-video object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => { setPreview(""); setForm({ ...form, imageUrl: "" }) }}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity text-xs text-white cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <div
                  className="flex items-center justify-center rounded-lg border border-dashed p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-1 text-center">
                    <ImagePlus size={20} className="text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {uploading ? "Uploading..." : "Click to upload image"}
                    </p>
                  </div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {errors.imageUrl && <p className="text-xs text-destructive">{errors.imageUrl}</p>}
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
            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
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