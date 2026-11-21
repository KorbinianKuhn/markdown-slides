import { expect, test } from '@playwright/test';
import { spawnSync } from 'child_process';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { outputDir } from './decks';

// Invalid input must stop the build with a readable message.
const build = (name: string, slide: string) => {
  const input = join(outputDir, 'errors', name);
  rmSync(input, { recursive: true, force: true });
  mkdirSync(input, { recursive: true });
  writeFileSync(join(input, 'README.md'), `# Title\n\n<!-- slide -->\n\n${slide}\n`);
  return spawnSync('node', ['dist/cli.js', '-i', input, '-o', `${input}-out`], {
    encoding: 'utf8',
  });
};

const cases: Array<{ name: string; slide: string; error: string }> = [
  {
    name: 'missing-row-end',
    slide: '<!-- row -->\n<!-- col -->\n\nText\n\n<!-- col:end -->',
    error: 'slide 2: Missing <!-- row:end -->.',
  },
  {
    name: 'missing-col-end',
    slide: '<!-- row -->\n<!-- col -->\n\nText\n\n<!-- row:end -->',
    error: 'slide 2: Missing <!-- col:end -->.',
  },
  {
    name: 'image-invalid-width',
    slide: '![Alt](a.png){width=big}',
    error: 'slide 2: Invalid image width "big"',
  },
  {
    name: 'image-unknown-attribute',
    slide: '![Alt](a.png){height=50%}',
    error: 'slide 2: Unknown image attribute "height"',
  },
  {
    name: 'image-invalid-align',
    slide: '![Alt](a.png){align=top}',
    error: 'slide 2: Invalid image alignment "top"',
  },
];

for (const { name, slide, error } of cases) {
  test(name, () => {
    const result = build(name, slide);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(error);
  });
}

test('valid input builds', () => {
  const result = build(
    'valid',
    '<!-- row -->\n<!-- col -->\n\nUses `code`\n\n![Alt](a.png){width=50% align=left}\n\n<!-- col:end -->\n<!-- row:end -->'
  );
  expect(result.stderr).toBe('');
  expect(result.status).toBe(0);
});
