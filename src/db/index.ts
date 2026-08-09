import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { serverEnv } from '@/config/env.server';
import * as schema from '@/db/schema';

type PostgresClient = ReturnType<typeof postgres>;

const globalForDatabase = globalThis as typeof globalThis & {
  galexiPostgresClient?: PostgresClient;
};

function createDatabase() {
  const databaseClient =
    globalForDatabase.galexiPostgresClient ??
    postgres(serverEnv.databaseUrl, {
      // Concurrent Server Components must not queue behind an abandoned dev/HMR request.
      max: 5,
      prepare: false,
    });

  if (process.env.NODE_ENV !== 'production') {
    globalForDatabase.galexiPostgresClient = databaseClient;
  }

  return drizzle(databaseClient, { schema });
}

let database: ReturnType<typeof createDatabase> | undefined;

export function getDatabase() {
  database ??= createDatabase();
  return database;
}
