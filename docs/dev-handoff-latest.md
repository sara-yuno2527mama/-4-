# AIキッチン秘書 — 開発引き継ぎ（最新）

**更新日**: 2026-09-10  
**用途**: 新しい開発チャットに貼る／`@docs/dev-handoff-latest.md`  
**詳細仕様の正本**: [`consultation-handoff.md`](./consultation-handoff.md)（2026-09-07）。矛盾時は **リポジトリの実装を優先**。

**役割**: 相談＝設計のみ／開発＝合意済みの実装のみ。大きな方針変更は相談へ。

---

## 開発チャットに貼る一文

```
@docs/dev-handoff-latest.md と @docs/consultation-handoff.md を正とします。実装のみお願いします。
本番: https://ai-kitchen-secretary.vercel.app
下タブ正: ホーム／献立／今ある／追加／設定
パス表示の正: 「実家ごはん（作らない）」（内部 pass）
調達の表示の正: 「買って帰る」（内部 procure）

大きな設計変更だけ相談チャットへ。
リポジトリは未コミット多数あり。指示があるまで commit/push しない。
```

---

## URL

| もの | URL |
|------|-----|
| 本番アプリ | https://ai-kitchen-secretary.vercel.app |
| 企画図解（提出用・4欄入り） | https://diagram-ai-kitchen-secretary.surge.sh |
| UIモック（8/28・タブ名古い） | https://diagram-ai-kitchen-ui-mock.surge.sh |
| 進捗図解 | https://diagram-ai-kitchen-progress.surge.sh（提出の主役にしない） |
| リポジトリ | `c:\Users\o9o15\src\ai-kitchen-secretary` |

---

## スタック・運用

- Next.js 16 / React 19 / Tailwind / TypeScript
- 状態: `localStorage` + `/api/state`（`data/kitchen.json`）
- デプロイ: Vercel（デバイス認可失敗時はトークン。`.cursor/rules/vercel-token-fallback.mdc`）
- **git: まだコミットなし**（未追跡・未ステージが多い）

---

## 下タブ（確定・実装済み）

**ホーム／献立／今ある／追加／設定**  
ルート: `/` `/meals` `/inventory` `/bought` `/settings`

---

## いま動いていること

- **ホーム**: 日付前後切替、家族写真、朝夕、「これにする」／編集／レシピ検索、おすすめ、食べ忘れ、レシピ写真読取、オイシックス、忘れないメモ
- **献立**: 14日・よく作る・パス日・デザート・編集（家で作る／外食／買って帰る）
- **今ある**: 一覧・期限・「使い切った」（`usedUpAt`）
- **追加**: 写真／名前／音声・オイシックス取込
- **設定**: 家族写真・家庭・LINE・オイシックス・朝の定番など
- **レシピ庫** `/recipes`: 写真読取・表紙・ジャンル

---

## 献立の共通ルール（表示はコード正）

| 概念 | 表示（現行） | 備考 |
|------|--------------|------|
| パス | **実家ごはん（作らない）** | 内部 `pass`。旧称「実家（パス）」 |
| 本線 | **家で作る** | 提案あり |
| 例外 | **外食**／**買って帰る** | `procure` の表示名。定番店・記録可 |
| 土日夕初期 | パス（実家ごはん） | 空・未設定・デザートで潰さない |
| パス選択 | どの日の朝夕でも可 | 人が「家」や編集した枠は上書きしない |
| 土日朝定番 | 卵サンド／パン／ごはん | `rice` あり |

特別説明文（「土日の夕（家のときだけ提案）」等）は出さない。

---

## UI方針（要約）

- 色: Oisix寄せ・主に `#1B6B32`
- 選択: `BoxedChoiceRow` 系の白抜き分割
- ホーム朝夕: 名前は切らない。パス日は表示のみ（ボタンなし）
- タップ高さ `min-h-11`、本文 `text-base` 下限
- 詳細・打ち消し履歴は `consultation-handoff.md`

---

## 既知の注意

- OpenAI Vision: quota／429 がありうる → サンプル読取フォールバック
- デモ初期データが土日に通常メニュー／デザートを載せるとパス表示を潰す → `scrubDemoWeekendMeals` 等（再発に注意）
- `consultation-handoff.md` 冒頭の古い「貼る一文」はタブ名が在庫／今買ったのまま → **正は今ある／追加**（本ファイルを優先）

---

## 提出（参考）

- 完成した体で書く（デモ・進捗アピールしない）
- 図解に提出4欄（作ったもの／面倒／理由／工夫・苦戦）を入れ込み済み  
  https://diagram-ai-kitchen-secretary.surge.sh
