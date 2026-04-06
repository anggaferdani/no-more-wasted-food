"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function AppNavbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  const guestItems = [
    { href: "/login", label: "Login" },
    { href: "/register", label: "Register" },
  ]

  const userItems = [
    { href: "/profile", label: "Profile" },
    { href: "/transactions", label: "Transaction" },
    { href: "/settings", label: "Setting" },
  ]

  const merchantItems = [
    { href: "/profile", label: "Profile" },
    { href: "/settings", label: "Setting" },
  ]

  const authItems = session?.user?.role === "merchant" ? merchantItems : userItems

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    ...(session ? authItems : guestItems),
  ]

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold text-neutral-900">
          No More Wasted Food
        </Link>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen((v) => !v)}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </Button>
      </div>
      {open && (
        <nav className="border-t bg-white px-4 py-2">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center py-2.5 text-sm",
                pathname === href ? "font-medium text-neutral-900" : "text-neutral-500"
              )}
            >
              {label}
            </Link>
          ))}
          {session && (
            <button
              onClick={() => { signOut({ callbackUrl: "/login" }); setOpen(false) }}
              className="flex w-full items-center py-2.5 text-sm text-neutral-500"
            >
              Sign out
            </button>
          )}
        </nav>
      )}
    </header>
  )
}