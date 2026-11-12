import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import type { Hono } from "hono";

import { SESSION_COOKIE, userFromSessionCookie } from "../auth.ts";
import type { AppEnv, SessionUser } from "../app-env.ts";
import type { Database } from "../db/client.ts";
import { errorBody } from "../errors.ts";
import { parseCreateExpenseBody } from "./parse-body.ts";
import { createExpense, listExpenses } from "./service.ts";

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

function readIdempotencyKey(c: Context<AppEnv>): string | null {
  const key = c.req.header("Idempotency-Key")?.trim();
  return key ? key : null;
}

export function registerExpenseRoutes(groups: Hono<AppEnv>, db: Database) {
  groups.get("/groups/:groupId/expenses", async (c) => {
    const user = await requireSession(c, db);
    if (user instanceof Response) return user;
    const groupId = c.req.param("groupId");
    const limitRaw = c.req.query("limit");
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
    const cursor = c.req.query("cursor") ?? undefined;
    const result = await listExpenses(db, groupId, user.id, { limit, cursor });
    if (!result.ok) {
      return c.json(
        errorBody("NOT_FOUND", "Group not found.", c.get("requestId")),
        404,
      );
    }
    return c.json({ expenses: result.expenses, nextCursor: result.nextCursor });
  });

  groups.post("/groups/:groupId/expenses", async (c) => {
    const user = await requireSession(c, db);
    if (user instanceof Response) return user;
    const idempotencyKey = readIdempotencyKey(c);
    if (!idempotencyKey) {
      return c.json(
        errorBody("VALIDATION_FAILED", "The idempotency key is missing.", c.get("requestId"), {
          field: "Idempotency-Key",
        }),
        422,
      );
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        errorBody("VALIDATION_FAILED", "The body is wrong.", c.get("requestId"), { field: "body" }),
        422,
      );
    }

    const parsed = parseCreateExpenseBody(body);
    if ("kind" in parsed && parsed.kind === "field") {
      return c.json(
        errorBody("VALIDATION_FAILED", "The body is wrong.", c.get("requestId"), {
          field: parsed.field,
        }),
        422,
      );
    }
    if ("kind" in parsed) {
      return c.json(
        errorBody("VALIDATION_FAILED", "The body is wrong.", c.get("requestId"), { field: "body" }),
        422,
      );
    }

    const groupId = c.req.param("groupId");
    const result = await createExpense(db, groupId, user.id, idempotencyKey, parsed);
    if (result.ok) {
      return c.json(result.expense, 201);
    }
    if (result.kind === "not_found") {
      return c.json(
        errorBody("NOT_FOUND", "Group not found.", c.get("requestId")),
        404,
      );
    }
    if (result.kind === "split_refused") {
      return c.json(
        errorBody("SPLIT_REFUSED", "The shares do not add up.", c.get("requestId"), {
          gap: result.gap,
        }),
        422,
      );
    }
    return c.json(
      errorBody("VALIDATION_FAILED", "The body is wrong.", c.get("requestId"), {
        field: result.field,
      }),
      422,
    );
  });
}
