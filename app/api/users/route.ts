import { NextResponse } from "next/server"
import { getUsersAction } from "@/actions/users"

export async function GET() {
  const data = await getUsersAction()
  return NextResponse.json(data)
}