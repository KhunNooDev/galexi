'use client';

import { useEffect, useState } from 'react';

import { WORD_IMAGE } from '@/constants/word';
import { wordImagesApi } from '@/features/words/word.api';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

function getImageExtension(file: File) {
  const extension = file.type.split('/')[1]?.toLocaleLowerCase();

  if (extension && WORD_IMAGE.ACCEPTED_TYPES.some((type) => type === file.type)) {
    return extension === 'jpeg' ? 'jpg' : extension;
  }

  throw new Error('Unsupported Word image type');
}

async function uploadWordImage(file: File) {
  const path = `words/${crypto.randomUUID()}.${getImageExtension(file)}`;
  const storage = createSupabaseClient().storage.from(WORD_IMAGE.BUCKET);
  const { error } = await storage.upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return path;
}

export function useWordImageUpload({
  invalidTypeMessage,
  imageTooLargeMessage,
}: {
  invalidTypeMessage: string;
  imageTooLargeMessage: string;
}) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl],
  );

  function clearImage() {
    setSelectedImage(null);
    setPreviewUrl(null);
    setImageError(null);
  }

  function clearImageError() {
    setImageError(null);
  }

  function selectImage(file: File | null) {
    setImageError(null);

    if (!file) {
      setSelectedImage(null);
      setPreviewUrl(null);
      return;
    }

    if (!WORD_IMAGE.ACCEPTED_TYPES.some((type) => type === file.type)) {
      setSelectedImage(null);
      setPreviewUrl(null);
      setImageError(invalidTypeMessage);
      return;
    }

    if (file.size > WORD_IMAGE.MAX_SIZE_BYTES) {
      setSelectedImage(null);
      setPreviewUrl(null);
      setImageError(imageTooLargeMessage);
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function uploadSelectedImage() {
    return selectedImage ? uploadWordImage(selectedImage) : null;
  }

  async function requestCandidateCleanup(path: string) {
    try {
      await wordImagesApi.cleanup(path);
    } catch (error) {
      console.error('Unable to request cleanup for an unused Word image', error);
    }
  }

  return {
    selectedImage,
    previewUrl,
    imageError,
    clearImage,
    clearImageError,
    selectImage,
    uploadSelectedImage,
    requestCandidateCleanup,
  };
}
