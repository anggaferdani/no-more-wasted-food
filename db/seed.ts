import { config } from "dotenv"
config({ path: ".env.local" })

import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"
import { users } from "./schema"
import bcrypt from "bcryptjs"

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const db = drizzle(pool, { schema })

async function seed() {
  console.log("Seeding...")

  await db.delete(users)

  const password = await bcrypt.hash("password", 10)

  await db.insert(users).values([
    {
      name: "Admin",
      email: "admin@example.com",
      password: password,
      username: "admin",
      role: "admin",
    },
    {
      name: "Merchant",
      email: "merchant@example.com",
      password: password,
      username: "merchant",
      role: "merchant",
    },
    {
      name: "User",
      email: "user@example.com",
      password: password,
      username: "user",
      role: "user",
    },
  ])

  await pool.end()
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})