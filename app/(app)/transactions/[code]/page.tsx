"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { TransactionWithRelations } from "@/actions/transactions"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-600 border-yellow-200",
  paid: "bg-green-50 text-green-600 border-green-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
}

export default function TransactionDetailPage() {
  const { code } = useParams()
  const router = useRouter()
  const [transaction, setTransaction] = useState<TransactionWithRelations | null>(null)

  useEffect(() => {
    fetch(`/api/transactions/${code}`)
      .then((r) => r.json())
      .then(setTransaction)
  }, [code])

  if (!transaction) return (
    <div className="py-10 text-center text-sm text-neutral-400">Loading...</div>
  )

  return (
    <div className="pb-28 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Transaction Detail</h1>
          <p className="text-xs text-neutral-400 mt-0.5">{transaction.code}</p>
        </div>
        <Badge variant="outline" className={`text-xs capitalize ${statusColors[transaction.status]}`}>
          {transaction.status}
        </Badge>
      </div>

      {transaction.status === "paid" && (
        <div className="flex flex-col items-center justify-center py-4 gap-2">
          <CheckCircle2 size={40} className="text-green-500" />
          <p className="text-sm font-medium text-neutral-900">Payment Successful</p>
          <p className="text-xs text-neutral-400">Thank you for your purchase</p>
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 p-4 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-500">Product</span>
          <span className="font-medium">{transaction.product?.name ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Merchant</span>
          <span>{transaction.merchant?.name ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Original Price</span>
          <span>Rp {(transaction.originalPrice ?? 0).toLocaleString("id-ID")}</span>
        </div>
        {(transaction.percentage ?? 0) > 0 && (
          <div className="flex justify-between">
            <span className="text-neutral-500">Discount</span>
            <span className="text-green-600">{transaction.percentage}%</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-neutral-500">Unit Price</span>
          <span>Rp {(transaction.unitPrice ?? 0).toLocaleString("id-ID")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Quantity</span>
          <span>{transaction.quantity ?? 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Date</span>
          <span>{transaction.createdAt ? new Date(transaction.createdAt).toLocaleString("id-ID") : "—"}</span>
        </div>
        <div className="border-t border-neutral-100 pt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span>Rp {(transaction.totalPrice ?? 0).toLocaleString("id-ID")}</span>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm border-t border-neutral-100 bg-white p-4">
        <Button variant="outline" className="w-full" onClick={() => router.push("/transactions")}>
          Back to Transactions
        </Button>
      </div>
    </div>
  )
}