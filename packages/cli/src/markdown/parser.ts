import hljs from 'highlight.js';
import { Marked, Token, Tokenizer, Tokens } from 'marked';
import markedAlert from 'marked-alert';
import { template } from '../template';
import { countLayoutMarkers, directives, renderHtml } from './directives';
import { footnoteLabels, Footnotes } from './footnotes';
import {
  isVideo,
  MediaAttributes,
  parseMediaAttributes,
  renderMedia,
} from './images';
import { State } from './state';

const SLIDE_MARKER = '<!-- slide -->';

/** Titles of GitHub-style alerts, e.g. > [!NOTE] */
const alertTitles: Record<string, Record<string, string>> = {
  en: {
    note: 'Note',
    tip: 'Tip',
    important: 'Important',
    warning: 'Warning',
    caution: 'Caution',
  },
  de: {
    note: 'Hinweis',
    tip: 'Tipp',
    important: 'Wichtig',
    warning: 'Warnung',
    caution: 'Vorsicht',
  },
};

const escapeAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/** The href of an image token, also with an attribute block. */
const mediaHref = (token: Token) =>
  token.type === 'image'
    ? (token as Tokens.Image).href
    : token.type === 'mediaWithAttributes'
      ? (token.image as Tokens.Image).href
      : undefined;

export class MarkdownParser {
  private marked!: Marked;
  private footnotes: Footnotes;

  constructor(
    private state: State,
    language = 'en',
  ) {
    const errors = this.errors;
    const warnings = this.warnings;
    this.footnotes = new Footnotes(
      footnoteLabels[language] ?? footnoteLabels.en,
    );
    const titles = alertTitles[language] ?? alertTitles.en;

    const media = (
      href: string | null,
      alt: string,
      attributes?: MediaAttributes,
    ) => {
      if (!alt.trim()) {
        warnings.push(
          `Image without alt text (${href}). Describe it for screen readers: ![Description](${href})`,
        );
      }
      return renderMedia(href, alt, attributes);
    };

    this.marked = new Marked().use({
      pedantic: false,
      gfm: true,
      breaks: false,
      renderer: {
        table(token) {
          const row = (cells: Tokens.TableCell[]) =>
            this.tablerow({
              text: cells.map((cell) => this.tablecell(cell)).join(''),
            });
          return template.table({
            header: row(token.header),
            body: token.rows.map(row).join(''),
          });
        },

        link({ href, title, tokens }) {
          const text = this.parser.parseInline(tokens);
          const regex =
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/gi;
          const isExternal = href.match(regex) !== null;
          const link =
            !isExternal && href.endsWith('.md')
              ? href.replace('.md', '.html')
              : href;
          // Only a title from Markdown ([text](url "title")): repeating the
          // link text adds nothing for screen readers
          const attributes = [
            `href="${escapeAttribute(link)}"`,
            title && `title="${escapeAttribute(title)}"`,
            isExternal && 'target="_blank"',
          ].filter(Boolean);
          return `<a ${attributes.join(' ')}>${text}</a>`;
        },

        paragraph({ tokens }) {
          // Videos are blocks, which can't be inside a paragraph
          const content = tokens.filter(
            (token) =>
              token.type !== 'br' &&
              !(token.type === 'text' && !token.raw.trim()),
          );
          const onlyVideos =
            content.length > 0 &&
            content.every((token) => isVideo(mediaHref(token) ?? null));
          return onlyVideos ? this.parser.parseInline(tokens) + '\n' : false;
        },

        image({ href, text }) {
          return media(href, text);
        },

        html({ text }) {
          if (text.includes(SLIDE_MARKER)) {
            warnings.push(
              `${SLIDE_MARKER} is ignored, because it is not on a line of its own (e.g. inside a list or a blockquote)`,
            );
          }
          return renderHtml(text);
        },
      },
      extensions: [
        ...directives(errors),
        ...this.footnotes.extensions(),
        {
          // Image with an attribute block: ![Alt](image.png){width=70% align=left}
          name: 'mediaWithAttributes',
          level: 'inline',
          start: (src) => src.indexOf('!['),
          tokenizer(src) {
            // Reuse the built-in tokenizer, so URLs and titles work as usual
            const { tokenizer } = this.lexer as unknown as {
              tokenizer: Tokenizer;
            };
            const image = tokenizer.link(src);
            if (!image || image.type !== 'image') {
              return undefined;
            }
            const block = /^\{([^}\n]*)\}/.exec(src.slice(image.raw.length));
            if (!block) {
              return undefined;
            }
            return {
              type: 'mediaWithAttributes',
              raw: image.raw + block[0],
              image,
              attributes: block[1],
            };
          },
          renderer: (token) => {
            const image = token.image as Tokens.Image;
            try {
              const attributes = parseMediaAttributes(token.attributes);
              return media(image.href, image.text, attributes);
            } catch (error) {
              errors.push(`${(error as Error).message} (${image.href})`);
              return media(image.href, image.text);
            }
          },
        },
        {
          name: 'heading',
          renderer: (token) => {
            const slug = this.state.getSlug(token.text);
            const title = this.state.getHeading(token.text, token.depth);
            this.state.addToTableOfContents(title, slug, token.depth);
            return `<h${token.depth} id="${slug}">${title}</h${token.depth}>`;
          },
        },
        {
          name: 'code',
          renderer: (token) => {
            const id = this.state.getCodeSnippetId();
            if (token.raw.trim().startsWith('```mermaid')) {
              return `<pre class="mermaid" id="${id}">${token.text}</pre>`;
            } else {
              const language = hljs.getLanguage(token.lang)
                ? token.lang
                : 'plaintext';
              const highlighted = hljs.highlight(token.text, {
                language,
              }).value;
              return template.code({
                id,
                content: highlighted,
              });
            }
          },
        },
      ],
    });

