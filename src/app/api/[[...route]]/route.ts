import { api } from '@/server/api';

export const runtime = 'nodejs';

const handler = api.fetch;

export { handler as DELETE, handler as GET, handler as PATCH, handler as POST };
