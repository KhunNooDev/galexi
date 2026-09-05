import { NextResponse } from 'next/server';

import { AUTH_ROUTES, getSafeAuthReturnTo, ROUTES } from '@/constants/routes';
import { establishPermanentAccount } from '@/features/learning/account/server/account-membership.service';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const returnTo = getSafeAuthReturnTo(url.searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data, error: userError } = await supabase.auth.getUser();

      if (!userError && data.user && !data.user.is_anonymous) {
        await establishPermanentAccount(data.user);
        return NextResponse.redirect(new URL(returnTo ?? ROUTES.LEARN_HOME, url.origin));
      }
    }
  }

  return NextResponse.redirect(new URL(AUTH_ROUTES.SIGN_IN, url.origin));
}
