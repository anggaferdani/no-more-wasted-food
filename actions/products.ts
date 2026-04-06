"use server"

import { db } from "@/db"
import { products, productImages, users } from "@/db/schema"
import { eq, isNull, desc, ilike, or } from "drizzle-orm"
import { generateProductCode } from "@/lib/utils/product-code"
import type { ProductImage, User } from "@/db/schema"

export type ProductWithImages = typeof products.$inferSelect & {
  images: ProductImage[]
  user: User | null
}

export async function getProductsAction(search?: string): Promise<ProductWithImages[]> {
  const rows = await db.query.products.findMany({
    where: (p, { and, isNull: isNullFn }) =>
      search
        ? and(isNullFn(p.deletedAt), or(ilike(p.name, `%${search}%`), ilike(p.description ?? "", `%${search}%`)))
        : isNullFn(p.deletedAt),
    orderBy: desc(products.id),
    with: {
      images: { orderBy: (i, { asc }) => asc(i.order) },
      user: true,
    },
  })
  return rows as ProductWithImages[]
}

export async function createProductAction(data: {
  name: string
  description?: string
  imageUrls: string[]
  price: number
  percentage: number
  stock: number
  userId?: number | null
}) {
  const [product] = await db
    .insert(products)
    .values({
      code: generateProductCode(),
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      percentage: data.percentage,
      stock: data.stock,
      userId: data.userId ?? null,
    })
    .returning()

  if (data.imageUrls.length > 0) {
    await db.insert(productImages).values(
      data.imageUrls.map((url, order) => ({ productId: product.id, url, order }))
    )
  }

  return { success: true }
}

export async function updateProductAction(
  id: number,
  data: {
    name: string
    description?: string
    imageUrls: string[]
    price: number
    percentage: number
    stock: number
    userId?: number | null
  }
) {
  await db
    .update(products)
    .set({
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      percentage: data.percentage,
      stock: data.stock,
      userId: data.userId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))

  await db.delete(productImages).where(eq(productImages.productId, id))

  if (data.imageUrls.length > 0) {
    await db.insert(productImages).values(
      data.imageUrls.map((url, order) => ({ productId: id, url, order }))
    )
  }

  return { success: true }
}

export async function softDeleteProductAction(id: number) {
  await db.update(products).set({ deletedAt: new Date() }).where(eq(products.id, id))
  return { success: true }
}