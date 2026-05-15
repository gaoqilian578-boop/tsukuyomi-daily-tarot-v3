# 月読｜今日のタロット

ログイン制の毎日タロット占いサイトです。ユーザーが1日1回だけカードを引き、登録時に入力した「今の状況」とカード象徴を組み合わせて、今の流れと次の一手を整理します。

## セットアップ

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

## Supabase

`.env.example` をコピーして `.env` を作成します。

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Supabaseキー未設定時は `localStorage` で仮保存します。

## Vercel

- Framework Preset: Vite
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

## 占い体験

1. 今夜のカードを引く
2. シャッフル演出
3. 裏面カード3枚表示
4. 1枚選択
5. カードめくり
6. 結果表示
