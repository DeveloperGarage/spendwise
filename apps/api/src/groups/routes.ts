import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { Hono } from "hono";

import { SESSION_COOKIE, userFromSessionCookie } from "../auth.ts";
import type { AppEnv, SessionUser } from "../app-env.ts";
import type { Database } from "../db/client.ts";
import { errorBody } from "../errors.ts";
import { registerExpenseRoutes } from "../expenses/routes.ts";
import {
  addGroupMembers,
  createGroup,
  getDashboard,
  getGroupDetail,
  isGroupMember,
  listGroupCards,
  listGroupMembers,
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

export function mountGroupRoutes(db: Database) {
  const groups = new Hono<AppEnv>();

  groups.get("/dashboard", async (c) => {
    const user = await requireSession(c, db);
    if (user instanceof Response) return user;
    const body = await getDashboard(db, { id: user.id, displayName: user.displayName });
    return c.json(body);
  });

  groups.get("/groups", async (c) => {
    const user = await requireSession(c, db);
    if (user instanceof Response) return user;
    const cards = await listGroupCards(db, user.id);
    return c.json({ groups: cards });
  });

  groups.post("/groups", async (c) => {
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
    const input = (body ?? {}) as { name?: unknown; memberEmails?: unknown };
    const result = await createGroup(db, { id: user.id, email: user.email }, input);
    if (!result.ok) {
      return c.json(
        errorBody(
          "VALIDATION_FAILED",
          result.field === "name" ? "The group name is wrong." : "A member email could not be added.",
          c.get("requestId"),
          { field: result.field },
        ),
        422,
      );
    }
    return c.json(result.group, 201);
  });

  groups.get("/groups/:groupId", async (c) => {
    const user = await requireSession(c, db);
    if (user instanceof Response) return user;
    const groupId = c.req.param("groupId");
    const detail = await getGroupDetail(db, groupId, user.id);
    if (!detail) {
      return c.json(
        errorBody("NOT_FOUND", "Group not found.", c.get("requestId")),
        404,
      );
    }
    return c.json(detail);
  });

  groups.get("/groups/:groupId/members", async (c) => {
    const user = await requireSession(c, db);
    if (user instanceof Response) return user;
    const groupId = c.req.param("groupId");
    const members = await listGroupMembers(db, groupId, user.id);
    if (!members) {
      return c.json(
        errorBody("NOT_FOUND", "Group not found.", c.get("requestId")),
        404,
      );
    }
    return c.json({ members });
  });

  groups.post("/groups/:groupId/members", async (c) => {
    const user = await requireSession(c, db);
    if (user instanceof Response) return user;
    const groupId = c.req.param("groupId");
    if (!(await isGroupMember(db, groupId, user.id))) {
      return c.json(
        errorBody("NOT_FOUND", "Group not found.", c.get("requestId")),
        404,
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

    const result = await addGroupMembers(
      db,
      groupId,
      { id: user.id, email: user.email },
      body as { memberEmails?: unknown },
    );
    if (!result.ok) {
      return c.json(
        errorBody(
          "VALIDATION_FAILED",
          "A member email could not be added.",
          c.get("requestId"),
          { field: "memberEmails" },
        ),
        422,
      );
    }
    return c.json(result.group, 201);
  });

  registerExpenseRoutes(groups, db);

  return groups;
}
