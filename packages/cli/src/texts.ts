/**
 * Texts of the slides in each language of --language: visible texts and
 * labels for screen readers. The `app` texts are used by the slides app in
 * the browser.
 */
export interface Texts {
  menu: string;
  closeMenu: string;
  openTableOfContents: string;
  fullscreen: string;
  fullscreenLabel: string;
  version: string;
  pdf: string;
  pdfLabel: string;
  theme: string;
  themeAuto: string;
  themeAutoTitle: string;
  themeLight: string;
  themeDark: string;
  page: string;
  pageOf: string;
  copy: string;
  copyLabel: string;
  videoNotPrinted: string;
  videoDescription: string;
  videoLink: string;
  alerts: Record<'note' | 'tip' | 'important' | 'warning' | 'caution', string>;
  footnote: string;
  footnoteBack: string;
  footnoteReference: string;
  app: {
    copied: string;
    copyFailed: string;
    codeRegion: string;
  };
}

const en: Texts = {
  menu: 'Main menu and table of contents',
  closeMenu: 'Close menu',
  openTableOfContents: 'open table of contents',
  fullscreen: 'Fullscreen',
  fullscreenLabel: 'Show page in fullscreen mode',
  version: 'Version:',
  pdf: 'PDF',
  pdfLabel: 'Show PDF version of the page',
  theme: 'Theme:',
  themeAuto: 'Auto',
  themeAutoTitle: 'Use the operating system setting',
  themeLight: 'Light',
  themeDark: 'Dark',
  page: 'Page',
  pageOf: 'of',
  copy: 'Copy',
  copyLabel: 'Copy code example to clipboard',
  videoNotPrinted: "Videos can't be printed.",
  videoDescription: 'Description:',
  videoLink: 'Link:',
  alerts: {
    note: 'Note',
    tip: 'Tip',
    important: 'Important',
    warning: 'Warning',
    caution: 'Caution',
  },
  footnote: 'Footnote',
  footnoteBack: 'Back to the text of footnote',
  footnoteReference: 'reference',
  app: {
    copied: 'Copied to clipboard',
    copyFailed: 'Copying failed, select the code instead',
    codeRegion: 'Code example, scrollable',
  },
};

const de: Texts = {
  menu: 'Hauptmenü und Inhaltsverzeichnis',
  closeMenu: 'Menü schließen',
  openTableOfContents: 'Inhaltsverzeichnis öffnen',
  fullscreen: 'Vollbild',
  fullscreenLabel: 'Seite im Vollbild anzeigen',
  version: 'Version:',
  pdf: 'PDF',
  pdfLabel: 'PDF-Version der Seite anzeigen',
  theme: 'Design:',
  themeAuto: 'Auto',
  themeAutoTitle: 'Einstellung des Betriebssystems verwenden',
  themeLight: 'Hell',
  themeDark: 'Dunkel',
  page: 'Seite',
  pageOf: 'von',
  copy: 'Kopieren',
  copyLabel: 'Codebeispiel in die Zwischenablage kopieren',
  videoNotPrinted: 'Videos können nicht gedruckt werden.',
  videoDescription: 'Beschreibung:',
  videoLink: 'Link:',
  alerts: {
    note: 'Hinweis',
    tip: 'Tipp',
    important: 'Wichtig',
    warning: 'Warnung',
    caution: 'Vorsicht',
  },
  footnote: 'Fußnote',
  footnoteBack: 'Zurück zum Text von Fußnote',
  footnoteReference: 'Verweis',
  app: {
    copied: 'In die Zwischenablage kopiert',
    copyFailed: 'Kopieren fehlgeschlagen, bitte den Code markieren',
    codeRegion: 'Codebeispiel, scrollbar',
  },
};

export const texts: Record<string, Texts> = { en, de };

export const getTexts = (language: string): Texts => texts[language] ?? en;
