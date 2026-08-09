import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '@/db/schema';

type PostgresClient = ReturnType<typeof postgres>;

const globalForDatabase = globalThis as typeof globalThis & {
  galexiPostgresClient?: PostgresClient;
};

function createDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const databaseClient =
    globalForDatabase.galexiPostgresClient ??
    postgres(connectionString, {
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
