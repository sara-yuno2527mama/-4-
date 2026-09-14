/**
 * みらい運用データの repository 抽象（storage 設計 §10.2）。
 *
 * 予定編集・実績・完了・繰越・当月設定は、この async interface 越しに読み書きする。
 * localStorage は開発・デモ専用アダプタ、本番は同 interface の DB アダプタに差し替える。
 * interface は async だが、UI 側の読み取りは hooks/use-mirai-roster.ts のメモリ内
 * スナップショット store 経由で従来どおり同期のまま保つ。
 */

import { type MiraiRosterState } from "@/lib/mirai/roster-state";

export interface MiraiRosterRepository {
  /** 永続層から現在の状態を読む。未保存・失敗時はアダプタが既定値を返す。 */
  load(): Promise<MiraiRosterState>;
  /** 状態全体を永続層へ書く（store 側は fire-and-forget で write-through）。 */
  save(state: MiraiRosterState): Promise<void>;
  /**
   * 外部（別タブ・将来のリアルタイム）由来の変更を購読する。返り値は解除関数。
   * localStorage 版は `storage` イベントを購読する。対応しないアダプタは省略可。
   */
  subscribe?(onChange: (state: MiraiRosterState) => void): () => void;
}
