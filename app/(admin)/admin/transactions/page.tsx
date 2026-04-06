import { getTransactionsAction } from "@/actions/transactions"
import TransactionsTable from "@/components/admin/transactions/table"

export default async function TransactionsPage() {
  const transactions = await getTransactionsAction()
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">View all transactions</p>
      </div>
      <TransactionsTable initialTransactions={transactions} />
    </div>
  )
}