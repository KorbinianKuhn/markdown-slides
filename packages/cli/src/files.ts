import { readdir } from 'fs/promises';
import { extname, resolve } from 'path';
import { logger } from './logger';

interface Files {
  markdown: string[];
  css: string[];
  js: string[];
  other: string[];
  logos: string[];
}

const isFileAllowed = (
  filename: string,
  allowedFiles?: string[],
  ignoredFiles?: string[]
): boolean => {
  if (filename.startsWith('.')) {
    return false;
  }
  if (allowedFiles && allowedFiles.length > 0) {
    return allowedFiles.includes(filename);
  }
  if (ignoredFiles && ignoredFiles.length > 0) {
    return !ignoredFiles.includes(filename);
  }
  return true;
};

export const getFiles = async (
  src: string,
  dst: string,
  allowedFiles?: string[],
  ignoredFiles?: string[]
): Promise<Files> => {
  const files = await readdir(src, { withFileTypes: true });

  let outputDirectory = resolve(dst).replace(resolve(src), '');
  outputDirectory =
    outputDirectory.split('/')[outputDirectory.startsWith('/') ? 1 : 0];

  const res: Files = {
    markdown: [],
    css: [],
    js: [],
    other: [],
    logos: [],
  };

  for (const file of files) {
    if (file.name === outputDirectory) {
      continue;
    }

    const isAllowed = isFileAllowed(file.name, allowedFiles, ignoredFiles);
    if (!isAllowed) {
      logger.info(`File ${file.name} is ignored`);
      continue;
    }

    if (file.isFile()) {
      const extension = extname(file.name);
      switch (extension) {
        case '.md': {
          if (file.name === 'README.md') {
            res.markdown.splice(0, 0, file.name);
          } else if (file.name === 'index.md') {
            logger.error(
              'index.md as filename is forbidden, because README.md will be your index.html file.'
            );
            process.exit(1);
          } else {
            res.markdown.push(file.name);
          }
          break;
        }
        case '.js':
          res.js.push(file.name);
          break;
        case '.css':
          res.css.push(file.name);
          break;
        default:
          if (
            ['logo-light.svg', 'logo-dark.svg', 'favicon.ico'].includes(
              file.name
            )
          ) {
            res.logos.push(file.name);
          } else {
            res.other.push(file.name);
          }
      }
    } else {
      res.other.push(file.name);
    }
  }

  if (res.markdown.length === 0) {
    logger.error('No markdown files found in root. Start with a README.md');
    process.exit(1);
  }

  if (res.markdown[0] !== 'README.md') {
    logger.error(
      'README.md in root directory not found. This must be your slides entrypoint.'
    );
    process.exit(1);
  }

  logger.info(`Found ${res.markdown.length} markdown files`);

  return res;
};
