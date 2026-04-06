import { pgTable, text, timestamp, pgEnum, serial, integer, numeric } from "drizzle-orm/pg-core"

export const roleEnum = pgEnum("role", ["admin", "merchant", "user"])

export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "paid", "cancelled"])

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username"),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  role: roleEnum("role").notNull().default("user"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  percentage: integer("percentage").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  merchantId: integer("merchant_id").references(() => users.id, { onDelete: "set null" }),
  unitPrice: integer("unit_price").notNull(),
  originalPrice: integer("original_price").notNull(),
  percentage: integer("percentage").notNull().default(0),
  quantity: integer("quantity").notNull(),
  totalPrice: integer("total_price").notNull(),
  status: transactionStatusEnum("status").notNull().default("pending"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type ProductImage = typeof productImages.$inferSelect
export type Banner = typeof banners.$inferSelect
export type NewBanner = typeof banners.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert