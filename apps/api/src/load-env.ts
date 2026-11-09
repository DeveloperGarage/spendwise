import { loadEnvFile } from "node:process";

try {
  loadEnvFile(new URL("../.env", import.meta.url));
} catch {
  // Local .env is optional; process env and defaults still apply.
}
