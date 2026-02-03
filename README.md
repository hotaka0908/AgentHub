# AgentHub - AIエージェントマーケットプレイス

AIエージェントを探して課金して即使えるプラットフォーム。保険、不動産、旅行計画、遺産相続、法律、税務などの専門分野をカバー。

## デモ

🚀 **[Live Demo](https://agent-hub.vercel.app)** (デプロイ後のURL)

## 機能

- 🤖 **6種類の専門AIエージェント** - 保険、不動産、旅行、相続、法律、税務
- 💬 **リアルタイムチャット** - OpenAI GPT-4によるストリーミング応答
- 🔐 **認証機能** - メール/パスワード、Google OAuth対応
- 💳 **従量課金** - Stripe連携による使った分だけ課金
- 📊 **ダッシュボード** - 利用履歴・請求管理

## 技術スタック

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Payment**: Stripe
- **UI**: Tailwind CSS + shadcn/ui
- **AI**: OpenAI API (GPT-4 Turbo)

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/hotaka0908/AgentHub.git
cd AgentHub
npm install
```

### 2. Supabaseプロジェクトを作成

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. SQLエディタで以下のマイグレーションを実行:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_agents.sql`
3. Authentication > Providers でGoogle OAuthを設定(オプション)

### 3. 環境変数を設定

```bash
cp .env.local.example .env.local
```

`.env.local`を編集:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. 開発サーバーを起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

## デプロイ (Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhotaka0908%2FAgentHub&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,OPENAI_API_KEY,STRIPE_SECRET_KEY,NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,STRIPE_WEBHOOK_SECRET&project-name=agenthub&repository-name=agenthub)

1. 上のボタンをクリック
2. GitHubと連携
3. 環境変数を設定
4. デプロイ!

## プロジェクト構造

```
src/
├── app/
│   ├── page.tsx                    # ホームページ
│   ├── layout.tsx                  # 共通レイアウト
│   ├── agents/
│   │   ├── page.tsx                # エージェント一覧
│   │   └── [id]/
│   │       ├── page.tsx            # エージェント詳細
│   │       └── chat/page.tsx       # チャット画面
│   ├── auth/
│   │   ├── login/page.tsx          # ログイン
│   │   └── signup/page.tsx         # サインアップ
│   ├── dashboard/
│   │   ├── page.tsx                # ダッシュボード
│   │   └── usage/page.tsx          # 利用履歴
│   └── api/
│       ├── agents/route.ts         # エージェントAPI
│       ├── chat/route.ts           # チャットAPI
│       ├── usage/route.ts          # 利用量API
│       └── webhooks/stripe/route.ts
├── components/
│   ├── ui/                         # shadcn/ui
│   ├── agents/                     # エージェント関連
│   ├── chat/                       # チャット関連
│   └── layout/                     # レイアウト
├── lib/
│   ├── supabase.ts                 # Supabaseクライアント
│   ├── stripe.ts                   # Stripeクライアント
│   └── ai.ts                       # AI API
└── types/
    └── index.ts                    # 型定義
```

## ライセンス

MIT
