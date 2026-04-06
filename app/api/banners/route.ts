import { NextResponse } from "next/server"
import { getBannersAction } from "@/actions/banners"

export async function GET() {
  const data = await getBannersAction()
  return NextResponse.json(data)
}