import { createHmac, timingSafeEqual } from "node:crypto";

const PUSH_URL = "https://api.line.me/v2/bot/message/push";
const REPLY_URL = "https://api.line.me/v2/bot/message/reply";

export type LineTextMessage = {
  type: "text";
  text: string;
};

export function lineChannelSecret(): string {
  return process.env.LINE_CHANNEL_SECRET?.trim() || "";
}

export function lineChannelAccessToken(): string {
  return process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim() || "";
}

export function lineAddFriendUrl(): string {
  return (
    process.env.LINE_ADD_FRIEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL?.trim() ||
    ""
  );
}

export function isLineConfigured(): boolean {
  return Boolean(lineChannelSecret() && lineChannelAccessToken());
}

export function verifyLineSignature(body: string, signature: string | null): boolean {
  const secret = lineChannelSecret();
  if (!secret || !signature) return false;
  const digest = createHmac("sha256", secret).update(body).digest("base64");
  const left = Buffer.from(digest);
  const right = Buffer.from(signature);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

async function lineRequest(
  url: string,
  payload: unknown,
): Promise<{ ok: boolean; status: number; body: string }> {
  const token = lineChannelAccessToken();
  if (!token) {
    return { ok: false, status: 500, body: "LINE_CHANNEL_ACCESS_TOKEN is missing" };
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return {
    ok: response.ok,
    status: response.status,
    body: await response.text(),
  };
}

export async function pushLineMessages(
  to: string,
  messages: LineTextMessage[],
) {
  return lineRequest(PUSH_URL, { to, messages });
}

export async function replyLineMessages(
  replyToken: string,
  messages: LineTextMessage[],
) {
  return lineRequest(REPLY_URL, { replyToken, messages });
}
