import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" })

export const metadata: Metadata = {
    title: "Nextis E-com Dashboard",
    description: "Advanced E-commerce Dashboard",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body className={`${geist.className} ${spaceGrotesk.variable} antialiased`}>
                {children}
                <Toaster position="top-center" richColors />
            </body>
        </html>
    )
}
