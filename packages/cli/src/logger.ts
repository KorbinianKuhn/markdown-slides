import { Constants } from './constants';

class Logger {
  get date(): string {
    return new Date().toISOString().slice(11, 23);
  }

  info(message: string): void {
    console.log(`${this.date} [info] ${message}`);
  }

  warn(message: string): void {
    console.warn(`${this.date} [warn] ${message}`);
  }

  error(message: string, error?: Error): void {
    console.error(
      ...[`${this.date} [error] ${message}`, error].filter(
        (o) => o !== undefined
      )
    );
  }

  spacer(message: string): void {
    console.log(`\n# ${message}`);
  }

  copy(src: string, dst: string): void {
    this.info(
      `Copy ${src.replace(Constants.ROOT_DIRECTORY, '.')} > ${dst.replace(
        Constants.ROOT_DIRECTORY,
        '.'
      )}`
    );
  }
}

export const logger = new Logger();
