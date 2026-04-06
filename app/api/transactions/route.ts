import { NextResponse } from "next/server"
import { getTransactionsAction } from "@/actions/transactions"

export async function GET() {
  const data = await getTransactionsAction()
  return NextResponse.json(data)
}