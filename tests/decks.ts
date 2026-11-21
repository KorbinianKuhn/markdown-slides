/**
 * Decks that are built and compared. Each deck is built once by the global
 * setup into tests/.output/<name>, and every listed page is checked by the
 * HTML snapshot and the screenshot tests.
 */
export interface Deck {
  name: string;
  input: string;
  args: string[];
  pages: string[];
}

export const decks: Deck[] = [
  {
    name: 'features',
    input: 'tests/fixtures/features',
    args: ['--title', 'FF'],
    pages: ['index.html', 'chapter.html', 'images.html'],
  },
  {
    name: 'readme',
    input: '.',
    args: ['--allowed-files', 'README.md'],
    pages: ['index.html'],
  },
  {
    name: 'custom-theme',
    input: 'examples/custom-theme',
    args: ['--institution', 'Custom Institution', '--ignored-files', 'public'],
    pages: ['index.html'],
  },
];

export const outputDir = 'tests/.output';
