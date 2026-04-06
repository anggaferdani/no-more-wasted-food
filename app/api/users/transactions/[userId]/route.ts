import { NextRequest, NextResponse } from "next/server"
import { getUserTransactionsAction } from "@/actions/transactions"

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const data = await getUserTransactionsAction(Number(userId))
  return NextResponse.json(data)
}