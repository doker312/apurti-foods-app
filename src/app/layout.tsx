import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Apurti Foods — Fresh Millets Delivered Fast',
  description: 'India\'s fastest millet-based food delivery. Shop organic snacks, flour, and ready-to-eat millet products. Delivered in minutes.',
  keywords: ['millet food', 'organic snacks', 'quick delivery', 'millet flour', 'healthy food India'],
  openGraph: {
    title: 'Apurti Foods — Fresh Millets Delivered Fast',
    description: 'Shop organic millet products delivered to your door.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
