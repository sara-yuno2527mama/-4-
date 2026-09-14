# 成功する図解の構造

## ページ全体の構成（共通）

```
1. ヒーローセクション
   └─ バッジ（カテゴリ: 業務改善 / 総務 / 地域貢献など）
   └─ タイトル（「何の図解か」を一言で）
   └─ サブタイトル（状況を1文で先出し）

2. 一枚絵サマリー
   └─ 「ひとことで言えば──」の一文（太字）
   └─ 全体を示すコア図（数値カード or 比較カード or 連鎖図）
   └─ 「ここからひとつずつ解説します」の橋渡し

3. 詳細セクション（シナリオに応じて1〜3個）
   └─ セクションヘッダー（アイコン＋タイトル）
   └─ シナリオ別パターン（A/B/C/D）を使用

4. まとめカード
   └─ 「この図解で伝えたかったこと」を箇条書き3点
   └─ 次のアクション（あれば）
```

---

## 成功するヒーローセクション

```html
<!-- バッジ -->
<div class="flex items-center gap-2 mb-4">
  <span class="text-xs font-medium px-3 py-1 bg-ads-accent/10 text-ads-accent rounded-full">業務改善</span>
</div>

<!-- タイトル -->
<h1 class="text-3xl md:text-4xl font-black text-ads-text leading-tight mb-3">
  ETC管理システム導入の成果報告
</h1>

<!-- サブタイトル（結論を先出し） -->
<p class="text-lg text-ads-muted mb-8">
  手作業による月45分の処理が、システム導入で<strong class="text-ads-positive">5分に短縮</strong>されました。
</p>
```

---

## 成功する一枚絵サマリー

```html
<div class="bg-ads-surface rounded-2xl border border-ads-border p-6 mb-8">
  <!-- 一言の答え -->
  <p class="text-base font-bold text-ads-text mb-4 pb-4 border-b border-ads-border">
    ひとことで言えば──<br>
    <span class="text-xl">「手作業→自動化」で、担当者の月間作業時間を<span class="text-ads-positive">約89%削減</span>しました。</span>
  </p>

  <!-- 数値カードなどのコア図（scenario-patterns.md のパターンAを使う） -->
  <!-- ここに数値カードを挿入 -->

  <!-- 橋渡し -->
  <p class="text-sm text-ads-muted mt-4 pt-4 border-t border-ads-border">
    ここからひとつずつ、改善内容と効果を解説します。
  </p>
</div>
```

---

## 成功するまとめカード

```html
<div class="bg-ads-surface rounded-2xl border border-ads-border p-6 mt-8">
  <div class="flex items-center gap-2 mb-4">
    <i data-lucide="list-check" class="w-5 h-5 text-ads-accent"></i>
    <h2 class="text-lg font-bold text-ads-text">この図解で伝えたかったこと</h2>
  </div>
  <ul class="space-y-3">
    <li class="flex items-start gap-3">
      <div class="w-6 h-6 bg-ads-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <span class="text-xs font-bold text-ads-accent">1</span>
      </div>
      <p class="text-sm text-slate-700">処理時間を<strong>45分→5分</strong>に短縮（89%削減）</p>
    </li>
    <li class="flex items-start gap-3">
      <div class="w-6 h-6 bg-ads-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <span class="text-xs font-bold text-ads-accent">2</span>
      </div>
      <p class="text-sm text-slate-700">入力ミスによる再確認作業がゼロになった</p>
    </li>
    <li class="flex items-start gap-3">
      <div class="w-6 h-6 bg-ads-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <span class="text-xs font-bold text-ads-accent">3</span>
      </div>
      <p class="text-sm text-slate-700">月末集中から分散処理になり、担当者の負担が大幅に減った</p>
    </li>
  </ul>
</div>
```

---

## よくある失敗と対策

| 失敗パターン | 対策 |
|------------|------|
| 冒頭が「業務の背景説明」から始まる | 結論（数字・改善幅）を先に出す |
| 「早くなりました」で済ませる | 「○分→○分」と数字で示す |
| ツール名だけ書く（「ETCシステム」） | 「ETCシステム（カードの利用履歴を管理するシステム）」と補足 |
| セクションが3つ以上になる | 一枚絵サマリーで全体を見せ、詳細は1〜2セクションに絞る |
| 問題の列挙だけで終わる | 「なぜ問題か」→「何が必要か」の流れで終わらせる |

---

## シナリオ別の推奨ページ構成

### シナリオA（業務改善の成果報告）
```
ヒーロー（結論の先出し） → 数値カード → 改善前後の比較 → まとめ
```

### シナリオB（現状のカオス可視化）
```
ヒーロー（「現状は混乱しています」） → カオス状態マップ → ツール乱立の状態 → 「何が必要か」のまとめ
```

### シナリオC（問題の深刻さを伝える）
```
ヒーロー（「○ヶ月で○件の問題が発生」） → 被害規模の数字カード → 影響の連鎖図 → まとめ（対応が必要な理由）
```

### シナリオD（業務フロー説明）
```
ヒーロー（「この業務は○ステップで完結します」） → 横ステップフロー → 各ステップの補足 → まとめ
```
