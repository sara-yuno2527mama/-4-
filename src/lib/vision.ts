export async function visionJson<T>(
  prompt: string,
  imageDataUrlOrUrls: string | string[],
): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("missing_api_key");
  }

  const images = (
    Array.isArray(imageDataUrlOrUrls) ? imageDataUrlOrUrls : [imageDataUrlOrUrls]
  ).filter((item) => item.startsWith("data:image/"));
  if (images.length === 0) {
    throw new Error("missing_images");
  }

  const baseUrl = (
    process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              ...images.map((url) => ({
                type: "image_url" as const,
                image_url: { url },
              })),
            ],
          },
        ],
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "network";
    throw new Error(`vision_network:${message.slice(0, 80)}`);
  }

  const body = await response.text();
  if (!response.ok) {
    let detail = body.slice(0, 180);
    try {
      const parsed = JSON.parse(body) as {
        error?: { type?: string; code?: string; message?: string };
      };
      const err = parsed.error;
      if (err) {
        detail = [err.type, err.code, err.message]
          .filter(Boolean)
          .join(":")
          .slice(0, 180);
      }
    } catch {
      /* keep raw slice */
    }
    throw new Error(`vision_failed:${response.status}:${detail}`);
  }

  const payload = JSON.parse(body) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("empty_vision_result");
  }
  const trimmed = content.trim().replace(/^```json\s*|\s*```$/g, "");
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error("vision_json_parse");
  }
}

export function hasOpenAiApiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function missingKeyResponse() {
  return Response.json(
    {
      error: "読み取り用のキーがありません。手入力して確定できます。",
      reason: "missing_key",
    },
    { status: 503 },
  );
}
