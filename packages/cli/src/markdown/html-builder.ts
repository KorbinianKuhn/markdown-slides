import { logger } from '../logger';
import { Settings } from '../settings';
import { template } from '../template';
import { MarkdownParser } from './parser';
import { State } from './state';
import { getLectureTitle } from './utils';

/** Start of a formula: \( \[ $$ or \begin{…} */
const MATH_DELIMITER = /\\\(|\\\[|\$\$|\\begin\{/;

export class HTMLBuilder {
  private state: State;
  private marked: MarkdownParser;

  constructor(
    private settings: Settings,
    private isRoot: boolean,
    private filename: string,
  ) {
    // Not as field initializers: with ES2022 class fields they run before the
    // constructor parameters are assigned, so this.settings would be undefined.
    this.state = new State(settings);
    this.marked = new MarkdownParser(this.state, settings.language);
  }

  private error(message: string) {
    logger.error(`${this.filename} ${message}`);
    process.exit(1);
  }

  async build(content: string): Promise<string> {
    const date = new Date()
      .toISOString()
      .slice(0, 10)
      .split('-')
      .reverse()
      .join('.');

    const chunks = this.marked.splitSlides(content);
    const total = chunks.length - 1;
    const title = getLectureTitle(content);

    const slides = chunks.map((part, i) => {
      if (i === 1) {
        // Reset state after first slide
        this.state.reset();
      }

      this.state.increaseSlideNumber();

      const layoutError = this.marked.checkLayout(part);
      if (layoutError) {
        this.error(`slide ${i + 1}: ${layoutError}.`);
      }

      let content = this.marked.parse(part);
      let footnotes = this.marked.slideFootnotes;
      if (i === 0) {
        // The title slide has no place at the bottom
        content += footnotes;
        footnotes = '';
      }
      // Same numbering as the row and column checks (title slide is 1)
      for (const warning of this.marked.warnings) {
        logger.warn(`${this.filename} slide ${i + 1}: ${warning}`);
      }
      if (this.marked.errors.length > 0) {
        this.error(`slide ${i + 1}: ${this.marked.errors[0]}.`);
      }

      return {
        isChild: !this.isRoot,
        content,
        footnotes,
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

    const slidesHtml = slides
      .map((o, i) => (i === 0 ? template.title(o) : template.slide(o)))
      .join('\n');

    const html = template.main({
      isChild: !this.isRoot,
      content: slidesHtml,
      // MathJax and Mermaid are large, so pages only load them when needed.
      // The delimiters are MathJax's defaults; a false positive (e.g. \( in
      // code) only loads MathJax.
      hasMath: MATH_DELIMITER.test(slidesHtml),
      hasMermaid: slidesHtml.includes('<pre class="mermaid"'),
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
