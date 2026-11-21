import { expect, test } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { decks, outputDir } from './decks';

for (const deck of decks) {
  for (const page of deck.pages) {
    test(`${deck.name}/${page}`, () => {
      const html = readFileSync(join(outputDir, deck.name, page), 'utf8');
      expect(html).toMatchSnapshot(`${deck.name}-${page}`);
    });
  }
}
