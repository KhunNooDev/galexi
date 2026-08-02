'use client';

import { type ComponentProps, useState } from 'react';
import { ImageOff } from 'lucide-react';

import { cn } from '@/lib/utils';

type ImageWithSkeletonProps = Omit<ComponentProps<'img'>, 'src'> & {
  src: string;
};

export function ImageWithSkeleton({
  alt,
  className,
  onError,
  onLoad,
  src,
  ...props
}: ImageWithSkeletonProps) {
  const [imageState, setImageState] = useState<{
    src: string;
    status: 'error' | 'loaded' | 'loading';
  }>({ src, status: 'loading' });
  const status = imageState.src === src ? imageState.status : 'loading';

  return (
    <span className='relative block size-full overflow-hidden' aria-busy={status === 'loading'}>
      {status === 'loading' && (
        <span
          aria-hidden='true'
          className='absolute inset-0 animate-pulse bg-secondary-hover motion-reduce:animate-none'
        >
          <span className='absolute inset-0 bg-linear-to-br from-primary/5 via-primary/12 to-transparent' />
        </span>
      )}

      {status === 'error' && (
        <span
          aria-hidden='true'
          className='absolute inset-0 grid place-items-center bg-secondary-hover text-muted-foreground'
        >
          <ImageOff className='size-6' />
        </span>
      )}

      {/* User-provided and blob URLs cannot be safely allow-listed for next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...props}
        src={src}
        alt={alt}
        className={cn(
          'size-full transition-opacity duration-200',
          status === 'loaded' ? 'opacity-100' : 'opacity-0',
          className,
        )}
        onLoad={(event) => {
          setImageState({ src, status: 'loaded' });
          onLoad?.(event);
        }}
        onError={(event) => {
          setImageState({ src, status: 'error' });
          onError?.(event);
        }}
      />
    </span>
  );
}
