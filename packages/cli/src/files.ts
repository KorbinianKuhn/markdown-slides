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

const isIgnoredFile = (filename: string): boolean => {
  if (filename.startsWith('.')) {
    return true;
  }

  if (
    ['node_modules', 'package.json', 'package-lock.json'].includes(filename)
  ) {
    return true;
  }

  return false;
};

export const getFiles = async (src: string, dst: string): Promise<Files> => {
  const files = await readdir(src, { withFileTypes: true });

  let outputDirectory = resolve(dst).replace(resolve(src), '');
  outputDirectory = outputDirectory.split('/')[
    outputDirectory.startsWith('/') ? 1 : 0
  ];

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
          if (!isIgnoredFile(file.name)) {
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
