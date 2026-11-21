import { execFileSync } from 'child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { decks, outputDir } from './decks';

// The build date is rendered into every deck. Pin it so snapshots stay stable.
const FIXED_DATE = '01.01.2000';

export default function globalSetup() {
  execFileSync('node', ['build.js'], { stdio: 'inherit' });

  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });
  for (const deck of decks) {
    const out = join(outputDir, deck.name);
    execFileSync(
      'node',
      ['dist/cli.js', '-i', deck.input, '-o', out, ...deck.args],
      { stdio: 'pipe' }
    );

    for (const file of readdirSync(out).filter((f) => f.endsWith('.html'))) {
      const path = join(out, file);
      const html = readFileSync(path, 'utf8').replace(
        /<span>\d{2}\.\d{2}\.\d{4}<\/span>/g,
        `<span>${FIXED_DATE}</span>`
      );
      writeFileSync(path, html);
    }
  }
}
