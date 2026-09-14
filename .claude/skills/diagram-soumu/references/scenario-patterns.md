# シナリオ別 HTMLパターン

Tailwind CSSクラスのみ使用。`<style>` タグ・絵文字は禁止。アイコンは Lucide を使う。
ADS配色（`ads-accent` / `ads-positive` / `ads-negative` / `ads-warning` / `ads-surface` / `ads-border`）を優先する。

---

## パターン A: 改善前→改善後の比較＋数値カード

「システム導入による業務スピード改善」「工数削減」など成果報告に使う。

### 数値カード（3つ並べる）

```html
<div class="grid grid-cols-3 gap-4 my-6">
  <div class="bg-ads-surface rounded-xl p-5 text-center border border-ads-border">
    <p class="text-xs text-ads-muted mb-1">処理時間（改善前）</p>
    <p class="text-3xl font-black text-ads-negative">45<span class="text-lg font-bold">分</span></p>
  </div>
  <div class="flex items-center justify-center">
    <i data-lucide="arrow-right" class="w-8 h-8 text-ads-accent"></i>
  </div>
  <div class="bg-ads-surface rounded-xl p-5 text-center border border-ads-border">
    <p class="text-xs text-ads-muted mb-1">処理時間（改善後）</p>
    <p class="text-3xl font-black text-ads-positive">5<span class="text-lg font-bold">分</span></p>
  </div>
</div>
```

### 改善前後の比較カード（左右対比）

```html
<div class="grid md:grid-cols-2 gap-4 my-6">
  <!-- 改善前 -->
  <div class="rounded-xl border-2 border-ads-negative/30 bg-red-50 p-5">
    <div class="flex items-center gap-2 mb-3">
      <i data-lucide="x-circle" class="w-5 h-5 text-ads-negative"></i>
      <span class="font-bold text-ads-negative">改善前</span>
    </div>
    <ul class="space-y-2 text-sm text-slate-700">
      <li class="flex items-start gap-2">
        <i data-lucide="minus" class="w-4 h-4 text-ads-negative flex-shrink-0 mt-0.5"></i>
        <span>手作業でExcelに転記。入力ミスが頻発</span>
      </li>
      <li class="flex items-start gap-2">
        <i data-lucide="minus" class="w-4 h-4 text-ads-negative flex-shrink-0 mt-0.5"></i>
        <span>月末に集中して処理。担当者に大きな負担</span>
      </li>
    </ul>
  </div>
  <!-- 改善後 -->
  <div class="rounded-xl border-2 border-ads-positive/30 bg-emerald-50 p-5">
    <div class="flex items-center gap-2 mb-3">
      <i data-lucide="check-circle" class="w-5 h-5 text-ads-positive"></i>
      <span class="font-bold text-ads-positive">改善後</span>
    </div>
    <ul class="space-y-2 text-sm text-slate-700">
      <li class="flex items-start gap-2">
        <i data-lucide="check" class="w-4 h-4 text-ads-positive flex-shrink-0 mt-0.5"></i>
        <span>システムが自動で集計。転記作業ゼロ</span>
      </li>
      <li class="flex items-start gap-2">
        <i data-lucide="check" class="w-4 h-4 text-ads-positive flex-shrink-0 mt-0.5"></i>
        <span>リアルタイムで確認可能。月末集中が解消</span>
      </li>
    </ul>
  </div>
</div>
```

---

## パターン B: 現状のカオス可視化

「ツールや対応がバラバラで管理できていない」状態を伝える。登場人物・ツール・問題点を混在させて混乱を視覚化する。

### カオス状態マップ

