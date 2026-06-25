/** Chat list / message timestamps — dynamic, locale-aware */
export function formatChatTime(iso?: string | Date | null): string {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (startOfMsg.getTime() === startOfToday.getTime()) {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(startOfToday);
  yesterday.setDate(yesterday.getDate() - 1);
  if (startOfMsg.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }
  if (now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000) {
    return d.toLocaleDateString(undefined, { weekday: "short" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Preview line for room list from API message shape */
export function previewFromLatestMessage(latest: {
  message?: string;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
} | null | undefined): string {
  if (!latest) return "No messages yet";
  const text = (latest.message || "").trim();
  if (text) return text.length > 80 ? `${text.slice(0, 80)}…` : text;
  if (latest.fileUrl) {
    if (latest.fileType === "image") return "📷 Photo";
    if (latest.fileType === "video") return "🎬 Video";
    if (latest.fileType === "audio") return "🎤 Voice";
    if (latest.fileName) return `📎 ${latest.fileName}`;
    return "📎 Attachment";
  }
  return "Message";
}

export function formatLastSeen(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `Last seen ${formatChatTime(d)}`;
}
