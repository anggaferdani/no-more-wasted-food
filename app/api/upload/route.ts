import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateFilename(ext: string): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  const name = Array.from({ length: 16 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("")
  return `${name}.${ext}`
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll("files") as File[]

    if (!files.length) {
      return NextResponse.json({ error: "No files" }, { status: 400 })
    }

    const urls: string[] = []

    for (const file of files) {
      const ext = file.name.split(".").pop() ?? "jpg"
      const filename = generateFilename(ext)

      const { error } = await supabase.storage
        .from("products")
        .upload(filename, file)

      if (error) {
        console.error(error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const { data } = supabase.storage
        .from("products")
        .getPublicUrl(filename)

      urls.push(data.publicUrl)
    }

    return NextResponse.json({ urls })
  } catch (err) {
    console.error("UPLOAD ERROR:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}