import { Options } from './main';

export class Settings {
  public title?: string;
  public cssFiles: string[] = [];
  public jsFiles: string[] = [];
  public institution!: string;
  public tocNumbering!: boolean;
  public language!: string;

  constructor(options: Options) {
    this.tocNumbering = options.toc_numbering;
    this.language = options.language;
    this.institution = options.institution;
  }
}
