export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>
      <p className="mt-1 text-sm text-neutral-500">Overview placeholder</p>
      <div className="mt-6 grid grid-cols-3 gap-4">
        {["Total Users", "Merchants", "Active Listings"].map((label) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-white p-5">
            <p className="text-xs text-neutral-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-neutral-900">-</p>
          </div>
        ))}
      </div>
    </div>
  )
}