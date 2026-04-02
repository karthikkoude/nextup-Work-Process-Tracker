import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'NestUp — Work Process Tracker',
  description: 'Manage tasks with dependency chains. Admins create and assign, members update progress.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-surface-50 text-surface-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
