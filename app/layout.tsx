import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ikshita & Sahil — Wedding Invitation',
  description: 'When Kasa Kai meets Kem Cho ✨',
  openGraph: {
    title: "Ikshita & Sahil — You're Invited! 💒",
    description: 'When Kasa Kai meets Kem Cho ✨',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Poppins:wght@300;400;600&family=Great+Vibes&display=swap" rel="stylesheet" />
        <link rel="preload" href="/music/jashn-e-bahara.mp3" as="fetch" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