```html
<div class="bg-red-50 border-2 border-ads-negative/30 rounded-xl p-6 my-6">
  <div class="flex items-center gap-2 mb-4">
    <i data-lucide="triangle-alert" class="w-5 h-5 text-ads-warning"></i>
    <span class="font-bold text-slate-800">現状：ツール・対応がバラバラ</span>
  </div>
  <div class="grid md:grid-cols-3 gap-3">
    <!-- 関係者カード -->
    <div class="bg-white rounded-lg p-4 border border-ads-border">
      <div class="flex items-center gap-2 mb-2">
        <i data-lucide="user" class="w-4 h-4 text-ads-accent"></i>
        <span class="text-sm font-bold">A部署</span>
      </div>
      <p class="text-xs text-slate-600">メールで問い合わせ→返信が数日後</p>
      <span class="inline-block mt-2 text-xs bg-red-100 text-ads-negative px-2 py-0.5 rounded-full">遅延発生</span>
    </div>
    <div class="bg-white rounded-lg p-4 border border-ads-border">
      <div class="flex items-center gap-2 mb-2">
        <i data-lucide="user" class="w-4 h-4 text-ads-accent"></i>
        <span class="text-sm font-bold">B部署</span>
      </div>
      <p class="text-xs text-slate-600">口頭で依頼→記録が残らない</p>
      <span class="inline-block mt-2 text-xs bg-red-100 text-ads-negative px-2 py-0.5 rounded-full">抜け漏れ</span>
    </div>
    <div class="bg-white rounded-lg p-4 border border-ads-border">
      <div class="flex items-center gap-2 mb-2">
        <i data-lucide="user" class="w-4 h-4 text-ads-accent"></i>
        <span class="text-sm font-bold">外部関係者</span>
      </div>
      <p class="text-xs text-slate-600">別のフォームで申請→担当者が違う窓口に</p>
      <span class="inline-block mt-2 text-xs bg-amber-100 text-ads-warning px-2 py-0.5 rounded-full">混乱</span>
    </div>
  </div>
  <!-- 問題まとめ -->
  <div class="mt-4 bg-white rounded-lg p-3 border border-ads-negative/20">
    <p class="text-xs text-slate-600">
      <span class="font-bold text-ads-negative">結果：</span>
      事務局（私）に問い合わせが集中。1件1件個別対応で処理時間が膨大になっている。
    </p>
  </div>
</div>
```

### ツール乱立の状態

```html
<div class="my-6">
  <p class="text-sm font-bold text-slate-700 mb-3">使用ツールが統一されていない</p>
  <div class="flex flex-wrap gap-2">
    <span class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">メール</span>
    <span class="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">Excel（各自作成）</span>
    <span class="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">紙の申請書</span>
    <span class="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">口頭</span>
    <span class="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium">LINE</span>
  </div>
  <p class="text-xs text-ads-muted mt-2">→ どこに何があるか誰も把握していない状態</p>
</div>
```

---

## パターン C: 問題の深刻さ・影響の連鎖

「怠慢による事象の重大さ」「放置するとどうなるか」を時系列または連鎖で見せる。

### 影響の連鎖図（縦フロー）

```html
<div class="my-6 space-y-2">
  <!-- 起点 -->
  <div class="flex items-start gap-3 bg-red-50 border-l-4 border-ads-negative rounded-r-xl p-4">
    <i data-lucide="alert-circle" class="w-5 h-5 text-ads-negative flex-shrink-0 mt-0.5"></i>
    <div>
      <p class="font-bold text-sm text-ads-negative">起点: 前任者が申請処理を放置（○ヶ月間）</p>
      <p class="text-xs text-slate-600 mt-0.5">期限切れのまま更新されていないETCカードが○枚</p>
    </div>
  </div>
  <div class="ml-6 flex items-center">
    <i data-lucide="arrow-down" class="w-5 h-5 text-ads-muted"></i>
  </div>
  <!-- 影響1 -->
  <div class="flex items-start gap-3 bg-amber-50 border-l-4 border-ads-warning rounded-r-xl p-4">
    <i data-lucide="chevron-right" class="w-5 h-5 text-ads-warning flex-shrink-0 mt-0.5"></i>
    <div>
      <p class="font-bold text-sm text-ads-warning">影響①: 高速道路で通行不能</p>
      <p class="text-xs text-slate-600 mt-0.5">営業担当が出先で立ち往生。顧客対応に遅延</p>
    </div>
  </div>
  <div class="ml-6 flex items-center">
    <i data-lucide="arrow-down" class="w-5 h-5 text-ads-muted"></i>
  </div>
  <!-- 影響2 -->
  <div class="flex items-start gap-3 bg-amber-50 border-l-4 border-ads-warning rounded-r-xl p-4">
    <i data-lucide="chevron-right" class="w-5 h-5 text-ads-warning flex-shrink-0 mt-0.5"></i>
    <div>
      <p class="font-bold text-sm text-ads-warning">影響②: クレーム○件が総務に集中</p>
      <p class="text-xs text-slate-600 mt-0.5">現状対応に追われ、本来業務が停滞</p>
    </div>
  </div>
  <div class="ml-6 flex items-center">
    <i data-lucide="arrow-down" class="w-5 h-5 text-ads-muted"></i>
  </div>
  <!-- 現在地 -->
  <div class="flex items-start gap-3 bg-red-100 border-l-4 border-ads-negative rounded-r-xl p-4">
    <i data-lucide="map-pin" class="w-5 h-5 text-ads-negative flex-shrink-0 mt-0.5"></i>
    <div>
      <p class="font-bold text-sm text-ads-negative">現在: 未解決案件が○件残存</p>
      <p class="text-xs text-slate-600 mt-0.5">放置すれば同じ問題が再発するリスクがある</p>
    </div>
  </div>
</div>
```

