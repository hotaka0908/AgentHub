import Link from 'next/link'
import { Bot } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Bot className="h-6 w-6" />
          <p className="text-center text-sm leading-loose md:text-left">
            &copy; 2024 AgentHub. All rights reserved.
          </p>
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:underline">
            利用規約
          </Link>
          <Link href="/privacy" className="hover:underline">
            プライバシーポリシー
          </Link>
          <Link href="/contact" className="hover:underline">
            お問い合わせ
          </Link>
        </div>
      </div>
    </footer>
  )
}
