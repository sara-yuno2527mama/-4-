import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Redis } from "@upstash/redis";
import { isKitchenDemoEmpty, seedDemoKitchenState } from "./demo-state";
import { DEFAULT_STATE, type KitchenState } from "./types";
import {
  linkedLineUserId,
  normalizeKitchenState,
  selfMember,
} from "./kitchen-state";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "kitchen.json");

const STATE_PREFIX = "kitchen:";
/** いま使っている householdId。読み出しで鍵を決めるために持つ */
const CURRENT_KEY = "kitchen:current";
/** 送り先のLINE ID だけの控え。本体の保存が失敗しても連携が消えないように */
const LINE_KEY = "kitchen:line";
/** 送信済みの記録だけの控え。同じ日の二重送信を防ぐ */
const NOTIFY_KEY = "kitchen:notify";

let client: Redis | null | undefined;

/** Vercel の Upstash は KV_REST_API_*、素の Upstash は UPSTASH_REDIS_REST_* を入れる */
function redisEnv(): { url: string; token: string } | null {
  const url = (
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    ""
  ).trim();
  const token = (
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    ""
  ).trim();
  if (!url || !token) return null;
  return { url, token };
}

function redisClient(): Redis | null {
  if (client !== undefined) return client;
  const env = redisEnv();
  if (!env) {
    client = null;
    return client;
  }
  client = new Redis(env);
  return client;
}

/** 保存が使えるか（設定画面・診断用） */
export function isServerStorePersistent(): boolean {
  return redisClient() !== null;
}

/** 本体に送り先が無いときだけ、控えの LINE ID を「自分」に付け直す */
function attachLineUserId(
  state: KitchenState,
  userId: string | null,
): KitchenState {
  if (!userId || linkedLineUserId(state)) return state;
  const targetId = selfMember(state)?.id ?? "member-self";
  return {
    ...state,
    members: state.members.map((member) =>
      member.id === targetId
        ? { ...member, lineUserId: userId, lineLinked: true }
        : member,
    ),
  };
}

async function readFromRedis(redis: Redis): Promise<KitchenState> {
  const householdId =
    (await redis.get<string>(CURRENT_KEY)) || DEFAULT_STATE.householdId;
  const [stored, lineUserId, notifyLog] = await Promise.all([
    redis.get<Partial<KitchenState>>(STATE_PREFIX + householdId),
    redis.get<string>(LINE_KEY),
    redis.get<KitchenState["notifyLog"]>(NOTIFY_KEY),
  ]);
  const base = stored
    ? normalizeKitchenState(stored)
    : structuredClone(DEFAULT_STATE);
  const withLine = attachLineUserId(base, lineUserId ?? null);
  if (!notifyLog) return withLine;
  return { ...withLine, notifyLog: { ...withLine.notifyLog, ...notifyLog } };
}

function withDemoIfEmpty(state: KitchenState): KitchenState {
  return isKitchenDemoEmpty(state) ? seedDemoKitchenState(state) : state;
}

export async function readKitchenStore(): Promise<KitchenState> {
  const redis = redisClient();
  if (redis) {
    try {
      return withDemoIfEmpty(await readFromRedis(redis));
    } catch (error) {
      console.error("[kitchen-store] 読み出しに失敗しました", error);
      throw error;
    }
  }
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    return withDemoIfEmpty(
      normalizeKitchenState(JSON.parse(raw) as Partial<KitchenState>),
    );
  } catch {
    return seedDemoKitchenState(structuredClone(DEFAULT_STATE));
  }
}

export async function writeKitchenStore(state: KitchenState): Promise<void> {
  const redis = redisClient();
  if (!redis) {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(state, null, 2), "utf8");
    return;
  }

  // 送り先と送信済みの記録は小さいので先に書く。
  // 本体はレシピ写真で大きくなり、Upstash のリクエスト上限に当たることがあるため。
  const lineUserId = linkedLineUserId(state);
  try {
    await Promise.all([
      lineUserId ? redis.set(LINE_KEY, lineUserId) : redis.del(LINE_KEY),
      redis.set(NOTIFY_KEY, state.notifyLog),
    ]);
  } catch (error) {
    console.error("[kitchen-store] 送り先・送信記録の保存に失敗しました", error);
  }

  const householdId = state.householdId || DEFAULT_STATE.householdId;
  try {
    await redis.set(STATE_PREFIX + householdId, state);
    await redis.set(CURRENT_KEY, householdId);
  } catch (error) {
    console.error("[kitchen-store] 本体の保存に失敗しました", error);
    throw new Error("kitchen_store_write_failed");
  }
}
