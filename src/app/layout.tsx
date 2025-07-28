import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Meta-Vaardigheden Leeromgeving',
  description: 'Een AI-gestuurde leeromgeving voor het oefenen van vaardigheden',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl" data-theme="dark">
      <body className="min-h-screen" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  )
} 