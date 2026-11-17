import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import type { Hono } from "hono";

import { SESSION_COOKIE, userFromSessionCookie } from "../auth.ts";
import type { AppEnv, SessionUser } from "../app-env.ts";
import type { Database } from "../db/client.ts";
import { errorBody } from "../errors.ts";
import { parseCategoryName } from "./parse-body.ts";
import {
  createGroupCategory,
  getGroupSummary,
  listGroupCategories,
  patchGroupCategory,
} from "./service.ts";

async function requireSession(
  c: Context<AppEnv>,
  db: Database,
): Promise<SessionUser | Response> {
  const user = await userFromSessionCookie(db, getCookie(c, SESSION_COOKIE));
  if (!user) {
    return c.json(
      errorBody("UNAUTHENTICATED", "Sign in required.", c.get("requestId")),
      401,
    );
  }
  return user;
}

export function registerCategoryRoutes(groups: Hono<AppEnv>, db: Database) {
  groups.get("/groups/:groupId/categories", async (c) => {
    const user = await requireSession(c, db);
    if (user instanceof Response) return user;
    const groupId = c.req.param("groupId");
    const result = await listGroupCategories(db, groupId, user.id);
    if (!result.ok) {
      return c.json(
        errorBody("NOT_FOUND", "Group not found.", c.get("requestId")),
        404,
      );
    }
    return c.json({ categories: result.categories });
  });

  groups.post("/groups/:groupId/categories", async (c) => {
    const user = await requireSession(c, db);
    if (user instanceof Response) return user;
    const groupId = c.req.param("groupId");
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        errorBody("VALIDATION_FAILED", "The body is wrong.", c.get("requestId"), { field: "body" }),
        422,
      );
    }
    const parsed = parseCategoryName(body);
    if (!parsed.ok) {
      return c.json(
        errorBody(
          "VALIDATION_FAILED",
          parsed.field === "name" ? "The category name is wrong." : "The body is wrong.",
          c.get("requestId"),
          { field: parsed.field },
        ),
        422,
      );
    }
    const result = await createGroupCategory(db, groupId, user.id, parsed.name);
    if (!result.ok) {
      if (result.kind === "not_found") {
        return c.json(
          errorBody("NOT_FOUND", "Group not found.", c.get("requestId")),
          404,
        );
      }
      return c.json(
        errorBody("VALIDATION_FAILED", "The category name is wrong.", c.get("requestId"), {
          field: result.field ?? "name",
        }),
        422,
      );
    }
    return c.json(result.category, 201);
  });

  groups.patch("/groups/:groupId/categories/:categoryId", async (c) => {
    const user = await requireSession(c, db);
    if (user instanceof Response) return user;
    const groupId = c.req.param("groupId");
    const categoryId = c.req.param("categoryId");
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        errorBody("VALIDATION_FAILED", "The body is wrong.", c.get("requestId"), { field: "body" }),
        422,
      );
    }
    const parsed = parseCategoryName(body);
    if (!parsed.ok) {
      return c.json(
        errorBody(
          "VALIDATION_FAILED",
          parsed.field === "name" ? "The category name is wrong." : "The body is wrong.",
          c.get("requestId"),
          { field: parsed.field },
        ),
        422,
      );
    }
    const result = await patchGroupCategory(db, groupId, categoryId, user.id, parsed.name);
    if (!result.ok) {
      if (result.kind === "not_found") {
        return c.json(
          errorBody("NOT_FOUND", "Group not found.", c.get("requestId")),
          404,
        );
      }
      return c.json(
        errorBody("VALIDATION_FAILED", "The category name is wrong.", c.get("requestId"), {
          field: result.field ?? "name",
        }),
        422,
      );
    }
    return c.json(result.category);
  });

  groups.get("/groups/:groupId/summary", async (c) => {
    const user = await requireSession(c, db);
    if (user instanceof Response) return user;
    const groupId = c.req.param("groupId");
    const result = await getGroupSummary(db, groupId, user.id);
    if (!result.ok) {
      return c.json(
        errorBody("NOT_FOUND", "Group not found.", c.get("requestId")),
        404,
      );
    }
    return c.json(result.summary);
  });
}