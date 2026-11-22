import { readdir } from 'fs/promises';
import { extname, resolve } from 'path';
import picomatch from 'picomatch';
import { logger } from './logger';

interface Files {
  markdown: string[];
  css: string[];
  js: string[];
  other: string[];
  logos: string[];
}

/**
 * Patterns of --allowed-files and --ignored-files: names or glob patterns
 * like in .gitignore, matched against the names in the input directory.
 * A pattern ending with / only matches directories.
 */
class Filter {
  private matchers: Array<{
    pattern: string;
    directoryOnly: boolean;
    isMatch: (name: string) => boolean;
    used: boolean;
  }>;

  constructor(patterns: string[] = []) {
    this.matchers = patterns.map((pattern) => {
      const directoryOnly = pattern.endsWith('/');
      return {
        pattern,
        directoryOnly,
        isMatch: picomatch(directoryOnly ? pattern.slice(0, -1) : pattern),
        used: false,
      };
    });
  }

  get isEmpty() {
    return this.matchers.length === 0;
  }

  matches(name: string, isDirectory: boolean) {
    let matched = false;
    for (const matcher of this.matchers) {
      if ((!matcher.directoryOnly || isDirectory) && matcher.isMatch(name)) {
        matcher.used = true;
        matched = true;
      }
    }
    return matched;
  }

  /** Patterns that matched nothing, e.g. typos */
  get unused() {
    return this.matchers.filter((o) => !o.used).map((o) => o.pattern);
  }
}

export const getFiles = async (
  src: string,
  dst: string,
  allowedFiles?: string[],
  ignoredFiles?: string[],
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

  const allowed = new Filter(allowedFiles);
  const ignored = new Filter(ignoredFiles);
  if (outputDirectory) {
    // Never copied, and may not exist yet, but a pattern for it is no typo
    allowed.matches(outputDirectory, true);
    ignored.matches(outputDirectory, true);
  }

  for (const file of files) {
    if (file.name === outputDirectory) {
      continue;
    }

    // Dotfiles are always ignored. A file must match --allowed-files (if
    // set) and not match --ignored-files.
    const isDirectory = file.isDirectory();
    const isAllowed =
      !file.name.startsWith('.') &&
      (allowed.isEmpty || allowed.matches(file.name, isDirectory)) &&
      !ignored.matches(file.name, isDirectory);
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
              'index.md as filename is forbidden, because README.md will be your index.html file.',
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
              file.name,
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

  for (const [option, filter] of [
    ['--allowed-files', allowed],
    ['--ignored-files', ignored],
  ] as const) {
    for (const pattern of filter.unused) {
      logger.warn(`${option} ${pattern} matches nothing in ${src}`);
    }
  }

  if (res.markdown.length === 0) {
    logger.error('No markdown files found in root. Start with a README.md');
    process.exit(1);
  }

  if (res.markdown[0] !== 'README.md') {
    logger.error(
      'README.md in root directory not found. This must be your slides entrypoint.',
    );
    process.exit(1);
  }

  logger.info(`Found ${res.markdown.length} markdown files`);

  return res;
};
