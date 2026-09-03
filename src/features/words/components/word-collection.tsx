'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ExternalLink,
  Eye,
  Globe2,
  ImageIcon,
  LockKeyhole,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getManageWordRoute, getPublicWordRoute, getWordImageRoute } from '@/constants/routes';
import type { WordView } from '@/features/words/components/word-pagination';
import type { AdminWord } from '@/features/words/word.api';
import { cn } from '@/lib/utils';

type WordCollectionProps = {
  words: AdminWord[];
  isFiltering: boolean;
  view: WordView;
  deletingId: number | null;
  onEdit: (word: AdminWord) => void;
  onDelete: (word: AdminWord) => void;
};

type WordItemProps = {
  word: AdminWord;
  deleting: boolean;
  onEdit: (word: AdminWord) => void;
  onDelete: (word: AdminWord) => void;
};

function WordActions({ word, deleting, onEdit, onDelete }: WordItemProps) {
  const t = useTranslations();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='cursor-pointer rounded-xl text-muted-foreground hover:bg-secondary-hover hover:text-surface-foreground'
          aria-label={`${t('words.manager.actions')}: ${word.word}`}
        >
          <MoreVertical aria-hidden='true' className='size-5' />
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' sideOffset={6} className='w-56 p-2'>
        <Link
          href={getManageWordRoute(word.id)}
          className='flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-surface-foreground transition-colors hover:bg-secondary-hover'
        >
          <Eye aria-hidden='true' className='size-4 text-muted-foreground' />
          {t('words.manager.openDetails')}
        </Link>
        {word.isPublic && (
          <Link
            href={getPublicWordRoute(word.word)}
            className='flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-surface-foreground transition-colors hover:bg-secondary-hover'
          >
            <Globe2 aria-hidden='true' className='size-4 text-muted-foreground' />
            {t('words.manager.openPublicPage')}
          </Link>
        )}
        {word.imageUrl && (
          <a
            href={getWordImageRoute(word.id)}
            target='_blank'
            rel='noreferrer'
            className='flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-surface-foreground transition-colors hover:bg-secondary-hover'
          >
            <ImageIcon aria-hidden='true' className='size-4 text-muted-foreground' />
            {t('words.manager.openImage')}
            <ExternalLink aria-hidden='true' className='ml-auto size-3.5 text-muted-foreground' />
          </a>
        )}
        <Button
          type='button'
          variant='ghost'
          className='h-10 w-full cursor-pointer justify-start rounded-lg px-3 text-surface-foreground hover:bg-secondary-hover'
          onClick={() => onEdit(word)}
        >
          <Pencil aria-hidden='true' className='size-4 text-muted-foreground' />
          {t('words.manager.edit')}
        </Button>
        <div className='my-1 h-px bg-border' />
        <Button
          type='button'
          variant='ghost'
          className='h-10 w-full cursor-pointer justify-start rounded-lg px-3 text-danger hover:bg-danger/10 hover:text-danger'
          disabled={deleting}
          onClick={() => onDelete(word)}
        >
          <Trash2 aria-hidden='true' className='size-4' />
          {t('words.manager.delete')}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function VisibilityBadge({ word }: { word: AdminWord }) {
  const t = useTranslations();

  return (
    <Badge
      variant='secondary'
      className={cn(
        'w-fit gap-1 px-2.5 py-1',
        word.isPublic ? 'bg-primary/12 text-primary' : 'bg-secondary-hover text-muted-foreground',
      )}
    >
      {word.isPublic ? (
        <Globe2 aria-hidden='true' className='size-3' />
      ) : (
        <LockKeyhole aria-hidden='true' className='size-3' />
      )}
      {word.isPublic ? t('words.manager.publicBadge') : t('words.manager.unpublishedBadge')}
    </Badge>
  );
}

export function WordCollection({
  words,
  isFiltering,
  view,
  deletingId,
  onEdit,
  onDelete,
}: WordCollectionProps) {
  const t = useTranslations();

  if (words.length === 0) {
    return (
      <p className='galexi-empty'>
        {isFiltering ? t('words.manager.noSearchResults') : t('words.manager.empty')}
      </p>
    );
  }

  if (view === 'grid') {
    return (
      <ul className='grid gap-4 lg:grid-cols-2'>
        {words.map((word) => (
          <li
            key={word.id}
            className='group flex min-h-32 rounded-3xl border border-border bg-surface p-4 shadow-[0_16px_45px_rgb(34_74_150/7%)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/8'
          >
            <div className='flex min-w-0 flex-1 flex-col'>
              <div className='flex items-start gap-2'>
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <h3 className='text-lg font-semibold wrap-break-word text-surface-foreground sm:text-xl'>
                      {word.word}
                    </h3>
                    {word.partOfSpeech && (
                      <Badge variant='secondary' className='bg-secondary-hover text-primary'>
                        {word.partOfSpeech}
                      </Badge>
                    )}
                  </div>
                  {(word.pronunciationIpa || word.pronunciationThai) && (
                    <p className='mt-1 text-sm leading-5 text-muted-foreground'>
                      {[word.pronunciationIpa, word.pronunciationThai].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <WordActions
                  word={word}
                  deleting={deletingId === word.id}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>

              <div className='mt-2.5 flex flex-wrap gap-1.5'>
                <VisibilityBadge word={word} />
                {word.meaningsTh.slice(0, 2).map((meaning) => (
                  <Badge key={meaning} className='bg-primary/10 text-primary'>
                    {meaning}
                  </Badge>
                ))}
              </div>

              {word.categories.length > 0 && (
                <p className='mt-auto pt-3 text-xs text-muted-foreground'>
                  {word.categories.map((category) => category.name).join(' · ')}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <ul className='grid gap-3 lg:hidden'>
        {words.map((word) => (
          <li
            key={word.id}
            className='flex items-center gap-2 rounded-2xl border border-border bg-surface p-3 shadow-[0_12px_35px_rgb(34_74_150/6%)]'
          >
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-2'>
                <h3 className='truncate font-semibold text-surface-foreground'>{word.word}</h3>
                {word.partOfSpeech && (
                  <Badge variant='secondary' className='shrink-0 bg-secondary-hover text-primary'>
                    {word.partOfSpeech}
                  </Badge>
                )}
              </div>
              <p className='mt-1 truncate text-sm text-muted-foreground'>
                {word.meaningsTh.join(' · ')}
              </p>
            </div>
            <WordActions
              word={word}
              deleting={deletingId === word.id}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </li>
        ))}
      </ul>

      <div className='hidden overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_18px_50px_rgb(34_74_150/7%)] lg:block'>
        <div className='grid grid-cols-[minmax(14rem,2fr)_minmax(8rem,1fr)_minmax(10rem,1.3fr)_8rem_3rem] items-center gap-4 border-b border-border bg-secondary-hover/45 px-5 py-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase'>
          <span>{t('words.manager.wordLabel')}</span>
          <span>{t('words.manager.partOfSpeechLabel')}</span>
          <span>{t('words.manager.categoriesLabel')}</span>
          <span>{t('words.manager.visibility')}</span>
          <span className='sr-only'>{t('words.manager.actions')}</span>
        </div>
        <ul className='divide-y divide-border'>
          {words.map((word) => (
            <li
              key={word.id}
              className='grid grid-cols-[minmax(14rem,2fr)_minmax(8rem,1fr)_minmax(10rem,1.3fr)_8rem_3rem] items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary-hover/35'
            >
              <div className='min-w-0'>
                <p className='truncate font-semibold text-surface-foreground'>{word.word}</p>
                <p className='mt-0.5 truncate text-xs text-muted-foreground'>
                  {word.meaningsTh.join(' · ')}
                </p>
              </div>
              <span className='truncate text-sm text-surface-foreground'>
                {word.partOfSpeech || '-'}
              </span>
              <span className='truncate text-sm text-muted-foreground'>
                {word.categories.map((category) => category.name).join(', ') || '-'}
              </span>
              <VisibilityBadge word={word} />
              <WordActions
                word={word}
                deleting={deletingId === word.id}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
