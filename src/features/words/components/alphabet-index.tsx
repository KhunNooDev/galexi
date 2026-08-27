'use client';

import { type PointerEvent, useEffect, useRef, useState } from 'react';

import { ALPHABET } from '@/constants/alphabet';
import { cn } from '@/lib/utils';

type AlphabetIndexProps = {
  availableLetters: string[];
  label: string;
};

export function AlphabetIndex({ availableLetters, label }: AlphabetIndexProps) {
  const [activeLetter, setActiveLetter] = useState(availableLetters[0] ?? 'A');
  const indexRef = useRef<HTMLElement>(null);
  const draggingPointerId = useRef<number | null>(null);
  const available = new Set(availableLetters);

  useEffect(() => {
    function updateActiveLetter() {
      const lastLetter = availableLetters.at(-1);

      if (
        lastLetter &&
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
      ) {
        setActiveLetter(lastLetter);
        return;
      }

      const activationLine = Math.min(240, window.innerHeight * 0.32);
      let nextLetter = availableLetters[0] ?? 'A';

      for (const letter of availableLetters) {
        const section = document.getElementById(`letter-${letter}`);

        if (section && section.getBoundingClientRect().top <= activationLine) {
          nextLetter = letter;
        }
      }

      setActiveLetter(nextLetter);
    }

    updateActiveLetter();
    window.addEventListener('scroll', updateActiveLetter, { passive: true });

    return () => window.removeEventListener('scroll', updateActiveLetter);
  }, [availableLetters]);

  function jumpTo(letter: string, behavior?: ScrollBehavior) {
    const section = document.getElementById(`letter-${letter}`);

    if (!section) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.scrollIntoView({
      behavior: behavior ?? (reduceMotion ? 'auto' : 'smooth'),
      block: 'start',
    });
    setActiveLetter(letter);
  }

  function getLetterAt(clientY: number) {
    const index = indexRef.current;

    if (!index || availableLetters.length === 0) return null;

    const rect = index.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const targetIndex = Math.round(position * (ALPHABET.length - 1));

    return availableLetters.reduce((closest, letter) => {
      const distance = Math.abs(ALPHABET.indexOf(letter) - targetIndex);
      const closestDistance = Math.abs(ALPHABET.indexOf(closest) - targetIndex);
      return distance < closestDistance ? letter : closest;
    });
  }

  function selectLetterAt(clientY: number) {
    const letter = getLetterAt(clientY);

    if (letter && letter !== activeLetter) jumpTo(letter, 'auto');
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (availableLetters.length === 0) return;

    event.preventDefault();
    draggingPointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    selectLetterAt(event.clientY);
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (draggingPointerId.current !== event.pointerId) return;
    selectLetterAt(event.clientY);
  }

  function stopDragging(event: PointerEvent<HTMLElement>) {
    if (draggingPointerId.current !== event.pointerId) return;
    draggingPointerId.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <nav
      ref={indexRef}
      aria-label={label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      className='fixed top-[13.75rem] right-1 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex max-h-[36rem] cursor-ns-resize touch-none flex-col items-center justify-between rounded-full border border-border bg-surface/88 py-1 shadow-[0_12px_34px_rgb(25_65_150/10%)] backdrop-blur-xl select-none sm:right-8 lg:right-[max(2rem,calc((100vw-64rem)/2))]'
    >
      {ALPHABET.map((letter) => {
        const isAvailable = available.has(letter);
        const isActive = activeLetter === letter;

        return (
          <button
            key={letter}
            type='button'
            disabled={!isAvailable}
            aria-label={letter}
            aria-current={isActive ? 'true' : undefined}
            onClick={() => jumpTo(letter)}
            className={cn(
              'grid min-h-3.5 w-7 flex-1 cursor-pointer place-items-center rounded-full text-[0.6rem] leading-none font-semibold text-muted-foreground transition-colors focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none disabled:pointer-events-none disabled:cursor-default disabled:opacity-30',
              isAvailable && 'hover:bg-primary/10 hover:text-primary',
              isActive &&
                'bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground',
            )}
          >
            {letter}
          </button>
        );
      })}
    </nav>
  );
}
