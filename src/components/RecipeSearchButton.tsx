"use client";

import { ExternalLink } from "lucide-react";
import { buildRecipeSearchUrl } from "@/lib/recipe-search";
import type { RecipeSiteId } from "@/lib/types";

export function RecipeSearchButton({
  query,
  site,
  label = "レシピを探す",
  variant = "button",
  className,
}: {
  query: string;
  site: RecipeSiteId;
  label?: string;
  /** outline は「これにする」「編集」と同じ行に並べるとき */
  variant?: "button" | "text" | "outline";
  /** 選択列に混ぜるときなど、見た目をそろえたい場合に variant を上書きする */
  className?: string;
}) {
  const url = buildRecipeSearchUrl(site, query);
  const variantClassName =
    variant === "text"
      ? "inline-flex min-h-11 items-center gap-1 text-base font-semibold text-[#1B6B32]"
      : variant === "outline"
        ? "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[#1B6B32] bg-white px-3 text-base font-semibold text-[#1B6B32]"
        : "inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1B6B32] px-3 py-2 text-sm font-semibold text-white hover:bg-[#155828]";
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? variantClassName}
    >
      {label}
      <ExternalLink className="size-3.5" />
    </a>
  );
}
