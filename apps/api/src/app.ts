import { randomUUID } from "node:crypto";

import { eq, sql } from "drizzle-orm";
import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { getCookie } from "hono/cookie";
import { requestId } from "hono/request-id";

import {
  afterLoginPath,
  authFromEnv,
  clearPkceCookie,
  clearSessionCookie,
  createSession,
  findAllowedEmail,
  googleAuthorizeUrl,
  hashToken,
  pkceChallenge,
  pkceVerifier,
  readPkceCookie,
  SESSION_COOKIE,
  setPkceCookie,
  setSessionCookie,
  toMeUser,
  upsertUserFromGoogle,
  userFromSessionCookie,
  type AuthConfig,
  type AuthOptions,
  type GoogleIdentity,
  type MeUser,
} from "./auth.ts";
import type { Database } from "./db/client.ts";
import { sessions, users } from "./db/schema.ts";
import type { AppEnv } from "./app-env.ts";
import { errorBody } from "./errors.ts";
import { mountGroupRoutes } from "./groups/routes.ts";

export type { AppEnv } from "./app-env.ts";

export function createApp(db: Database, authOptions: AuthOptions = {}) {
  const auth = authFromEnv(authOptions);
  const app = new Hono<AppEnv>();

  app.use("*", requestId({ generator: () => randomUUID() }));
  app.use(
    "*",
    cors({
      origin: auth.appOrigin,
      credentials: true,
      allowHeaders: ["Content-Type", "Idempotency-Key"],
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    }),
  );
  app.use("*", async (c, next) => {
    c.set("db", db);
    c.set("auth", auth);
    await next();
  });

  app.onError((err, c) => {
    const requestId = c.get("requestId");
    console.error(
      JSON.stringify({
        requestId,
        method: c.req.method,
        path: c.req.path,
        message: err.message,
        stack: err.stack,
      }),
    );
    return c.json(errorBody("INTERNAL", "Something went wrong.", requestId), 500);
  });

  app.get("/health", async (c) => {
    await db.execute(sql`select 1`);
    return c.json({ ok: true });
  });

  app.get("/auth/google", (c) => {
    if (!auth.supabaseUrl) {
      return c.json(
        errorBody("CONFIG_ERROR", "Supabase Auth is not configured.", c.get("requestId")),
        500,
      );
    }
    const verifier = pkceVerifier();
    setPkceCookie(c, verifier, auth.cookieSecure);
    return c.redirect(googleAuthorizeUrl(auth, pkceChallenge(verifier)), 302);
  });

  app.get("/auth/callback", async (c) => {
    const code = c.req.query("code");
    const verifier = readPkceCookie(c);
    clearPkceCookie(c, auth.cookieSecure);
    if (!code || !verifier) {
      return c.json(
        errorBody("AUTH_FAILED", "Missing OAuth code.", c.get("requestId")),
        400,
      );
    }
    try {
      const identity = await auth.exchangeGoogle({ code, verifier });
      const result = await completeLogin(c, db, auth, identity);
      if (!result.ok) return result.response;
      return c.redirect(`${auth.appOrigin}${afterLoginPath(result.user.profileCompleted)}`, 302);
    } catch {
      return c.json(
        errorBody("AUTH_FAILED", "Google sign-in failed.", c.get("requestId")),
        400,
      );
    }
  });

  if (auth.devAuthBypass) {
    app.get("/auth/dev-login", async (c) => {
      const email = c.req.query("email")?.trim();
      if (!email) {
        return c.json(
          errorBody("VALIDATION_FAILED", "The email is missing.", c.get("requestId"), { field: "email" }),
          422,
        );
      }
      const result = await completeLogin(c, db, auth, { email, displayName: "" });
      if (!result.ok) return result.response;
      return c.redirect(`${auth.appOrigin}${afterLoginPath(result.user.profileCompleted)}`, 302);
    });
  }

  app.post("/auth/sessions", async (c) => {
    let body: { provider?: string; idToken?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        errorBody("VALIDATION_FAILED", "The body is wrong.", c.get("requestId"), { field: "body" }),
        422,
      );
    }
    if (body.provider !== "google" || typeof body.idToken !== "string" || !body.idToken) {
      return c.json(
        errorBody("VALIDATION_FAILED", "The body is wrong.", c.get("requestId"), { field: "idToken" }),
        422,
      );
    }
    try {
      const identity = await auth.exchangeGoogle({ idToken: body.idToken });
      const result = await completeLogin(c, db, auth, identity);
      if (!result.ok) return result.response;
      return c.json({ user: result.user }, 201);
    } catch {
      return c.json(
        errorBody("AUTH_FAILED", "Google sign-in failed.", c.get("requestId")),
        400,
      );
    }
  });

  app.delete("/auth/session", async (c) => {
    const token = getCookie(c, SESSION_COOKIE);
    if (token) {
      await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
    }
    clearSessionCookie(c, auth.cookieSecure);
    return c.body(null, 204);
  });

  app.get("/me", async (c) => {
    const user = await userFromSessionCookie(db, getCookie(c, SESSION_COOKIE));
    if (!user) {
      return c.json(
        errorBody("UNAUTHENTICATED", "Sign in required.", c.get("requestId")),
        401,
      );
    }
    return c.json(toMeUser(user));
  });

  app.patch("/me", async (c) => {
    const user = await userFromSessionCookie(db, getCookie(c, SESSION_COOKIE));
    if (!user) {
      return c.json(
        errorBody("UNAUTHENTICATED", "Sign in required.", c.get("requestId")),
        401,
      );
    }
    let body: { displayName?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        errorBody("VALIDATION_FAILED", "The body is wrong.", c.get("requestId"), { field: "body" }),
        422,
      );
    }
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    if (!displayName || displayName.length > 80) {
      return c.json(
        errorBody("VALIDATION_FAILED", "The body is wrong.", c.get("requestId"), { field: "displayName" }),
        422,
      );
    }
    const [updated] = await db
      .update(users)
      .set({ displayName, profileCompletedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning();
    return c.json(toMeUser(updated));
  });

  app.route("/", mountGroupRoutes(db));

  return app;
}

async function completeLogin(
  c: Context<AppEnv>,
  db: Database,
  auth: AuthConfig,
  identity: GoogleIdentity,
): Promise<{ ok: true; user: MeUser } | { ok: false; response: Response }> {
  const allowed = await findAllowedEmail(db, identity.email);
  if (!allowed) {
    return {
      ok: false,
      response: c.json(
        errorBody("NOT_ALLOWED", "This email is not allowed to sign in.", c.get("requestId")),
        403,
      ),
    };
  }
  const user = await upsertUserFromGoogle(db, identity, allowed.suggestedDisplayName);
  const token = await createSession(db, user.id);
  setSessionCookie(c, token, auth.cookieSecure);
  return { ok: true, user: toMeUser(user) };
}
