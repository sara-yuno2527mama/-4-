export type ExtractFailReason = "missing_key" | "network" | "unreadable";

export function extractFailMessage(reason: ExtractFailReason): string {
  switch (reason) {
    case "missing_key":
      return "読み取り用のキーがありません。手入力して確定できます。";
    case "network":
      return "通信できませんでした。手入力して確定できます。";
    default:
      return "画面を読めませんでした。手入力して確定できます。";
  }
}

export function reasonFromVisionError(message: string): ExtractFailReason {
  if (message === "missing_api_key") return "missing_key";
  if (message.startsWith("vision_network")) return "network";
  return "unreadable";
}

export function reasonFromExtractResponse(
  status: number,
  reason?: string,
): ExtractFailReason {
  if (reason === "missing_key" || reason === "network" || reason === "unreadable") {
    return reason;
  }
  if (status === 503) return "missing_key";
  return "unreadable";
}
