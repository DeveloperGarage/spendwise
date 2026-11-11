import { createHash, randomBytes } from "node:crypto";

import { eq, sql } from "drizzle-orm";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

import type { Database } from "./db/client.ts";
import { allowedEmails, sessions, users } from "./db/schema.ts";

export const SESSION_COOKIE = "sw_session";
export const PKCE_COOKIE = "sw_oauth_verifier";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type GoogleIdentity = {
  email: string;
  displayName: string;
};

export type ExchangeGoogleInput = {
  code?: string;
  verifier?: string;
  idToken?: string;
};

export type AuthConfig = {
  appOrigin: string;
  publicApiUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  cookieSecure: boolean;
  devAuthBypass: boolean;
  exchangeGoogle: (input: ExchangeGoogleInput) => Promise<GoogleIdentity>;
};

export type AuthOptions = Partial<Omit<AuthConfig, "exchangeGoogle">> & {
  exchangeGoogle?: AuthConfig["exchangeGoogle"];
};

export type MeUser = {
  id: string;
  displayName: string;
  email: string;
  profileCompleted: boolean;
};

export function authFromEnv(overrides: AuthOptions = {}): AuthConfig {
  const supabaseUrl = overrides.supabaseUrl ?? process.env.SUPABASE_URL ?? "";
  const supabaseAnonKey = overrides.supabaseAnonKey ?? process.env.SUPABASE_ANON_KEY ?? "";
  return {
    appOrigin: overrides.appOrigin ?? process.env.APP_ORIGIN ?? "http://localhost:8081",
    publicApiUrl: overrides.publicApiUrl ?? process.env.PUBLIC_API_URL ?? "http://localhost:3000",
    supabaseUrl,
    supabaseAnonKey,
    cookieSecure: overrides.cookieSecure ?? process.env.COOKIE_SECURE === "true",
    // Never allow the dev login bypass in production, even if the flag is set.
    devAuthBypass:
      overrides.devAuthBypass ??
      (process.env.DEV_AUTH_BYPASS === "true" && process.env.NODE_ENV !== "production"),
    exchangeGoogle:
      overrides.exchangeGoogle ??
      ((input) => exchangeWithSupabase(supabaseUrl, supabaseAnonKey, input)),
  };
}

export function cookieOptions(secure: boolean, maxAge: number) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "Lax" as const,
    secure,
    maxAge,
  };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken() {
  return randomBytes(32).toString("hex");
}

export function pkceVerifier() {
  return randomBytes(32).toString("base64url");
}

export function pkceChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function googleAuthorizeUrl(config: AuthConfig, challenge: string) {
  const redirectTo = `${config.publicApiUrl}/auth/callback`;
  const url = new URL(`${config.supabaseUrl.replace(/\/$/, "")}/auth/v1/authorize`);
  url.searchParams.set("provider", "google");
  url.searchParams.set("redirect_to", redirectTo);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "s256");
  return url.toString();
}

export async function exchangeWithSupabase(
  supabaseUrl: string,
  anonKey: string,
  input: ExchangeGoogleInput,
): Promise<GoogleIdentity> {
  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase Auth is not configured");
  }
  const base = supabaseUrl.replace(/\/$/, "");
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  };

  let response: Response;
  if (input.idToken) {
    response = await fetch(`${base}/auth/v1/token?grant_type=id_token`, {
      method: "POST",
      headers,
      body: JSON.stringify({ provider: "google", id_token: input.idToken }),
    });
  } else if (input.code && input.verifier) {
    response = await fetch(`${base}/auth/v1/token?grant_type=pkce`, {
      method: "POST",
      headers,
      body: JSON.stringify({ auth_code: input.code, code_verifier: input.verifier }),
    });
  } else {
    throw new Error("Missing Google credentials");
  }

  if (!response.ok) {
    throw new Error("Google sign-in failed");
  }
  const body = (await response.json()) as {
    user?: { email?: string; user_metadata?: { full_name?: string; name?: string } };
  };
  const email = body.user?.email?.trim().toLowerCase();
  if (!email) {
    throw new Error("Google did not return an email");
  }
  const displayName =
    body.user?.user_metadata?.full_name?.trim() ||
    body.user?.user_metadata?.name?.trim() ||
    email.split("@")[0] ||
    "Member";
  return { email, displayName };
}

export function toMeUser(row: {
  id: string;
  displayName: string;
  email: string;
  profileCompletedAt: Date | null;
}): MeUser {
  return {
    id: row.id,
    displayName: row.displayName,
    email: row.email,
    profileCompleted: row.profileCompletedAt !== null,
  };
}

export async function findAllowedEmail(db: Database, email: string) {
  const normalized = email.trim().toLowerCase();
  const [row] = await db
    .select()
    .from(allowedEmails)
    .where(sql`lower(${allowedEmails.email}) = ${normalized}`);
  return row;
}

export async function upsertUserFromGoogle(
  db: Database,
  identity: GoogleIdentity,
  suggestedDisplayName?: string | null,
) {
  const email = identity.email.trim().toLowerCase();
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    return existing;
  }
  const displayName = identity.displayName.trim() || suggestedDisplayName?.trim() || email.split("@")[0] || "Member";
  const [created] = await db
    .insert(users)
    .values({
      id: `usr_${randomBytes(8).toString("hex")}`,
      email,
      displayName,
    })
    .returning();
  return created;
}

export async function createSession(db: Database, userId: string) {
  const token = newToken();
  const now = new Date();
  await db.insert(sessions).values({
    id: hashToken(token),
    userId,
    createdAt: now,
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
  });
  return token;
}

export async function userFromSessionCookie(db: Database, token: string | undefined) {
  if (!token) return null;
  const [row] = await db.select().from(sessions).where(eq(sessions.id, hashToken(token)));
  if (!row || row.expiresAt.getTime() <= Date.now()) {
    return null;
  }
  const [user] = await db.select().from(users).where(eq(users.id, row.userId));
  return user ?? null;
}

export function setSessionCookie(c: Context, token: string, secure: boolean) {
  setCookie(c, SESSION_COOKIE, token, cookieOptions(secure, SESSION_TTL_MS / 1000));
}

export function clearSessionCookie(c: Context, secure: boolean) {
  deleteCookie(c, SESSION_COOKIE, { path: "/", secure });
}

export function setPkceCookie(c: Context, verifier: string, secure: boolean) {
  setCookie(c, PKCE_COOKIE, verifier, cookieOptions(secure, 10 * 60));
}

export function readPkceCookie(c: Context) {
  return getCookie(c, PKCE_COOKIE);
}

export function clearPkceCookie(c: Context, secure: boolean) {
  deleteCookie(c, PKCE_COOKIE, { path: "/", secure });
}

export function afterLoginPath(profileCompleted: boolean) {
  return profileCompleted ? "/dashboard" : "/profile";
}
