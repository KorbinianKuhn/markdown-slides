import { expect, test } from '@playwright/test';
import { spawnSync } from 'child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { outputDir } from './decks';

// Build messages: invalid input must stop the build with a readable message,
// questionable input must build with a warning.
const build = (name: string, slide: string) => {
  const input = join(outputDir, 'cli', name);
  rmSync(input, { recursive: true, force: true });
  mkdirSync(input, { recursive: true });
  writeFileSync(
    join(input, 'README.md'),
    `# Title\n\n<!-- slide -->\n\n${slide}\n`,
  );
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
  {
    name: 'spacer-invalid-size',
    slide: 'Text\n\n:spacer{size=huge}',
    error: 'slide 2: Invalid spacer size "huge", expected sm, md, lg or xl.',
  },
  {
    name: 'spacer-invalid-attribute',
    slide: 'Text\n\n:spacer{height=lg}',
    error: 'slide 2: Invalid spacer ":spacer{height=lg}"',
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
    '<!-- row -->\n<!-- col -->\n\nUses `code`\n\n![Alt](a.png){width=50% align=left}\n\n<!-- col:end -->\n<!-- row:end -->',
  );
  expect(result.stderr).toBe('');
  expect(result.status).toBe(0);
});

test('spacer syntaxes', () => {
  const result = build(
    'spacer',
    'A\n\n:spacer\n\nB\n\n:spacer{size=xl}\n\nC\n\n:spacer[sm]\n\nD',
  );
  expect(result.status).toBe(0);
  const html = readFileSync(
    join(outputDir, 'cli', 'spacer-out', 'index.html'),
    'utf8',
  );
  expect(html).toContain('<div class="spacer md"></div>');
  expect(html).toContain('<div class="spacer xl"></div>');
  expect(html).toContain('<div class="spacer sm"></div>');
  expect(html).not.toContain(':spacer');
});

test('image without alt text builds with a warning', () => {
  const result = build('missing-alt', '![](a.png)\n\n![](b.png){width=50%}');
  expect(result.status).toBe(0);
  expect(result.stderr).toContain(
    '[warn] README.md slide 2: Image without alt text (a.png).',
  );
  expect(result.stderr).toContain('Image without alt text (b.png).');
});
