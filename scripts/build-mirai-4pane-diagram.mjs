import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const basePath = path.join(
  root,
  ".claude/skills/creating-visual-explainers/references/base.html",
);
const outPath = path.join(root, "output/mirai-4pane-workspace.html");

const screenshots = [
  {
    file: "C:/Users/o9o15/Desktop/mirai-workspace.png",
    caption: "総務（月次締め）— 仕事カテゴリと締めタイミングを分けて一覧",
  },
  {
    file: "C:/Users/o9o15/Desktop/mirai-committee-may.png",
    caption: "実行委員会 — 月選択・昨年次第参照・A4資料プレビューを1画面に",
  },
  {
    file: "C:/Users/o9o15/Desktop/mirai-private-pottery.png",
    caption: "プライベート — 陶芸・保育園など個人タスクも同じ4ペインで管理",
  },
];

function toDataUri(filePath) {
  const buf = fs.readFileSync(filePath);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

const imgs = screenshots.map((s) => ({
  ...s,
  src: toDataUri(s.file),
}));

const content = `
<!-- HERO -->
<div class="text-center mb-8 md:mb-10">
  <div class="inline-flex items-center gap-2 bg-ads-accent/10 text-ads-accent-light px-4 py-1.5 rounded-full text-sm font-medium mb-6">
    <i data-lucide="layout-panel-left" class="w-4 h-4"></i>
    みらいプロジェクト / 業務改善
  </div>
  <h1 class="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-6">
    みらい事務局向け<br>
    <span class="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">4ペインワークスペース</span>
  </h1>
  <p class="text-lg text-ads-muted max-w-xl mx-auto leading-relaxed">
    Excel・Word・メールに散らばっていた事務局業務を、<br class="hidden md:inline">
    1つの画面で「見る・選ぶ・読む・書く」に分けて整理したツールです。
  </p>
</div>

<!-- 30秒サマリー -->
<div class="bg-ads-surface border border-ads-border rounded-2xl p-6 md:p-8 mb-12">
  <p class="text-center text-sm font-bold text-ads-accent-light mb-4">30秒で把握 — 4ペインの役割</p>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
    <div class="bg-white border border-ads-border rounded-xl p-4 text-center">
      <div class="text-xs font-bold text-violet-600 mb-1">Pane 1</div>
      <div class="text-sm font-bold text-slate-900 mb-1">領域・仕事</div>
      <p class="text-[11px] text-ads-muted leading-snug">総務 / 参観デー / 実行委員会 / プライベート</p>
    </div>
    <div class="bg-white border border-ads-border rounded-xl p-4 text-center">
      <div class="text-xs font-bold text-blue-600 mb-1">Pane 2</div>
      <div class="text-sm font-bold text-slate-900 mb-1">一覧・時期</div>
      <p class="text-[11px] text-ads-muted leading-snug">タスク一覧、月ボタン、締めスケジュール帯</p>
    </div>
    <div class="bg-white border border-ads-border rounded-xl p-4 text-center">
      <div class="text-xs font-bold text-emerald-600 mb-1">Pane 3</div>
      <div class="text-sm font-bold text-slate-900 mb-1">読む・参照</div>
      <p class="text-[11px] text-ads-muted leading-snug">詳細、昨年次第、今月の草案を確認</p>
    </div>
    <div class="bg-white border border-ads-border rounded-xl p-4 text-center">
      <div class="text-xs font-bold text-amber-600 mb-1">Pane 4</div>
      <div class="text-sm font-bold text-slate-900 mb-1">書く・出力</div>
      <p class="text-[11px] text-ads-muted leading-snug">チェックリスト、A4資料の編集・プレビュー</p>
    </div>
  </div>
  <p class="text-center text-xs text-ads-dim mt-4">採用管理のデモ画面（/）とは別ルート /mirai で独立運用</p>
</div>

<!-- 1. 画面キャプチャ -->
<section class="mb-12 md:mb-16">
  <div class="flex items-center gap-3 mb-6">
    <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20">
      <i data-lucide="monitor" class="w-5 h-5 text-blue-600"></i>
    </div>
    <div>
      <p class="text-xs font-bold text-blue-600 tracking-wide">SECTION 1</p>
      <h2 class="text-xl md:text-2xl font-black text-slate-900">ツールの画面キャプチャ</h2>
    </div>
  </div>
  <p class="text-sm text-ads-muted mb-6">
    実際にブラウザで動く画面です。ドメインごとにペイン2〜4の中身が切り替わります。
  </p>
  <div class="flex flex-col gap-6">
    ${imgs
      .map(
        (img, i) => `
    <figure class="bg-ads-surface border border-ads-border rounded-2xl overflow-hidden">
      <img src="${img.src}" alt="みらいワークスペース画面 ${i + 1}" class="w-full h-auto block" loading="${i === 0 ? "eager" : "lazy"}">
      <figcaption class="px-4 py-3 text-sm text-ads-muted border-t border-ads-border bg-white">${img.caption}</figcaption>
    </figure>`,
      )
      .join("")}
  </div>
</section>

<!-- 2. 解決できる課題 -->
<section class="mb-12 md:mb-16">
  <div class="flex items-center gap-3 mb-6">
    <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
      <i data-lucide="target" class="w-5 h-5 text-emerald-600"></i>
    </div>
    <div>
      <p class="text-xs font-bold text-emerald-600 tracking-wide">SECTION 2</p>
      <h2 class="text-xl md:text-2xl font-black text-slate-900">ツールで解決できる課題</h2>
    </div>
  </div>

  <div class="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
    <p class="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
      <i data-lucide="alert-circle" class="w-4 h-4"></i>
      改善前の状態
    </p>
    <div class="grid md:grid-cols-2 gap-3 text-sm text-red-900/80">
      <div class="flex gap-2"><span class="text-red-400 shrink-0">—</span>月次締め・ETC・制服などがExcelとメールに分散</div>
      <div class="flex gap-2"><span class="text-red-400 shrink-0">—</span>実行委員会の次第はWordと昨年PDFを行き来</div>
      <div class="flex gap-2"><span class="text-red-400 shrink-0">—</span>主担当とペア担当の切り分けが一覧で見えない</div>
      <div class="flex gap-2"><span class="text-red-400 shrink-0">—</span>「18〜20日締め」と「月末締め」が同じリストで混在</div>
    </div>
  </div>

  <div class="grid md:grid-cols-2 gap-4">
    <div class="bg-white border border-ads-border rounded-xl p-5">
      <div class="flex items-center gap-2 mb-3">
        <i data-lucide="calendar-check" class="w-5 h-5 text-ads-accent"></i>
        <h3 class="font-bold text-slate-900">月次締めの見通し</h3>
      </div>
      <p class="text-sm text-ads-muted leading-relaxed">Pane1で仕事カテゴリ（ETC・制服など）、Pane2で締めタイミング帯を分離。いつ何をするかが迷子になりにくい。</p>
    </div>
    <div class="bg-white border border-ads-border rounded-xl p-5">
      <div class="flex items-center gap-2 mb-3">
        <i data-lucide="users" class="w-5 h-5 text-ads-accent"></i>
        <h3 class="font-bold text-slate-900">主・ペアの役割分担</h3>
      </div>
      <p class="text-sm text-ads-muted leading-relaxed">タスクごとに担当（主 / ペア / 本人）を表示。クリティカルパスと補助業務の偏りを一覧で確認できる。</p>
    </div>
    <div class="bg-white border border-ads-border rounded-xl p-5">
      <div class="flex items-center gap-2 mb-3">
        <i data-lucide="file-text" class="w-5 h-5 text-ads-accent"></i>
        <h3 class="font-bold text-slate-900">実行委員会の次第づくり</h3>
      </div>
      <p class="text-sm text-ads-muted leading-relaxed">対象月を選び、昨年同月±1ヶ月の次第をPane3で参照しながら、Pane4でA4資料をプレビュー・編集できる。</p>
    </div>
    <div class="bg-white border border-ads-border rounded-xl p-5">
      <div class="flex items-center gap-2 mb-3">
        <i data-lucide="home" class="w-5 h-5 text-ads-accent"></i>
        <h3 class="font-bold text-slate-900">プライベート業務の同居</h3>
      </div>
      <p class="text-sm text-ads-muted leading-relaxed">陶芸の注文管理や保育園のお弁当スケジュールなど、仕事外タスクも同じ操作感で扱える。</p>
    </div>
  </div>
</section>

<!-- 3. 工夫したポイント -->
<section class="mb-12 md:mb-16">
  <div class="flex items-center gap-3 mb-6">
    <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20">
      <i data-lucide="lightbulb" class="w-5 h-5 text-violet-600"></i>
    </div>
    <div>
      <p class="text-xs font-bold text-violet-600 tracking-wide">SECTION 3</p>
      <h2 class="text-xl md:text-2xl font-black text-slate-900">工夫したポイント</h2>
    </div>
  </div>

  <div class="flex flex-col gap-4">
    <div class="flex gap-4 bg-ads-surface border border-ads-border rounded-xl p-5">
      <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500 text-white text-sm font-black shrink-0">1</div>
      <div>
        <h3 class="font-bold text-slate-900 mb-1">採用デモの4ペイン設計をそのまま流用</h3>
        <p class="text-sm text-ads-muted leading-relaxed">既存ワークスペースの「領域 → 一覧 → 詳細 → 作業」という責務分離を踏襲。新しいUIを一から考えず、学習コストを抑えた。</p>
      </div>
    </div>
    <div class="flex gap-4 bg-ads-surface border border-ads-border rounded-xl p-5">
      <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500 text-white text-sm font-black shrink-0">2</div>
      <div>
        <h3 class="font-bold text-slate-900 mb-1">総務は「仕事」と「締め時期」を別ペインに配置</h3>
        <p class="text-sm text-ads-muted leading-relaxed">当初Pane1に締めタイミングを置いたが混乱したため、Pane1＝仕事カテゴリ、Pane2上部＝スケジュール帯に再設計。実務の頭の整理順に合わせた。</p>
      </div>
    </div>
    <div class="flex gap-4 bg-ads-surface border border-ads-border rounded-xl p-5">
      <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500 text-white text-sm font-black shrink-0">3</div>
      <div>
        <h3 class="font-bold text-slate-900 mb-1">実行委員会モード — 読む（Pane3）と書く（Pane4）を分離</h3>
        <p class="text-sm text-ads-muted leading-relaxed">昨年資料の参照は読み取り専用ペイン、今月の次第案とA4プレビューは編集ペイン。Wordで下書きしながら別ファイルを開く動きを画面内で再現。</p>
      </div>
    </div>
    <div class="flex gap-4 bg-ads-surface border border-ads-border rounded-xl p-5">
      <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500 text-white text-sm font-black shrink-0">4</div>
      <div>
        <h3 class="font-bold text-slate-900 mb-1">データはJSON + 型定義で管理</h3>
        <p class="text-sm text-ads-muted leading-relaxed">画面文言・タスク・次第データを dashboard.json に集約し、Zodで検証。業務変更時はデータ差し替えで画面を更新できる構成にした。</p>
      </div>
    </div>
  </div>
</section>

<!-- 4. 苦戦したポイント -->
<section class="mb-8">
  <div class="flex items-center gap-3 mb-6">
    <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20">
      <i data-lucide="wrench" class="w-5 h-5 text-amber-600"></i>
    </div>
    <div>
      <p class="text-xs font-bold text-amber-600 tracking-wide">SECTION 4</p>
      <h2 class="text-xl md:text-2xl font-black text-slate-900">苦戦したポイント</h2>
    </div>
  </div>

  <div class="flex flex-col gap-4">
    <div class="border-l-4 border-amber-400 bg-amber-50/50 rounded-r-xl pl-5 pr-4 py-4">
      <h3 class="font-bold text-slate-900 mb-1">Pane3が狭い画面で潰れる</h3>
      <p class="text-sm text-ads-muted leading-relaxed">4ペイン横並びは合計最小幅を超えやすい。Pane3に min-width、親に横スクロールを設定して対応。スマホ向け最適化は未着手。</p>
      <p class="text-xs text-ads-positive mt-2 font-medium">対応済: 最小幅 + overflow-x-auto</p>
    </div>
    <div class="border-l-4 border-amber-400 bg-amber-50/50 rounded-r-xl pl-5 pr-4 py-4">
      <h3 class="font-bold text-slate-900 mb-1">A4プレビューの位置ずれ</h3>
      <p class="text-sm text-ads-muted leading-relaxed">CSS transform で縮小表示すると、外枠と実寸プレビューの中心がずれた。専用フレームコンポーネントで外側ボックスサイズを計算し直して解消。</p>
      <p class="text-xs text-ads-positive mt-2 font-medium">対応済: MiraiA4PreviewFrame</p>
    </div>
    <div class="border-l-4 border-amber-400 bg-amber-50/50 rounded-r-xl pl-5 pr-4 py-4">
      <h3 class="font-bold text-slate-900 mb-1">Pane1の情報設計の試行錯誤</h3>
      <p class="text-sm text-ads-muted leading-relaxed">総務領域で「締めタイミング」をナビに置くと、ETCと制服のような仕事単位と噛み合わなかった。ユーザーフィードバックを反映し、カテゴリとタイミングを分離。</p>
      <p class="text-xs text-ads-positive mt-2 font-medium">対応済: 仕事カテゴリ + Pane2スケジュール帯</p>
    </div>
    <div class="border-l-4 border-red-300 bg-red-50/30 rounded-r-xl pl-5 pr-4 py-4">
      <h3 class="font-bold text-slate-900 mb-1">編集内容の永続化（未解決）</h3>
      <p class="text-sm text-ads-muted leading-relaxed">チェックリストや次第案の編集はブラウザ内の一時状態のみ。リロードで消える。次フェーズでJSON保存またはAPI接続が必要。</p>
      <p class="text-xs text-ads-warning mt-2 font-medium">未対応 — 次の改善課題</p>
    </div>
  </div>
</section>

<div class="bg-ads-surface border border-ads-border rounded-2xl p-6 text-center">
  <p class="text-sm text-ads-muted mb-1">ローカル開発URL</p>
  <p class="font-mono text-sm text-slate-900">http://localhost:3000/mirai</p>
  <p class="text-xs text-ads-dim mt-3">本番デプロイ・DB連携は今後のフェーズ</p>
</div>
`;

let html = fs.readFileSync(basePath, "utf8");
html = html.replace("<!-- TITLE -->", "みらい事務局 4ペインワークスペース図解");
html = html.replace(
  "<!-- DESCRIPTION -->",
  "みらいプロジェクト事務局向け4ペインワークスペースの画面・課題・工夫・苦戦を図解します。",
);
html = html.replace(
  /<!-- CONTENT_START -->\s*\n\s*<!-- CONTENT_END -->/,
  `<!-- CONTENT_START -->\n${content}\n<!-- CONTENT_END -->`,
);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html);
console.log("Wrote", outPath, `(${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)`);
