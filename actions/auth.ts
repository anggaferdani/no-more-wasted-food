"use server"

import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { signIn } from "@/lib/auth"
import { generateUsername } from "@/lib/utils/username"
import { AuthError } from "next-auth"

export async function registerAction(data: {
  name: string
  email: string
  password: string
}) {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1)

  if (existing) return { error: "Email already registered" }

  const hashed = await bcrypt.hash(data.password, 10)

  await db.insert(users).values({
    name: data.name,
    email: data.email,
    password: hashed,
    username: generateUsername(),
    role: "user",
  })

  return { success: true }
}

export async function loginAction(data: {
  email: string
  password: string
}) {
  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    return { success: true }
  } catch (e) {
    if (e instanceof AuthError) return { error: "Invalid credentials" }
    return { error: "Something went wrong" }
  }
}