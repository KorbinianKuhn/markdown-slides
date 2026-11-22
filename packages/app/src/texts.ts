/**
 * Texts of the app in the language of the page. The CLI writes them into
 * the page (window.slidesTexts, see packages/cli/src/texts.ts); English is
 * the fallback, e.g. for pages built by an older version.
 */
interface AppTexts {
  copied: string;
  copyFailed: string;
  codeRegion: string;
}

const english: AppTexts = {
  copied: 'Copied to clipboard',
  copyFailed: 'Copying failed, select the code instead',
  codeRegion: 'Code example, scrollable',
};

export const texts: AppTexts = {
  ...english,
  ...(window as Window & { slidesTexts?: Partial<AppTexts> }).slidesTexts,
};
