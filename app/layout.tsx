import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Toaster } from "sonner"
import { CheckCircle2, XCircle } from "lucide-react"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = { title: "No More Wasted Food" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        {children}
        <Toaster position="top-center" icons={{
          success: <CheckCircle2 size={16} />,
          error: <XCircle size={16} />,
        }} />
      </body>
    </html>
  )
}