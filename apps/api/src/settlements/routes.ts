import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import type { Hono } from "hono";

import { SESSION_COOKIE, userFromSessionCookie } from "../auth.ts";
import type { AppEnv, SessionUser } from "../app-env.ts";
import type { Database } from "../db/client.ts";
import { errorBody } from "../errors.ts";
import { EXPENSE_IDEMPOTENCY_ENABLED } from "../expenses/flags.ts";
import { parseCreateSettlementBody, parseReplaceSettlementBody } from "./parse-body.ts";
import {
  createSettlement,
  getSettlementDetail,
  listSettlements,
  replaceSettlement,
  voidSettlement,
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

function readIdempotencyKey(c: Context<AppEnv>): string | null {
  const key = c.req.header("Idempotency-Key")?.trim();
  return key ? key : null;
}

export function registerSettlementRoutes(groups: Hono<AppEnv>, db: Database) {
  groups.get("/groups/:groupId/settlements", async (c) => {
    const user = await requireSession(c, db);
    if (user instanceof Response) return user;
    const groupId = c.req.param("groupId");
    const limitRaw = c.req.query("limit");
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
    const cursor = c.req.query("cursor") ?? undefined;
    const result = await listSettlements(db, groupId, user.id, { limit, cursor });
    if (!result.ok) {
      return c.json(
        errorBody("NOT_FOUND", "Group not found.", c.get("requestId")),
        404,
      );
    }
    return c.json({ settlements: result.settlements, nextCursor: result.nextCursor });
  });

  groups.post("/groups/:groupId/settlements", async (c) => {
    const user = await requireSession(c, db);
    if (user instanceof Response) return user;
    if (EXPENSE_IDEMPOTENCY_ENABLED && !readIdempotencyKey(c)) {
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

    const parsed = parseCreateSettlementBody(body);
    if ("kind" in parsed) {
      return c.json(
        errorBody("VALIDATION_FAILED", "The body is wrong.", c.get("requestId"), {
          field: parsed.field,
        }),
        422,
      );
    }

    const groupId = c.req.param("groupId");
    const result = await createSettlement(db, groupId, user.id, parsed);
    if (result.ok) {
      return c.json(result.settlement, 201);
    }
    if (result.kind === "not_found") {
      return c.json(
        errorBody("NOT_FOUND", "Group not found.", c.get("requestId")),
        404,
      );
    }
    return c.json(
      errorBody("VALIDATION_FAILED", "The body is wrong.", c.get("requestId"), {
        field: result.field,
      }),
      422,
    );
  });

  groups.get("/groups/:groupId/settlements/:settlementId", async (c) => {
    const user = await requireSession(c, db);
    if (user instanceof Response) return user;
    const groupId = c.req.param("groupId");
    const settlementId = c.req.param("settlementId");
    const result = await getSettlementDetail(db, groupId, settlementId, user.id);
    if (!result.ok) {
      return c.json(
        errorBody("NOT_FOUND", "Settlement not found.", c.get("requestId")),
        404,
      );
    }
    return c.json(result.settlement);
  });

  groups.put("/groups/:groupId/settlements/:settlementId", async (c) => {
    const user = await requireSession(c, db);
    if (user instanceof Response) return user;

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        errorBody("VALIDATION_FAILED", "The body is wrong.", c.get("requestId"), { field: "body" }),
        422,
      );
    }

    const parsed = parseReplaceSettlementBody(body);
    if ("kind" in parsed) {
      return c.json(
        errorBody("VALIDATION_FAILED", "The body is wrong.", c.get("requestId"), {
          field: parsed.field,
        }),
        422,
      );
    }

    const groupId = c.req.param("groupId");
    const settlementId = c.req.param("settlementId");
    const result = await replaceSettlement(db, groupId, settlementId, user.id, parsed);
    if (result.ok) {
      return c.json(result.settlement, 200);
    }
    if (result.kind === "not_found") {
      return c.json(
        errorBody("NOT_FOUND", "Settlement not found.", c.get("requestId")),
        404,
      );
    }
    if (result.kind === "voided") {
      return c.json(
        errorBody("VOIDED", "The settlement is already voided.", c.get("requestId")),
        409,
      );
    }
    if (result.kind === "version_conflict") {
      return c.json(
        errorBody("VERSION_CONFLICT", "The version is stale.", c.get("requestId")),
        409,
      );
    }
    return c.json(
      errorBody("VALIDATION_FAILED", "The body is wrong.", c.get("requestId"), {
        field: result.field,
      }),
      422,
    );
  });

  groups.post("/groups/:groupId/settlements/:settlementId/void", async (c) => {
    const user = await requireSession(c, db);
    if (user instanceof Response) return user;
    const groupId = c.req.param("groupId");
    const settlementId = c.req.param("settlementId");
    const result = await voidSettlement(db, groupId, settlementId, user.id);
    if (result.ok) {
      return c.json(result.settlement, 200);
    }
    if (result.kind === "not_found") {
      return c.json(
        errorBody("NOT_FOUND", "Settlement not found.", c.get("requestId")),
        404,
      );
    }
    return c.json(
      errorBody("VOIDED", "The settlement is already voided.", c.get("requestId")),
      409,
    );
  });
}