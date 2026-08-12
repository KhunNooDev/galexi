'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BookOpenCheck,
  BriefcaseBusiness,
  CircleAlert,
  Map,
  MessageCircle,
  Rocket,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

import { saveLearningGoal, saveLearningLevel } from '@/app/learn/start/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { LEARNING_GOAL, LEARNING_LEVEL } from '@/features/learning/learning.constants';
import { cn } from '@/lib/utils';

type LearningChoiceFormProps = {
  initialValue: string | null;
  type: 'goal' | 'level';
};

const goalOptions = [
  {
    descriptionKey: 'goal.options.daily_conversation.description',
    icon: MessageCircle,
    titleKey: 'goal.options.daily_conversation.title',
    value: LEARNING_GOAL.DAILY_CONVERSATION,
  },
  {
    descriptionKey: 'goal.options.travel.description',
    icon: Map,
    titleKey: 'goal.options.travel.title',
    value: LEARNING_GOAL.TRAVEL,
  },
  {
    descriptionKey: 'goal.options.work.description',
    icon: BriefcaseBusiness,
    titleKey: 'goal.options.work.title',
    value: LEARNING_GOAL.WORK,
  },
  {
    descriptionKey: 'goal.options.school_exam.description',
    icon: BookOpenCheck,
    titleKey: 'goal.options.school_exam.title',
    value: LEARNING_GOAL.SCHOOL_EXAM,
  },
] as const;

const levelOptions = [
  {
    descriptionKey: 'level.options.starter.description',
    icon: Sparkles,
    titleKey: 'level.options.starter.title',
    value: LEARNING_LEVEL.STARTER,
  },
  {
    descriptionKey: 'level.options.beginner.description',
    icon: Rocket,
    titleKey: 'level.options.beginner.title',
    value: LEARNING_LEVEL.BEGINNER,
  },
  {
    descriptionKey: 'level.options.intermediate.description',
    icon: TrendingUp,
    titleKey: 'level.options.intermediate.title',
    value: LEARNING_LEVEL.INTERMEDIATE,
  },
  {
    descriptionKey: 'level.options.advanced.description',
    icon: BookOpenCheck,
    titleKey: 'level.options.advanced.title',
    value: LEARNING_LEVEL.ADVANCED,
  },
] as const;

export function LearningChoiceForm({ initialValue, type }: LearningChoiceFormProps) {
  const t = useTranslations('learning');
  const [selected, setSelected] = useState(initialValue);
  const action = type === 'goal' ? saveLearningGoal : saveLearningLevel;
  const [state, formAction, pending] = useActionState(action, {});
  const options = type === 'goal' ? goalOptions : levelOptions;

  return (
    <form className='mt-7 space-y-4'>
      <fieldset disabled={pending} className='grid gap-3 sm:grid-cols-2'>
        <legend className='sr-only'>{t(`${type}.legend`)}</legend>
        {options.map(({ descriptionKey, icon: Icon, titleKey, value }) => {
          const active = selected === value;

          return (
            <Button
              key={value}
              aria-pressed={active}
              className={cn(
                'h-auto min-h-20 cursor-pointer justify-start rounded-2xl border p-4 text-left whitespace-normal shadow-none',
                active
                  ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/20 hover:bg-primary/14'
                  : 'border-border bg-field text-foreground hover:border-primary/45 hover:bg-secondary-hover',
              )}
              formAction={formAction}
              name={type}
              onClick={() => setSelected(value)}
              type='submit'
              value={value}
              variant='outline'
            >
              <span
                className={cn(
                  'grid size-10 shrink-0 place-items-center rounded-xl',
                  active ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary',
                )}
              >
                <Icon aria-hidden='true' className='size-5' />
              </span>
              <span className='min-w-0'>
                <span className='block font-semibold'>{t(titleKey)}</span>
                <span className='mt-1 block text-sm leading-5 font-normal text-muted-foreground'>
                  {t(descriptionKey)}
                </span>
              </span>
            </Button>
          );
        })}
      </fieldset>
      {pending && (
        <p aria-live='polite' className='text-center text-sm text-muted-foreground'>
          {t('saving')}
        </p>
      )}
      {state.error && (
        <Alert className='border-danger/30 bg-danger/10 text-danger' role='alert'>
          <CircleAlert aria-hidden='true' />
          <AlertDescription className='text-danger'>{state.error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
