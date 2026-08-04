'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

import { PROFILE_LIMITS } from '@/constants/profile';
import { ROUTES } from '@/constants/routes';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { updateProfile } from '@/server/profiles';

export type ProfileFormState = {
  error?: string;
  fieldErrors?: {
    avatarUrl?: string[];
    displayName?: string[];
  };
  success?: string;
  values?: {
    avatarUrl: string;
    displayName: string;
  };
};

function isHttpUrl(value: string) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function getTextValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === 'string' ? value : '';
}

export async function saveProfile(
  _state: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const [t, userId] = await Promise.all([getTranslations(), getCurrentUserId()]);
  const values = {
    avatarUrl: getTextValue(formData, 'avatarUrl'),
    displayName: getTextValue(formData, 'displayName'),
  };

  if (!userId) {
    return { error: t('profile.validation.unauthorized'), values };
  }

  const schema = z.object({
    displayName: z
      .string()
      .trim()
      .max(
        PROFILE_LIMITS.DISPLAY_NAME_MAX_LENGTH,
        t('profile.validation.displayNameTooLong', {
          maxLength: PROFILE_LIMITS.DISPLAY_NAME_MAX_LENGTH,
        }),
      ),
    avatarUrl: z
      .string()
      .trim()
      .max(
        PROFILE_LIMITS.AVATAR_URL_MAX_LENGTH,
        t('profile.validation.avatarUrlTooLong', {
          maxLength: PROFILE_LIMITS.AVATAR_URL_MAX_LENGTH,
        }),
      )
      .refine(isHttpUrl, t('profile.validation.invalidAvatarUrl')),
  });
  const result = schema.safeParse(values);

  if (!result.success) {
    return {
      fieldErrors: z.flattenError(result.error).fieldErrors,
      values,
    };
  }

  try {
    await updateProfile(userId, result.data);
  } catch (error) {
    console.error('Unable to update profile', error);
    return { error: t('profile.updateError'), values: result.data };
  }

  revalidatePath(ROUTES.PROFILE);

  return { success: t('profile.updateSuccess'), values: result.data };
}
