import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

function generateFilename(ext: string): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  const name = Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return `${name}.${ext}`
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const files = formData.getAll("files") as File[]

  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 })

  const uploadDir = join(process.cwd(), "public", "uploads", "products")
  if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true })

  const urls: string[] = []

  for (const file of files) {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split(".").pop() ?? "jpg"
    const filename = generateFilename(ext)
    await writeFile(join(uploadDir, filename), buffer)
    urls.push(`/uploads/products/${filename}`)
  }

  return NextResponse.json({ urls })
}