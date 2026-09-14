import { extractRecipeFromImages } from "@/lib/recipe-extract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    imageDataUrl?: string;
    imageDataUrls?: string[];
    demoSample?: boolean;
  } | null;

  const fromList = Array.isArray(body?.imageDataUrls)
    ? body.imageDataUrls.filter(
        (item): item is string =>
          typeof item === "string" && item.startsWith("data:image/"),
      )
    : [];
  const single =
    typeof body?.imageDataUrl === "string" &&
    body.imageDataUrl.startsWith("data:image/")
      ? [body.imageDataUrl]
      : [];
  const imageDataUrls = fromList.length > 0 ? fromList : single;

  if (imageDataUrls.length === 0 && !body?.demoSample) {
    return Response.json({ error: "画像がありません" }, { status: 400 });
  }

  const extracted = await extractRecipeFromImages(imageDataUrls, {
    demoSample: Boolean(body?.demoSample),
  });
  return Response.json(extracted);
}
