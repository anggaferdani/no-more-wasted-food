"use server"

import { db } from "@/db"
import { banners } from "@/db/schema"
import { eq, isNull, desc } from "drizzle-orm"

export async function getBannersAction() {
  return db.select().from(banners).where(isNull(banners.deletedAt)).orderBy(desc(banners.id))
}

export async function createBannerAction(data: {
  name: string
  imageUrl: string
  linkUrl?: string
}) {
  await db.insert(banners).values({
    name: data.name,
    imageUrl: data.imageUrl,
    linkUrl: data.linkUrl ?? null,
  })
  return { success: true }
}

export async function updateBannerAction(
  id: number,
  data: { name: string; imageUrl: string; linkUrl?: string }
) {
  await db
    .update(banners)
    .set({ name: data.name, imageUrl: data.imageUrl, linkUrl: data.linkUrl ?? null, updatedAt: new Date() })
    .where(eq(banners.id, id))
  return { success: true }
}

export async function softDeleteBannerAction(id: number) {
  await db.update(banners).set({ deletedAt: new Date() }).where(eq(banners.id, id))
  return { success: true }
}