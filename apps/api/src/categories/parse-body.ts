import { CATEGORY_NAME_MAX } from "./constants.ts";

export type ParseCategoryNameResult =
  | { ok: true; name: string }
  | { ok: false; field: "name" | "body" };

export function parseCategoryName(body: unknown): ParseCategoryNameResult {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, field: "body" };
  }
  const record = body as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (!name || name.length > CATEGORY_NAME_MAX) {
    return { ok: false, field: "name" };
  }
  return { ok: true, name };
}