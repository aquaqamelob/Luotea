import '@/styles/tailwind.css'
import type { Metadata } from 'next'
import { Nunito_Sans } from 'next/font/google'

const nunito = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s - Luotea Prioritizer',
    default: 'Luotea Prioritizer',
  },
  description: 'Prioritization engine for facility maintenance',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${nunito.className} antialiased`}>
      <body className="text-brand-text">{children}</body>
    </html>
  )
}
