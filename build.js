const esbuild = require('esbuild');
const sassPlugin = require('esbuild-plugin-sass');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { rm, cp, mkdir } = require('fs/promises');

const main = async () => {
  if (existsSync('./dist')) {
    await rm('./dist', { recursive: true, force: true });
  }
  await mkdir('./dist');

  await esbuild.build({
    entryPoints: ['packages/app/src/index.ts'],
    outfile: 'dist/app/scripts/slides.js',
    bundle: true,
    platform: 'browser',
  });

  await cp(
    'node_modules/mermaid/dist/mermaid.min.js',
    'dist/app/scripts/mermaid.min.js'
  );
  await cp('node_modules/mathjax/es5', 'dist/app/scripts/mathjax', {
    recursive: true,
  });

  await esbuild.build({
    entryPoints: ['packages/app/scss/_main.scss'],
    outfile: 'dist/app/css/styles.css',
    bundle: true,
    plugins: [sassPlugin()],
    minify: true,
    loader: {
      '.woff2': 'file',
    },
  });

  await esbuild.build({
    entryPoints: ['packages/cli/src/index.ts'],
    outfile: 'dist/cli.js',
    bundle: true,
    loader: {
      '.html': 'text',
    },
    platform: 'node',
    minify: true,
  });

  await cp('packages/app/assets', 'dist/app', { recursive: true });
  await cp('README.md', 'dist/README.md');
  await cp('bin', 'dist/bin', { recursive: true });

  const packageJSON = JSON.parse(readFileSync('package.json', 'utf8'));
  packageJSON.dependencies = {};
  packageJSON.devDependencies = {};
  writeFileSync('dist/package.json', JSON.stringify(packageJSON, null, 2));
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