### 被害規模の数字カード

```html
<div class="grid grid-cols-3 gap-4 my-6">
  <div class="bg-ads-surface rounded-xl p-5 text-center border border-ads-border">
    <i data-lucide="credit-card" class="w-6 h-6 text-ads-negative mx-auto mb-2"></i>
    <p class="text-2xl font-black text-ads-negative">12<span class="text-base font-bold">枚</span></p>
    <p class="text-xs text-ads-muted mt-1">期限切れカード数</p>
  </div>
  <div class="bg-ads-surface rounded-xl p-5 text-center border border-ads-border">
    <i data-lucide="message-square-warning" class="w-6 h-6 text-ads-warning mx-auto mb-2"></i>
    <p class="text-2xl font-black text-ads-warning">8<span class="text-base font-bold">件</span></p>
    <p class="text-xs text-ads-muted mt-1">発生したクレーム数</p>
  </div>
  <div class="bg-ads-surface rounded-xl p-5 text-center border border-ads-border">
    <i data-lucide="clock" class="w-6 h-6 text-ads-accent mx-auto mb-2"></i>
    <p class="text-2xl font-black text-ads-accent">40<span class="text-base font-bold">時間</span></p>
    <p class="text-xs text-ads-muted mt-1">事後対応に要した工数</p>
  </div>
</div>
```

---

## パターン D: 業務フロー説明（ステップ）

「手順を見せる」「どんな流れで処理しているか」に使う。

### 横ステップフロー

```html
<div class="flex flex-col md:flex-row items-start md:items-center gap-3 my-6">
  <!-- Step 1 -->
  <div class="flex-1 bg-blue-50 rounded-xl p-4 border border-blue-100">
    <div class="flex items-center gap-2 mb-2">
      <div class="w-7 h-7 bg-ads-accent text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
      <span class="font-bold text-sm text-slate-800">申請受付</span>
    </div>
    <p class="text-xs text-slate-600">フォーム（Googleフォーム）で申請を受け取る</p>
    <span class="inline-block mt-2 text-xs bg-blue-100 text-ads-accent px-2 py-0.5 rounded-full">ツール: Googleフォーム</span>
  </div>
  <i data-lucide="arrow-right" class="w-5 h-5 text-ads-muted hidden md:block flex-shrink-0"></i>
  <i data-lucide="arrow-down" class="w-5 h-5 text-ads-muted md:hidden flex-shrink-0 self-center"></i>
  <!-- Step 2 -->
  <div class="flex-1 bg-purple-50 rounded-xl p-4 border border-purple-100">
    <div class="flex items-center gap-2 mb-2">
      <div class="w-7 h-7 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
      <span class="font-bold text-sm text-slate-800">内容確認・承認</span>
    </div>
    <p class="text-xs text-slate-600">申請内容を確認し、上長に承認依頼</p>
    <span class="inline-block mt-2 text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">ツール: スプレッドシート</span>
  </div>
  <i data-lucide="arrow-right" class="w-5 h-5 text-ads-muted hidden md:block flex-shrink-0"></i>
  <i data-lucide="arrow-down" class="w-5 h-5 text-ads-muted md:hidden flex-shrink-0 self-center"></i>
  <!-- Step 3 -->
  <div class="flex-1 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
    <div class="flex items-center gap-2 mb-2">
      <div class="w-7 h-7 bg-ads-positive text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
      <span class="font-bold text-sm text-slate-800">処理・発行</span>
    </div>
    <p class="text-xs text-slate-600">承認後、カード会社に発行依頼。完了を申請者に通知</p>
    <span class="inline-block mt-2 text-xs bg-emerald-100 text-ads-positive px-2 py-0.5 rounded-full">ツール: メール</span>
  </div>
</div>
```

---

## 共通: セクションヘッダー

```html
<div class="flex items-center gap-3 mb-4">
  <div class="w-10 h-10 bg-ads-accent/10 rounded-xl flex items-center justify-center">
    <i data-lucide="chart-bar" class="w-5 h-5 text-ads-accent"></i>
  </div>
  <div>
    <h2 class="text-xl font-bold text-ads-text">セクションタイトル</h2>
    <p class="text-sm text-ads-muted">サブタイトル</p>
  </div>
</div>
```

## 共通: ツール説明の補足ラベル

ツール名の初出時に必ず添える:
```html
<span class="text-xs bg-slate-100 text-ads-muted px-2 py-0.5 rounded-full ml-1">
  （ETCカードの明細を管理するシステム）
</span>
```
