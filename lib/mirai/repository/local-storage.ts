/**
 * repository 抽象の localStorage アダプタ（開発・デモ専用／storage 設計 §10.1）。
 *
 * 単一ブロブ（MIRAI_ROSTER_STORAGE_KEY）を読み書きし、`storage` イベントでタブ間
 * 同期する。schema・既定値・parse は lib/mirai/roster-state.ts を再利用する（重複実装しない）。
 * 内部処理は同期だが、DB アダプタと差し替え可能にするため interface は async で満たす。
 */

import { type MiraiRosterRepository } from "@/lib/mirai/repository/types";
import {
  MIRAI_ROSTER_DEFAULT,
  MIRAI_ROSTER_STORAGE_KEY,
  parseRosterState,
  type MiraiRosterState,
} from "@/lib/mirai/roster-state";

export class LocalStorageRosterRepository implements MiraiRosterRepository {
  load(): Promise<MiraiRosterState> {
    if (typeof window === "undefined") return Promise.resolve(MIRAI_ROSTER_DEFAULT);
    return Promise.resolve(
      parseRosterState(window.localStorage.getItem(MIRAI_ROSTER_STORAGE_KEY)),
    );
  }

  save(state: MiraiRosterState): Promise<void> {
    if (typeof window === "undefined") return Promise.resolve();
    try {
      window.localStorage.setItem(
        MIRAI_ROSTER_STORAGE_KEY,
        JSON.stringify(state),
      );
    } catch {
      // localStorage 不可（プライベートモード等）でもメモリ上は保持されるため握りつぶす
    }
    return Promise.resolve();
  }

  subscribe(onChange: (state: MiraiRosterState) => void): () => void {
    if (typeof window === "undefined") return () => {};
    const handler = (e: StorageEvent) => {
      if (e.key !== MIRAI_ROSTER_STORAGE_KEY) return;
      onChange(
        parseRosterState(window.localStorage.getItem(MIRAI_ROSTER_STORAGE_KEY)),
      );
    };
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("storage", handler);
    };
  }
}
