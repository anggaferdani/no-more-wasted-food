"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Search, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TransactionWithRelations } from "@/actions/transactions"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-600 border-yellow-200",
  paid: "bg-green-50 text-green-600 border-green-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
}

const PAGE_SIZE = 10

export default function TransactionsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [all, setAll] = useState<TransactionWithRelations[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return
    const userId = Number(session.user.id)
    if (isNaN(userId)) return
    fetch(`/api/users/transactions/${userId}`)
      .then((r) => r.json())
      .then((data) => { setAll(Array.isArray(data) ? data : []); setLoading(false) })
  }, [session])

  const filtered = all.filter((t) =>
    t.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.code?.includes(search)
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    setPage(1)
  }

  if (loading) return <div className="py-10 text-center text-sm text-neutral-400">Loading...</div>

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-neutral-900">My Transactions</h1>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <Input
          className="pl-8 text-sm"
          placeholder="Search transactions..."
          value={search}
          onChange={handleSearch}
        />
      </div>

      {paginated.length === 0 && !loading ? (
        <div className="py-10 text-center text-sm text-neutral-400">No transactions found.</div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {paginated.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-3">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {t.product?.name ?? "—"}
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">{t.code}</p>
                <p className="text-xs text-neutral-400">
                  {new Date(t.createdAt).toLocaleDateString("id-ID")} · {t.quantity} item · Rp {t.totalPrice.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={`text-xs capitalize ${statusColors[t.status]}`}>
                  {t.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/transactions/${t.code}`)}>
                      Detail
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
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
    </div>
  )
}