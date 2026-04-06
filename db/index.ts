import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"
import { relations } from "drizzle-orm"
import { products, productImages, users, transactions } from "./schema"

export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  transactions: many(transactions, { relationName: "userTransactions" }),
  merchantTransactions: many(transactions, { relationName: "merchantTransactions" }),
}))

export const productsRelations = relations(products, ({ many, one }) => ({
  images: many(productImages),
  user: one(users, { fields: [products.userId], references: [users.id] }),
  transactions: many(transactions),
}))

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id], relationName: "userTransactions" }),
  merchant: one(users, { fields: [transactions.merchantId], references: [users.id], relationName: "merchantTransactions" }),
  product: one(products, { fields: [transactions.productId], references: [products.id] }),
}))

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })

export const db = drizzle(pool, {
  schema: {
    ...schema,
    usersRelations,
    productsRelations,
    productImagesRelations,
    transactionsRelations,
  },
})