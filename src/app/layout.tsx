import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AgentHub - AIエージェントマーケットプレイス',
  description: 'AIエージェントを探して課金して即使えるプラットフォーム',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className="relative flex min-h-screen flex-col">
          <Header user={user} />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
