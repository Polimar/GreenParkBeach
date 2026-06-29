import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let sqlClient: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (!sqlClient) {
    const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
    if (!url) throw new Error("Database URL non configurato");
    sqlClient = neon(url);
  }
  return sqlClient;
}

export async function isDbConfigured(): Promise<boolean> {
  return Boolean(process.env.POSTGRES_URL ?? process.env.DATABASE_URL);
}
