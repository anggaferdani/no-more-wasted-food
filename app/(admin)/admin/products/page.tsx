import { getProductsAction } from "@/actions/products"
import ProductsTable from "@/components/admin/products/table"

export default async function ProductsPage() {
  const products = await getProductsAction()
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Products</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Manage all products</p>
      </div>
      <ProductsTable initialProducts={products} />
    </div>
  )
}