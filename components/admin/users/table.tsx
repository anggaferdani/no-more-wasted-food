"use client"

import { useState, useMemo } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { MoreHorizontal, Eye, EyeOff, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { createUserAction, updateUserAction, softDeleteUserAction } from "@/actions/users"
import type { User } from "@/db/schema"

type ModalMode = "create" | "edit" | null

interface Props {
  initialUsers: User[]
}

export default function UsersTable({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [globalFilter, setGlobalFilter] = useState("")
  const [mode, setMode] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rolePopoverOpen, setRolePopoverOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    role: "user" as User["role"],
  })

  function openCreate() {
    setForm({ username: "", name: "", email: "", password: "", role: "user" })
    setErrors({})
    setShowPassword(false)
    setMode("create")
  }

  function openEdit(user: User) {
    setSelected(user)
    setForm({ username: user.username ?? "", name: user.name, email: user.email, password: "", role: user.role })
    setErrors({})
    setShowPassword(false)
    setMode("edit")
  }

  function closeModal() {
    setMode(null)
    setSelected(null)
    setErrors({})
    setShowPassword(false)
    setRolePopoverOpen(false)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.username.trim()) {
      e.username = "Username is required"
    } else if (!/^[a-z0-9_]+$/.test(form.username)) {
      e.username = "Only lowercase letters, numbers, and underscores"
    }
    if (!form.name.trim()) e.name = "Name is required"
    if (!form.email.trim()) {
      e.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Enter a valid email address"
    }
    if (mode === "create") {
      if (!form.password) {
        e.password = "Password is required"
      } else if (form.password.length < 8) {
        e.password = "Password must be at least 8 characters"
      } else if (!/[A-Z]/.test(form.password)) {
        e.password = "Must contain at least 1 uppercase letter"
      } else if (!/[0-9]/.test(form.password)) {
        e.password = "Must contain at least 1 number"
      } else if (!/[^a-zA-Z0-9]/.test(form.password)) {
        e.password = "Must contain at least 1 symbol"
      }
    } else if (mode === "edit" && form.password) {
      if (form.password.length < 8) {
        e.password = "Password must be at least 8 characters"
      } else if (!/[A-Z]/.test(form.password)) {
        e.password = "Must contain at least 1 uppercase letter"
      } else if (!/[0-9]/.test(form.password)) {
        e.password = "Must contain at least 1 number"
      } else if (!/[^a-zA-Z0-9]/.test(form.password)) {
        e.password = "Must contain at least 1 symbol"
      }
    }
    if (!form.role) e.role = "Role is required"
    return e
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
        await createUserAction(form as any)
        toast.success("New user has been created successfully")
        const refreshed = await fetch("/api/users").then((r) => r.json()).catch(() => null)
        if (refreshed) setUsers(refreshed)
      } else if (mode === "edit" && selected) {
        await updateUserAction(selected.id, {
          username: form.username,
          name: form.name,
          email: form.email,
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
        })
        toast.success("User information has been updated successfully")
        const refreshed = await fetch("/api/users").then((r) => r.json()).catch(() => null)
        if (refreshed) setUsers(refreshed)
      }
      closeModal()
    } catch {
      toast.error("Something went wrong, please try again")
    }
    setLoading(false)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await softDeleteUserAction(deleteTarget.id)
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id))
    toast.success("User has been permanently removed from the system")
    setDeleteTarget(null)
  }

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "username",
        header: "Username",
        cell: ({ row }) => <span className="text-sm">{row.original.username ?? "-"}</span>,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => <span className="text-sm">{row.original.email}</span>,
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs capitalize">
            {row.original.role}
          </Badge>
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
    data: users,
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
          placeholder="Search users..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="outline" size="sm" onClick={openCreate}>
          Add User
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
                  No users found.
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
            <DialogTitle>{mode === "create" ? "Add User" : "Edit User"}</DialogTitle>
            <DialogDescription>
              {mode === "create" ? "Fill in the details to create a new user." : "Update the user's information below."}
            </DialogDescription>
          </DialogHeader>
          <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Username <span className="text-destructive">*</span></Label>
              <Input
                value={form.username}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-z0-9_]/g, "")
                  setForm({ ...form, username: val })
                  setErrors({ ...errors, username: "" })
                }}
                placeholder="e.g. user123"
              />
              {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
            </div>
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
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value })
                  setErrors({ ...errors, email: "" })
                }}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Password{mode === "create" && <span className="text-destructive"> *</span>}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 chars, 1 uppercase, 1 number, 1 symbol"
                  value={form.password}
                  className="pr-9"
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value })
                    setErrors({ ...errors, password: "" })
                  }}
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Role <span className="text-destructive">*</span></Label>
              <Popover open={rolePopoverOpen} onOpenChange={setRolePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    {form.role ? form.role.charAt(0).toUpperCase() + form.role.slice(1) : "Select role..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search role..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No role found.</CommandEmpty>
                      <CommandGroup>
                        {["user", "merchant", "admin"].map((r) => (
                          <CommandItem
                            key={r}
                            value={r}
                            onSelect={() => {
                              setForm({ ...form, role: r as User["role"] })
                              setErrors({ ...errors, role: "" })
                              setRolePopoverOpen(false)
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", form.role === r ? "opacity-100" : "opacity-0")} />
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
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