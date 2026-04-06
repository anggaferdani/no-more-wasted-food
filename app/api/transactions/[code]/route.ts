import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { transactions } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const row = await db.query.transactions.findFirst({
    where: eq(transactions.code, code),
    with: { user: true, merchant: true, product: true },
  })
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(row)
}