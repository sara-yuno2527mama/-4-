import { getRecipeShare } from "@/lib/recipe-share-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const snapshot = await getRecipeShare(token);
  if (!snapshot) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json(snapshot);
}
