import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { GeistPixelGrid } from 'geist/font/pixel'
import { ThemeProvider } from '@/components/theme-provider'

import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'SO.LAB | seL4, VxWorks e Inferno en simulaciones',
    template: '%s | SO.LAB',
  },
  description:
    'Laboratorio interactivo del Trabajo Práctico Especial de Sistemas Operativos: simulaciones de las funcionalidades que distinguen a seL4, VxWorks e Inferno frente a los sistemas operativos convencionales.',
  keywords: ['seL4', 'VxWorks', 'Inferno', 'sistemas operativos', 'microkernel', 'RTOS', 'Plan 9', '9P', 'simulación'],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    title: 'SO.LAB | seL4, VxWorks e Inferno en simulaciones',
    description:
      'Probá en el navegador lo que hace distintos a seL4, VxWorks e Inferno: aislamiento por capacidades, inversión de prioridades, sistemas de archivos transaccionales y namespaces distribuidos.',
    siteName: 'SO.LAB',
  },
  category: 'technology',
}

export const viewport: Viewport = {
  themeColor: '#F2F1EA',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${jetbrainsMono.variable} ${GeistPixelGrid.variable}`} suppressHydrationWarning>
      <body className="font-mono antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
