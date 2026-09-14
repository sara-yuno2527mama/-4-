# 現在の状態（このファイルが正本）

最終更新: 2026-09-14

このファイルは「今どこまで進んでいて、次に何をするか」だけを常に上書きしていくメモです。
チャットが増えても、ここさえ読めば迷わないようにするためのものです。
新しいチャットを始めるときは、まずこのファイルの内容を貼ってください。

- 詳しい仕様のSSoTは引き続き `docs/mirai-crosscut-schedule-design.md` と `docs/mirai-storage-design.md`
- ここ（NEXT.md）は「進捗と次の一手」専用。仕様の詳細は書かない

---

## リポジトリ / ブランチ

- リポジトリ: `sara-yuno2527mama/-4-`
- 開発ブランチ: `claude/brave-allen-usn5wc`
- プロジェクト: 総務・みらいプロジェクト 4ペインダッシュボード（Next.js 16 / workspace-ui-kit）

## 直近の完了

- Phase 3 後半（タイマー・実績・繰越）実装済み
- Phase 4（ペア別枠）実装済み
- `npm run test`: 全66件パス
- `npm run build`: 成功

## 今わかっている問題

- `npm run lint` でエラー2件（CLAUDE.mdのルール「派生stateをEffectで複製しない」違反）
  1. `components/mirai/MiraiProgramTablePane.tsx:128` — タイマー表示の `setState` をEffect内で同期呼び出し
  2. `components/mirai/MiraiWorkspace.tsx:167` — 月替わり時の下書きリセットも同様

## 次にやること（優先順）

1. 上記lintエラー2件の修正
2. 機能開発の候補（未着手・優先度は相談して決める）
   - 15:30ルールアラート（Phase 4残り）
   - 保存先を localStorage → DB へ移す設計の実装着手
   - 発表会準備Excelの取込画面（§16.2、まだ画面化されていない）
   - 過去の確定次第（議事録アーカイブ）のseedデータ投入

## バックアップ済みの関連プロジェクト（参考）

Cursorの利用上限をきっかけに、以下も同じリポジトリの別ブランチへバックアップ済み。
みらいPJとは別件だが、置き場所として記録しておく。

- `backup/ai-kitchen-secretary`
- `backup/personal-visual-explainers`
- `backup/creating-visual-explainers`
