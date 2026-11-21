// Builds the CLI and the slides app into dist/ (the published package).
// Run with `npm run build`. Node.js runs this TypeScript file directly (.mts =
// ES module).
import * as esbuild from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import * as sass from 'sass';

await rm('dist', { recursive: true, force: true });
await mkdir('dist');

// Slides app (browser)
await esbuild.build({
  entryPoints: ['packages/app/src/index.ts'],
  outfile: 'dist/app/scripts/slides.js',
  bundle: true,
  platform: 'browser',
});

await cp(
  'node_modules/mermaid/dist/mermaid.min.js',
  'dist/app/scripts/mermaid.min.js',
);
// MathJax with its font, so formulas also render offline (MathJax loads the
// font from a CDN by default, see the config in main.html). The node-* files
// are for server-side use only.
await cp('node_modules/mathjax', 'dist/app/scripts/mathjax', {
  recursive: true,
  filter: (src) => !/[/\\](node-main[^/\\]*|require\.mjs)$/.test(src),
});
for (const file of ['svg.js', 'svg']) {
  await cp(
    `node_modules/@mathjax/mathjax-newcm-font/${file}`,
    `dist/app/scripts/mathjax/fonts/mathjax-newcm-font/${file}`,
    { recursive: true },
  );
}

// Styles: compile with Sass, then let esbuild bundle the fonts. url() paths
// in the SCSS are relative to packages/app/scss, so esbuild resolves them
// from there.
const styles = sass.compile('packages/app/scss/_main.scss');
await esbuild.build({
  stdin: {
    contents: styles.css,
    resolveDir: 'packages/app/scss',
    sourcefile: '_main.css',
    loader: 'css',
  },
  outfile: 'dist/app/css/styles.css',
  bundle: true,
  minify: true,
  loader: { '.woff2': 'file' },
});

// CLI (Node.js)
await esbuild.build({
  entryPoints: ['packages/cli/src/index.ts'],
  outfile: 'dist/cli.js',
  bundle: true,
  loader: { '.html': 'text' },
  platform: 'node',
  target: 'node22',
  minify: true,
});

await cp('packages/app/assets', 'dist/app', { recursive: true });
for (const file of ['README.md', 'CHANGELOG.md', 'LICENSE']) {
  await cp(file, `dist/${file}`);
}

// The published package only contains the bundled files, so drop
// everything that is only needed to develop markdown-slides.
const packageJSON: Record<string, unknown> = JSON.parse(
  await readFile('package.json', 'utf8'),
);
for (const key of [
  'private',
  'scripts',
  'allowScripts',
  'dependencies',
  'devDependencies',
]) {
  delete packageJSON[key];
}
await writeFile('dist/package.json', JSON.stringify(packageJSON, null, 2));
