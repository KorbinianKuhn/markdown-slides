import { cp, mkdir, readFile, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { getFiles } from './files';
import { logger } from './logger';
import { HTMLBuilder } from './markdown/html-builder';
import { getLectureTitle } from './markdown/utils';
import { Settings } from './settings';

logger.spacer('Start');

export interface Options {
  toc_numbering: boolean;
  language: string;
  institution: string;
}

export const main = async (input: string, output: string, options: Options) => {
  const files = await getFiles(input, output);

  const readme = await readFile(join(input, files.markdown[0]), 'utf8');

  const settings = new Settings(options);
  settings.title = getLectureTitle(readme);
  settings.jsFiles = files.js;
  settings.cssFiles = files.css;

  await rm(output, { force: true, recursive: true });
  await mkdir(output);

  for (const markdownFile of files.markdown) {
    const isRoot = markdownFile === 'README.md';

    const builder = new HTMLBuilder(settings, isRoot, markdownFile);

    const content = await readFile(join(input, markdownFile), 'utf8');
    const html = await builder.build(content);

    const filename =
      markdownFile === 'README.md'
        ? 'index.html'
        : markdownFile.replace('.md', '.html');

    await writeFile(join(output, filename), html);
  }

  for (const file of [...files.js, ...files.css, ...files.other]) {
    await cp(join(input, file), join(output, file), { recursive: true });
  }

  await cp(join(__dirname, './app'), join(output, 'app'), { recursive: true });

  for (const logo of files.logos) {
    await cp(join(input, logo), join(output, 'app/img', logo));
  }
};
