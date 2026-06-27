import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Antigravity | AI Operating System for Architectural Scene Understanding',
  description: 'Convert architectural renders into interactive Digital Scene Graphs with AI orchestration.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090a0f] text-slate-100 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  )
}
