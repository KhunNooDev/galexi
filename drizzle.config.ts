import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { z } from 'zod';

import {
  formatEnvironmentIssues,
  postgresConnectionStringSchema,
} from './src/config/env.validation';

config({ path: ['.env.local', '.env'] });

const result = z
  .object({ DIRECT_URL: postgresConnectionStringSchema })
  .safeParse({ DIRECT_URL: process.env.DIRECT_URL });

if (!result.success) {
  throw new Error(
    `Invalid Drizzle environment configuration: ${formatEnvironmentIssues(result.error)}`,
  );
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  strict: true,
  verbose: true,
  dbCredentials: { url: result.data.DIRECT_URL },
});
