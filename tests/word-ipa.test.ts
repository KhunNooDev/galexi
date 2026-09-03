import { describe, expect, it } from 'bun:test';

import { getEnglishIpaAutofillValue } from '@/features/words/word-ipa';

describe('English IPA autofill', () => {
  it('generates IPA when the current value is empty', () => {
    expect(getEnglishIpaAutofillValue('train', '', null)).toBe('ˈtɹeɪn');
  });

  it('regenerates when the word changes and the current IPA was generated', () => {
    const lastGeneratedIpa = 'ˈtɹeɪn';

    expect(getEnglishIpaAutofillValue('play', lastGeneratedIpa, lastGeneratedIpa)).toBe('ˈpɫeɪ');
  });

  it('does not overwrite a manually edited IPA after the word changes', () => {
    expect(getEnglishIpaAutofillValue('train', 'pleɪ', 'ˈpɫeɪ')).toBeNull();
  });

  it('preserves an existing IPA when editing a word', () => {
    expect(getEnglishIpaAutofillValue('play', 'pleɪ', null)).toBeNull();
  });

  it('does not generate IPA for an empty word', () => {
    expect(getEnglishIpaAutofillValue('   ', '', null)).toBeNull();
  });

  it('clears a previously generated IPA when the word is cleared', () => {
    const lastGeneratedIpa = 'ˈtɹeɪn';

    expect(getEnglishIpaAutofillValue('', lastGeneratedIpa, lastGeneratedIpa)).toBe('');
  });

  it('preserves a manually edited IPA when the word is cleared', () => {
    expect(getEnglishIpaAutofillValue('', 'manual', 'ˈtɹeɪn')).toBeNull();
  });
});
