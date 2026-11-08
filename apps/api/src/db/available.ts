import postgres from "postgres";

export const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://spendwise:spendwise@localhost:5432/spendwise";

export async function postgresAvailable(url = DATABASE_URL): Promise<boolean> {
  const sql = postgres(url, { connect_timeout: 2, max: 1 });
  try {
    await sql`select 1`;
    return true;
  } catch {
    return false;
  } finally {
    await sql.end({ timeout: 1 });
  }
}
