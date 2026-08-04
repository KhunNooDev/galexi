'use client';

import { useActionState } from 'react';
import { CircleCheck, Save } from 'lucide-react';

import { type ProfileFormState, saveProfile } from '@/app/profile/actions';
import {
  Field,
  FieldFeedback,
  FieldLabel,
  getFieldDescriptionId,
  inputBaseClassName,
  inputVariantClassNames,
} from '@/components/form/field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PROFILE_LIMITS } from '@/constants/profile';
import { cn } from '@/lib/utils';

type ProfileFormProps = {
  avatarUrl: string;
  displayName: string;
  labels: {
    avatarUrl: string;
    avatarUrlHint: string;
    avatarUrlPlaceholder: string;
    displayName: string;
    displayNameHint: string;
    displayNamePlaceholder: string;
    save: string;
    saving: string;
  };
};

const initialState: ProfileFormState = {};

export function ProfileForm({ avatarUrl, displayName, labels }: ProfileFormProps) {
  const [state, action, pending] = useActionState(saveProfile, initialState);
  const displayNameErrors = state.fieldErrors?.displayName;
  const avatarUrlErrors = state.fieldErrors?.avatarUrl;

  return (
    <form action={action} className='space-y-5' noValidate>
      {state.error && (
        <Alert variant='destructive'>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <Alert className='border-primary/25 bg-primary/8 text-surface-foreground'>
          <CircleCheck aria-hidden='true' className='text-primary' />
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      )}

      <div className='grid gap-5 sm:grid-cols-2'>
        <Field>
          <FieldLabel htmlFor='displayName'>{labels.displayName}</FieldLabel>
          <Input
            id='displayName'
            name='displayName'
            autoComplete='name'
            defaultValue={state.values?.displayName ?? displayName}
            maxLength={PROFILE_LIMITS.DISPLAY_NAME_MAX_LENGTH}
            placeholder={labels.displayNamePlaceholder}
            className={cn(
              inputBaseClassName,
              inputVariantClassNames.default,
              displayNameErrors &&
                'border-danger/70 ring-2 ring-danger/10 focus:border-danger focus:ring-danger/20',
            )}
            aria-invalid={Boolean(displayNameErrors)}
            aria-describedby={getFieldDescriptionId(
              'displayName',
              displayNameErrors,
              labels.displayNameHint,
            )}
          />
          <FieldFeedback
            id='displayName'
            errors={displayNameErrors}
            hint={labels.displayNameHint}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor='avatarUrl'>{labels.avatarUrl}</FieldLabel>
          <Input
            id='avatarUrl'
            name='avatarUrl'
            type='url'
            autoComplete='url'
            defaultValue={state.values?.avatarUrl ?? avatarUrl}
            maxLength={PROFILE_LIMITS.AVATAR_URL_MAX_LENGTH}
            placeholder={labels.avatarUrlPlaceholder}
            className={cn(
              inputBaseClassName,
              inputVariantClassNames.default,
              avatarUrlErrors &&
                'border-danger/70 ring-2 ring-danger/10 focus:border-danger focus:ring-danger/20',
            )}
            aria-invalid={Boolean(avatarUrlErrors)}
            aria-describedby={getFieldDescriptionId(
              'avatarUrl',
              avatarUrlErrors,
              labels.avatarUrlHint,
            )}
          />
          <FieldFeedback id='avatarUrl' errors={avatarUrlErrors} hint={labels.avatarUrlHint} />
        </Field>
      </div>

      <div className='flex justify-end'>
        <Button type='submit' size='lg' className='min-w-32 cursor-pointer' disabled={pending}>
          <Save aria-hidden='true' className='size-4' />
          {pending ? labels.saving : labels.save}
        </Button>
      </div>
    </form>
  );
}
