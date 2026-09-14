import { putRecipeShare } from "@/lib/recipe-share-store";
import type { RecipeShareSnapshot } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<RecipeShareSnapshot>;
  if (!body?.token || !body.title || !body.sourceRecipeId) {
    return Response.json({ error: "invalid_share" }, { status: 400 });
  }
  const snapshot: RecipeShareSnapshot = {
    token: body.token,
    householdId: body.householdId || "household-local",
    sourceRecipeId: body.sourceRecipeId,
    title: body.title,
    ingredients: Array.isArray(body.ingredients) ? body.ingredients : [],
    photos: Array.isArray(body.photos) ? body.photos : [],
    coverIndex: body.coverIndex ?? 0,
    screenshotType: body.screenshotType ?? "unknown",
    genres: Array.isArray(body.genres) ? body.genres : [],
    createdAt: body.createdAt || new Date().toISOString(),
  };
  await putRecipeShare(snapshot);
  return Response.json({ token: snapshot.token });
}
