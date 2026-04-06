"use server"

import { db } from "@/db"
import { transactions, products } from "@/db/schema"
import { eq, isNull, desc, ilike, or } from "drizzle-orm"
import { generateTransactionCode } from "@/lib/utils/transaction-code"
import type { User, Product, Transaction } from "@/db/schema"

export type TransactionWithRelations = Transaction & {
  user: User | null
  merchant: User | null
  product: Product | null
}

export async function getTransactionsAction(): Promise<TransactionWithRelations[]> {
  const rows = await db.query.transactions.findMany({
    where: isNull(transactions.deletedAt),
    orderBy: desc(transactions.id),
    with: { user: true, merchant: true, product: true },
  })
  return rows as TransactionWithRelations[]
}

export async function getUserTransactionsAction(userId: number): Promise<TransactionWithRelations[]> {
  const rows = await db.query.transactions.findMany({
    where: (t, { and, isNull: isNullFn, eq: eqFn }) =>
      and(isNullFn(t.deletedAt), eqFn(t.userId, userId)),
    orderBy: desc(transactions.id),
    with: { user: true, merchant: true, product: true },
  })
  return rows as TransactionWithRelations[]
}

export async function getTransactionByIdAction(id: number): Promise<TransactionWithRelations | null> {
  const row = await db.query.transactions.findFirst({
    where: eq(transactions.id, id),
    with: { user: true, merchant: true, product: true },
  })
  return (row as TransactionWithRelations) ?? null
}

export async function createTransactionAction(data: {
  userId?: number | null
  productId: number
  merchantId?: number | null
  originalPrice: number
  percentage: number
  unitPrice: number
  quantity: number
  totalPrice: number
}) {
  const [trx] = await db
    .insert(transactions)
    .values({
      code: generateTransactionCode(),
      userId: data.userId ?? null,
      productId: data.productId,
      merchantId: data.merchantId ?? null,
      originalPrice: data.originalPrice,
      percentage: data.percentage,
      unitPrice: data.unitPrice,
      quantity: data.quantity,
      totalPrice: data.totalPrice,
      status: "paid",
    })
    .returning()

  return { success: true, code: trx.code }
}

export async function updateTransactionStatusAction(id: number, status: "pending" | "paid" | "cancelled") {
  await db.update(transactions).set({ status, updatedAt: new Date() }).where(eq(transactions.id, id))
  return { success: true }
}