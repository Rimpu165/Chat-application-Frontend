import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Turn relative upload paths into full URLs for <img src> */
export function resolveMediaUrl(path: string | undefined | null): string | undefined {
  if (!path) return undefined;
  const trimmed = path.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const origin = api.replace(/\/api\/?$/, "");
  return `${origin}/${trimmed.replace(/^\//, "")}`;
}
