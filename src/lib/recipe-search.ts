import type { RecipeSiteId } from "./types";

const RECIPE_SITES: Record<
  RecipeSiteId,
  { label: string; buildUrl: (query: string) => string }
> = {
  cookpad: {
    label: "クックパッド",
    buildUrl: (query) =>
      `https://cookpad.com/jp/search/${encodeURIComponent(query)}`,
  },
  kurashiru: {
    label: "クラシル",
    buildUrl: (query) =>
      `https://www.kurashiru.com/search?query=${encodeURIComponent(query)}`,
  },
  google: {
    label: "ウェブ検索",
    buildUrl: (query) =>
      `https://www.google.com/search?q=${encodeURIComponent(`${query} レシピ`)}`,
  },
};

export function recipeSiteOptions() {
  return (Object.keys(RECIPE_SITES) as RecipeSiteId[]).map((id) => ({
    id,
    label: RECIPE_SITES[id].label,
  }));
}

export function buildRecipeSearchUrl(site: RecipeSiteId, query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return RECIPE_SITES[site].buildUrl("作り置き");
  return RECIPE_SITES[site].buildUrl(trimmed);
}
