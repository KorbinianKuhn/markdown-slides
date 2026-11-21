import { expect, test } from '@playwright/test';
import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
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
    // A hang (e.g. an endless loop in the parser) fails the test
    timeout: 10_000,
  });
};

const output = (name: string) =>
  readFileSync(join(outputDir, 'cli', `${name}-out`, 'index.html'), 'utf8');

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

test('alt text is escaped once', () => {
  const result = build('alt-escaping', '![Tom & Jerry <3](a.png)');
  expect(result.status).toBe(0);
  const html = readFileSync(
    join(outputDir, 'cli', 'alt-escaping-out', 'index.html'),
    'utf8',
  );
  expect(html).toContain('alt="Tom &amp; Jerry &lt;3"');
});

test('a lone backtick builds', () => {
  const result = build(
    'lone-backtick',
    'Use ` for inline code\n\n<!-- slide -->\n\nNext',
  );
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(output('lone-backtick')).toContain('id="slide-2"');
});

test('a four-backtick fence keeps the inner fence', () => {
  const result = build(
    'four-backticks',
    '````md\n```js\nconst a = 1;\n```\n````',
  );
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(output('four-backticks')).toContain('```js');
});

test('a slide marker inside code does not split the slide', () => {
  const result = build('marker-in-code', '~~~md\n<!-- slide -->\n~~~');
  expect(result.status).toBe(0);
  const html = output('marker-in-code');
  expect(html).toContain('&lt;!-- slide --&gt;');
  expect(html).not.toContain('id="slide-2"');
});

test('comments are removed', () => {
  const result = build('comments', 'Text <!-- inline -->\n\n<!-- note -->');
  expect(result.status).toBe(0);
  const html = output('comments');
  expect(html).not.toContain('inline');
  expect(html).not.toContain('note');
});

test('a misplaced slide marker builds with a warning', () => {
  const result = build('misplaced-marker', '- Item\n  <!-- slide -->');
  expect(result.status).toBe(0);
  expect(result.stderr).toContain('<!-- slide --> is ignored');
});

/** Runs the CLI with a README.md in a sandbox directory as cwd. */
const run = (
  name: string,
  readme: string,
  args: string[],
  dirs: string[] = [],
) => {
  const cwd = join(outputDir, 'cli', name);
  rmSync(cwd, { recursive: true, force: true });
  mkdirSync(cwd, { recursive: true });
  writeFileSync(join(cwd, 'README.md'), readme);
  for (const dir of dirs) {
    mkdirSync(join(cwd, dir), { recursive: true });
    writeFileSync(join(cwd, dir, 'README.md'), readme);
  }
  const result = spawnSync('node', [resolve('dist/cli.js'), ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 10_000,
  });
  const html = (dir = 'public') => {
    const file = join(cwd, dir, 'index.html');
    return existsSync(file) ? readFileSync(file, 'utf8') : '';
  };
  return { ...result, cwd, html };
};

test('--toc-numbering false removes the numbers', () => {
  const readme = '# Title\n\n<!-- slide -->\n\n## Intro\n';
  expect(run('toc-on', readme, []).html()).toContain('>1 Intro</h2>');
  const off = run('toc-off', readme, ['--toc-numbering', 'false']);
  expect(off.status).toBe(0);
  expect(off.html()).toContain('>Intro</h2>');
  const invalid = run('toc-invalid', readme, ['--toc-numbering', 'no']);
  expect(invalid.status).toBe(2);
  expect(invalid.stderr).toContain("invalid boolean value: 'no'");
});

test('--help prints only the help', () => {
  const result = run('help', '# Title\n', ['--help']);
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('usage:');
  expect(result.stdout).not.toContain('Start');
});

for (const { name, args, error } of [
  {
    name: 'output-is-cwd',
    args: ['-o', '.'],
    error: "the output directory can't be the current directory",
  },
  {
    name: 'output-outside-cwd',
    args: ['-o', '../outside'],
    error: 'must be part of the current directory',
  },
  {
    // The old check only compared the start of the path
    name: 'input-in-sibling',
    args: ['-i', '../input-in-sibling-other'],
    error: 'must be part of the current directory',
  },
  {
    name: 'output-contains-input',
    args: ['-i', 'out/slides', '-o', 'out'],
    error: "The output directory can't be or contain the input directory",
  },
]) {
  test(`refuses unsafe directories: ${name}`, () => {
    mkdirSync(join(outputDir, 'cli', 'input-in-sibling-other'), {
      recursive: true,
    });
    writeFileSync(
      join(outputDir, 'cli', 'input-in-sibling-other', 'README.md'),
      '# Title\n',
    );
    const result = run(name, '# Title\n', args, ['out/slides']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(error);
    // Nothing was deleted
    expect(existsSync(join(result.cwd, 'README.md'))).toBe(true);
  });
}

for (const { name, readme, title } of [
  {
    name: 'title-setext',
    readme: 'My Lecture\n==========\n',
    title: 'My Lecture',
  },
  {
    name: 'title-after-code',
    readme: '```md\n# Not the title\n```\n\n# My Lecture\n',
    title: 'My Lecture',
  },
  {
    name: 'title-markdown',
    readme: '# Intro to `git` #\n',
    title: 'Intro to git',
  },
]) {
  test(`detects the lecture title: ${name}`, () => {
    const result = run(name, readme, []);
    expect(result.status).toBe(0);
    expect(result.html()).toContain(`<title>${title}</title>`);
  });
}