    this.marked.use(markedAlert(), {
      extensions: [
        {
          // Translates the title, then falls back to marked-alert's renderer
          name: 'alert',
          renderer(token) {
            const meta = token.meta as { variant: string; title: string };
            meta.title = titles[meta.variant] ?? meta.title;
            return false;
          },
        },
      ],
    });
  }

  /** Errors of the last parse() call, e.g. invalid image attributes. */
  public readonly errors: string[] = [];
  /** Warnings of the last parse() call, e.g. images without alt text. */
  public readonly warnings: string[] = [];

  /**
   * Splits a Markdown file into the tokens of each slide. Slides are separated
   * by <!-- slide --> on a line of its own; marked's lexer makes sure that
   * markers inside code are ignored.
   */
  splitSlides(content: string): Token[][] {
    this.footnotes.reset();
    const tokens = this.marked.lexer(content);
    // Like marked.parse(), e.g. marked-alert turns blockquotes into alerts
    const { walkTokens } = this.marked.defaults;
    if (walkTokens) {
      this.marked.walkTokens(tokens, walkTokens);
    }
    const slides: Token[][] = [[]];
    for (const token of tokens) {
      if (token.type === 'html' && token.text.trim() === SLIDE_MARKER) {
        slides.push([]);
      } else {
        slides[slides.length - 1].push(token);
      }
    }
    return slides;
  }

  /** Checks that rows and columns of a slide are closed, outside code. */
  checkLayout(tokens: Token[]): string | undefined {
    let html = '';
    this.marked.walkTokens(tokens, (token) => {
      if (token.type === 'html') {
        html += token.text;
      }
    });
    const count = countLayoutMarkers(html);
    for (const name of ['row', 'col'] as const) {
      if (count[name] > count[`${name}:end`]) {
        return `Missing <!-- ${name}:end -->`;
      } else if (count[name] < count[`${name}:end`]) {
        return `Too many <!-- ${name}:end -->`;
      }
    }
    return undefined;
  }

  /** Renders a slide; its footnotes are in `footnotes` afterwards. */
  parse(tokens: Token[]): string {
    this.errors.length = 0;
    this.warnings.length = 0;
    const html = this.marked.parser(tokens);
    this.slideFootnotes = this.footnotes.render((tokens) =>
      this.marked.parser(tokens),
    );
    return html;
  }

  /** Footnotes of the last parse() call, for the bottom of the slide. */
  public slideFootnotes = '';
}
