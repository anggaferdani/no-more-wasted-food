import { NextRequest, NextResponse } from "next/server"
import { getProductsAction } from "@/actions/products"

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search") ?? undefined
  const data = await getProductsAction(search)
  return NextResponse.json(data)
}