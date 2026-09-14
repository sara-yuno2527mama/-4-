import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { readKitchenStore, writeKitchenStore } from "./server-store";
import { upsertRecipeShare } from "./recipe-library";
import type { RecipeShareSnapshot } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "recipe-shares.json");

type GlobalShares = {
  __recipeShares?: Map<string, RecipeShareSnapshot>;
};

function memoryMap(): Map<string, RecipeShareSnapshot> {
  const globalRef = globalThis as GlobalShares;
  if (!globalRef.__recipeShares) {
    globalRef.__recipeShares = new Map();
  }
  return globalRef.__recipeShares;
}

async function readShareFile(): Promise<RecipeShareSnapshot[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as RecipeShareSnapshot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeShareFile(shares: RecipeShareSnapshot[]): Promise<void> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(shares, null, 2));
  } catch {
    if (process.env.VERCEL) return;
    throw new Error("recipe_share_write_failed");
  }
}

export async function putRecipeShare(
  snapshot: RecipeShareSnapshot,
): Promise<RecipeShareSnapshot> {
  memoryMap().set(snapshot.token, snapshot);
  const fromFile = await readShareFile();
  await writeShareFile(upsertRecipeShare(fromFile, snapshot));

  const kitchen = await readKitchenStore();
  const next = {
    ...kitchen,
    recipeShares: upsertRecipeShare(kitchen.recipeShares ?? [], snapshot),
  };
  try {
    await writeKitchenStore(next);
  } catch {
    /* Vercel など読み取り専用 */
  }
  return snapshot;
}

export async function getRecipeShare(
  token: string,
): Promise<RecipeShareSnapshot | null> {
  const fromMemory = memoryMap().get(token);
  if (fromMemory) return fromMemory;

  const fromFile = (await readShareFile()).find((item) => item.token === token);
  if (fromFile) {
    memoryMap().set(token, fromFile);
    return fromFile;
  }

  const kitchen = await readKitchenStore();
  const fromKitchen = (kitchen.recipeShares ?? []).find(
    (item) => item.token === token,
  );
  if (fromKitchen) {
    memoryMap().set(token, fromKitchen);
    return fromKitchen;
  }
  return null;
}
