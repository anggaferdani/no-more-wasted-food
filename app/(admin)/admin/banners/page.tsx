import { getBannersAction } from "@/actions/banners"
import BannersTable from "@/components/admin/banners/table"

export default async function BannersPage() {
  const banners = await getBannersAction()
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Banners</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Manage all banners</p>
      </div>
      <BannersTable initialBanners={banners} />
    </div>
  )
}