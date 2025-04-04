import { logger } from '../logger';
import { Settings } from '../settings';
import { template } from '../template';
import { Lexer } from './lexer';
import { MarkdownParser } from './parser';
import { State } from './state';
import { getLectureTitle } from './utils';

export class HTMLBuilder {
  private state = new State(this.settings);
  private marked = new MarkdownParser(this.state);
  private lexer = new Lexer();

  constructor(
    private settings: Settings,
    private isRoot: boolean,
    private filename: string
  ) {}

  private error(message: string) {
    logger.error(`${this.filename} ${message}`);
    process.exit(1);
  }

  private async getSlideChunks(content: string): Promise<string[]> {
    const slides = this.lexer.read(content);
    const chunks: string[] = [];

    let slideIndex = 0;
    for (const slide of slides) {
      slideIndex++;
      let chunk = ``;
      for (const token of slide.children) {
        switch (token.type) {
          case 'code':
          case 'codespan':
            chunk += token.text;
            break;
          default: {
            let text = token.text;

            // Rows
            const rowsStart = text.match(/<!-- row -->/g)?.length || 0;
            const rowsEnd = text.match(/<!-- row:end -->/g)?.length || 0;
            if (rowsStart > rowsEnd) {
              this.error(`slide ${slideIndex}: Missing <!-- row:end -->.`);
            } else if (rowsStart < rowsEnd) {
              this.error(`slide ${slideIndex}: Too many <!-- row:end -->.`);
            }
            text = text.replace(/<!-- row -->/g, '<div class="row">');
            text = text.replace(/<!-- row:end -->/g, '</div>');

            // Columns
            const colsStart = text.match(/<!-- col:end -->/g)?.length || 0;
            const colsEnd = text.match(/<!-- col:end -->/g)?.length || 0;
            if (colsStart > colsEnd) {
              this.error(`slide ${slideIndex}: Missing <!-- col:end -->.`);
            } else if (colsStart < colsEnd) {
              this.error(`slide ${slideIndex}: Too many <!-- col:end -->.`);
            }
            text = text.replace(/<!-- col -->/g, '<div class="col">');
            text = text.replace(/<!-- col:end -->/g, '</div>');

            // Replace comments
            const comments = text.matchAll(/<!--(.*?)-->/gs);
            for (const comment of comments) {
              text = text.replace(comment[0], ``);
            }

            // Spacer
            const spacer = text.matchAll(/:(spacer)(\[(.+)\])?/g);
            for (const match of spacer) {
              const className = match[3] || 'md';
              text = text.replace(
                match[0],
                `<div class="spacer ${className}"></div>`
              );
            }

            // Directives
            const directives = text.matchAll(/@(module|semester)\[(.+)\]/g);
            for (const match of directives) {
              text = text.replace(
                match[0],
                `<div class="${match[1]}">${match[2]}</div>`
              );
            }

            chunk += text;
          }
        }
      }

      chunks.push(chunk);
    }

    return chunks;
  }

  async build(content: string): Promise<string> {
    const date = new Date()
      .toISOString()
      .slice(0, 10)
      .split('-')
      .reverse()
      .join('.');

    const chunks = await this.getSlideChunks(content);
    const total = chunks.length - 1;
    const title = getLectureTitle(content);

    const slides = chunks.map((part, i) => {
      if (i === 1) {
        // Reset state after first slide
        this.state.reset();
      }

      this.state.increaseSlideNumber();

      return {
        isChild: !this.isRoot,
        content: this.marked.parse(part),
        current: i,
        total,
        lectureTitle: this.settings.title,
        institution: this.settings.institution,
        title,
        date,
      };
    });

    const menu = template.menu({
      items: this.state.getTableOfContents(),
      isChild: !this.isRoot,
      lectureTitle: this.settings.title,
      title,
      date,
    });

    const html = template.main({
      isChild: !this.isRoot,
      content: slides
        .map((o, i) => (i === 0 ? template.title(o) : template.slide(o)))
        .join('\n'),
      menu,
      title,
      lectureTitle: this.settings.title,
      date,
      cssFiles: this.settings.cssFiles,
      jsFiles: this.settings.jsFiles,
      language: this.settings.language,
    });

    logger.info(`Title: ${title}`);
    logger.info(`Slides: ${total}`);

    return html;
  }
}
