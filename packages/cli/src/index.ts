#!/usr/bin/env node

import { ArgumentParser } from 'argparse';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { logger } from './logger';
import { main, Options } from './main';

export interface Args extends Options {
  in: string;
  out: string;
  allowed_files?: string[];
  ignored_files?: string[];
}

const { version } = JSON.parse(
  readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'),
);

// argparse names the function in errors: invalid boolean value: 'maybe'
const boolean = (value: string) => {
  if (value !== 'true' && value !== 'false') {
    throw new TypeError();
  }
  return value === 'true';
};
// Kept explicitly, the bundle is minified
Object.defineProperty(boolean, 'name', { value: 'boolean' });

const parser = new ArgumentParser({
  description: 'Command line tool to convert markdown to HTML slides.',
});

parser.add_argument('-v', '--version', { action: 'version', version });
parser.add_argument('-i', '--in', { default: '.' });
parser.add_argument('-o', '--out', { default: 'public' });
parser.add_argument('-l', '--language', {
  choices: ['en', 'de'],
  default: 'en',
});
parser.add_argument('--toc-numbering', {
  default: true,
  metavar: '{true,false}',
  type: boolean,
});
parser.add_argument('--institution', { required: false });
parser.add_argument('--title', { required: false });
parser.add_argument('--allowed-files', {
  required: false,
  nargs: '+',
  metavar: 'PATTERN',
  help: "only use files and directories of the input directory that match a name or glob pattern, e.g. README.md 'chapter-*.md' images",
});
parser.add_argument('--ignored-files', {
  required: false,
  nargs: '+',
  metavar: 'PATTERN',
  help: "ignore files and directories of the input directory that match a name or glob pattern, e.g. '*.pdf' drafts/ (dotfiles are always ignored)",
});

const args: Args = parser.parse_args();

const src = path.resolve(args.in);
const dst = path.resolve(args.out);

if (!existsSync(src)) {
  logger.error(`Input directory does not exists: ${src}`);
  process.exit(1);
}

// The output directory is deleted before each build, so it must not contain
// the current directory or the input
const cwd = path.resolve();
const isInside = (child: string, parent: string) => {
  const relative = path.relative(parent, child);
  return (
    relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
  );
};

if (!(src === cwd || isInside(src, cwd)) || !isInside(dst, cwd)) {
  logger.error(
    `Input and output directory must be part of the current directory, and the output directory can't be the current directory`,
  );
  process.exit(1);
}

if (src === dst || isInside(src, dst)) {
  logger.error(
    `The output directory can't be or contain the input directory, because it is deleted before each build`,
  );
  process.exit(1);
}

const options: Options = {
  toc_numbering: args.toc_numbering,
  language: args.language,
  institution:
    args.institution ||
    (args.language === 'de'
      ? 'Hochschule der Medien'
      : 'Stuttgart Media University'),
  title: args.title,
  allowedFiles: args.allowed_files,
  ignoredFiles: args.ignored_files,
};

main(src, dst, options)
  .then()
  .catch((err) => {
    logger.error(err.message, err);
    process.exit(1);
  });
