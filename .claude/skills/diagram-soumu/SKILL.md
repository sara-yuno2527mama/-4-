---
name: diagram-soumu
description: 総務部・事務職の業務状況を上司が30秒で把握できる図解HTMLを生成してsurge.shに公開するスキル。「図解して」「業務を図解して」「ETCの改善を図解して」「みらいプロジェクトの状況を図解して」「業務改善の成果を図解して」と依頼された際に使用する。
---

# 総務図解スキル

業務状況・改善成果・問題の深刻さを、**上司が30秒で把握できる**図解HTMLを生成する。

## 依存

- `.claude/skills/creating-visual-explainers/references/base.html` — HTML額縁テンプレート
- `.claude/skills/creating-visual-explainers/references/model-answer.html` — デザイン品質の基準
- `references/context.md` — ユーザー・読者プロフィール、成功基準
- `references/scenario-patterns.md` — シナリオ別HTMLパターン
- `references/exemplar.md` — 成功する図解の構造

---

## ワークフロー

### Step 0: コンテキスト読み込み

`references/context.md` を読み、以下を把握する:
- ユーザーの担当業務と背景
- 読者（上司）が知っていること・知らないこと
- 図解の成功基準

### Step 1: シナリオ分類

依頼内容を以下のいずれかに分類する:

| シナリオ | 判断基準 | 使用パターン |
|---------|---------|-------------|
| A: 業務改善の成果報告 | 「改善した」「速くなった」「システムを導入した」 | 改善前→改善後の比較＋数値カード |
| B: 現状のカオス可視化 | 「カオス」「ばらばら」「整理されていない」「現状を伝えたい」 | 登場人物・ツール・問題が絡む現状図 |
| C: 問題の深刻さを伝える | 「重大さ」「影響」「怠慢による」「危機感を伝えたい」 | 影響の連鎖図・被害の可視化 |
| D: 業務フロー説明 | 「手順」「流れ」「どうやって」「プロセス」 | ステップフロー＋ツール名 |

複数に該当する場合は組み合わせる。

**詳細パターン** → [references/scenario-patterns.md](references/scenario-patterns.md)

### Step 2: 模範解答・テンプレートの読み込み

1. `.claude/skills/creating-visual-explainers/references/model-answer.html` を読み、デザイン品質の基準を把握する
2. `.claude/skills/creating-visual-explainers/references/base.html` を読み、額縁構造を把握する（`<!-- CONTENT_START/END -->` の位置）

### Step 3: コンテンツ生成

Step 1のシナリオと Step 2のテンプレートをもとにHTMLを生成する。

**生成時の必須ルール**（詳細は `references/context.md`）:

- **30秒ルール**: 冒頭に一枚絵サマリーで全体像を凝縮する
- **背景を省かない**: 上司はツール名・システム名の詳細を知らない。初出で簡潔に補足する
- **数字で語る**: 「早くなった」→「処理時間が○分→○分」のように定量化する
- **なぜの文脈を色で出す**: 「なぜ問題か」「なぜ改善が必要か」を赤・緑・アンバーで視覚化する

### Step 4: ファイル作成

1. `output/` がなければ作成する
2. スラッグを決める（例: `etc-improvement`, `miraipj-chaos`）
3. `base.html` を `output/{スラッグ}.html` にコピーする
4. プレースホルダーをすべて置換する:
   - `<!-- TITLE -->` → 図解のタイトル
   - `<!-- DESCRIPTION -->` → 内容を要約した1文
   - `<!-- CONTENT_START -->` 〜 `<!-- CONTENT_END -->` → 生成したコンテンツ

### Step 5: 公開

Node.js の有無を確認:
```powershell
node --version
```

あれば実行:
```powershell
npx --yes surge output/{スラッグ}.html --domain diagram-{スラッグ}.surge.sh
```

Node.js がなければ `.claude/skills/creating-visual-explainers/references/node-install-guide.md` の手順を案内する。

### Step 6: 完了報告

```
完成・公開完了: 【図解のタイトル】

（内容を1〜2文で要約）

公開URL:
https://diagram-{スラッグ}.surge.sh

図解の主なポイント:
- ...

この図解を削除したいとき:
チャット欄で「この図解を削除して」と伝えてください。
```

---

## 品質チェックリスト

### 内容
- [ ] 冒頭に一枚絵サマリーがある（30秒で全体像が掴める）
- [ ] ツール名・システム名の初出説明がある
- [ ] 数値が入っている（定性表現は定量化する）
- [ ] 「なぜ問題か」「なぜ改善か」が色・ラベルで視覚化されている

### デザイン
- [ ] Lucide icon を使用（絵文字禁止）
- [ ] ADS配色（base.html のTailwind設定）が適用されている
- [ ] スマホでも読みやすい（レスポンシブ）
- [ ] `<style>` タグ・`<script>` タグを追加していない

## 模範構造

→ [references/exemplar.md](references/exemplar.md)
