import type { AuthConfig } from "./auth.ts";
import type { Database } from "./db/client.ts";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  profileCompletedAt: Date | null;
};

export type AppEnv = {
  Variables: {
    db: Database;
    auth: AuthConfig;
    user?: SessionUser;
  };
};
