import { handle } from 'hono/vercel';

import { api } from '@/server/api';

export const runtime = 'nodejs';

const handler = handle(api);

export {
  handler as DELETE,
  handler as GET,
  handler as OPTIONS,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};
