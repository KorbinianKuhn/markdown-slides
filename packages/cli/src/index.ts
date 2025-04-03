#!/usr/bin/env node

import { ArgumentParser } from 'argparse';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { logger } from './logger';
import { main, Options } from './main';

export interface Args extends Options {
  in: string;
  out: string;
}

const { version } = JSON.parse(
  readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')
);

const parser = new ArgumentParser({
  description: 'Command line tool to convert markdown to HTML slides.',
});

parser.add_argument('-v', '--version', { action: 'version', version });
parser.add_argument('-i', '--in', { default: '.' });
parser.add_argument('-o', '--out', { default: 'public' });
parser.add_argument('-l', '--language', {
  choices: ['en', 'de'],
  required: true,
});
parser.add_argument('--toc-numbering', { default: true });
parser.add_argument('--institution', { required: false });

const args: Args = parser.parse_args();

const src = path.resolve(args.in);
const dst = path.resolve(args.out);

if (!existsSync(src)) {
  logger.error(`Input directory does not exists: ${src}`);
  process.exit(1);
}

if (!src.includes(path.resolve()) || !dst.includes(path.resolve())) {
  logger.error(
    `Input and output directory must be part of the current directory`
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
};

main(src, dst, options)
  .then()
  .catch((err) => {
    logger.error(err.message, err);
    process.exit(1);
  });
