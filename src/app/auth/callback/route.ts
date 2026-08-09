import { NextResponse } from 'next/server';

import { AUTH_ROUTES, ROUTES } from '@/constants/routes';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(ROUTES.MANAGE_WORDS, url.origin));
    }
  }

  return NextResponse.redirect(new URL(AUTH_ROUTES.SIGN_IN, url.origin));
}
