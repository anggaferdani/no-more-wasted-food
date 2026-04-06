"use server"

import { db } from "@/db"
import { users } from "@/db/schema"
import { eq, isNull, desc } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { generateUsername } from "@/lib/utils/username"

export async function getUsersAction() {
  return db.select().from(users).where(isNull(users.deletedAt)).orderBy(desc(users.id))
}

export async function createUserAction(data: {
  username?: string
  name: string
  email: string
  password: string
  role: "admin" | "merchant" | "user"
}) {
  const hashed = await bcrypt.hash(data.password, 10)
  await db.insert(users).values({
    name: data.name,
    email: data.email,
    password: hashed,
    username: data.username || generateUsername(),
    role: data.role,
  })
  return { success: true }
}

export async function updateUserAction(
  id: number,
  data: { username?: string; name: string; email: string; role: "admin" | "merchant" | "user"; password?: string }
) {
  const payload: Record<string, unknown> = {
    name: data.name,
    email: data.email,
    role: data.role,
    username: data.username || undefined,
    updatedAt: new Date(),
  }
  if (data.password) payload.password = await bcrypt.hash(data.password, 10)
  await db.update(users).set(payload).where(eq(users.id, id))
  return { success: true }
}

export async function softDeleteUserAction(id: number) {
  await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, id))
  return { success: true }
}