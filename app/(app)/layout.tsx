import { SessionProvider } from "next-auth/react"
import AppNavbar from "@/components/app/navbar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-neutral-100 flex justify-center">
        <div className="fixed inset-y-0 w-full max-w-sm bg-white border-x border-neutral-200 flex flex-col overflow-hidden">
          <AppNavbar />
          <main className="flex-1 overflow-y-auto p-4">{children}</main>
        </div>
      </div>
    </SessionProvider>
  )
}