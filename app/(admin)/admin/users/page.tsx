import { getUsersAction } from "@/actions/users"
import UsersTable from "@/components/admin/users/table"

export default async function UsersPage() {
  const users = await getUsersAction()
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-900">Users</h1>
        <p className="mt-0.5 text-sm text-neutral-500">Manage all registered users</p>
      </div>
      <UsersTable initialUsers={users} />
    </div>
  )
}