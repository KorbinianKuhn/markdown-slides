import hljs from 'highlight.js';
import { Marked, Token, Tokenizer, Tokens } from 'marked';
import markedAlert from 'marked-alert';
import { template } from '../template';
import { getTexts } from '../texts';
import { countLayoutMarkers, directives, renderHtml } from './directives';
import { Footnotes } from './footnotes';
import {
  isVideo,
  MediaAttributes,
  parseMediaAttributes,
  renderMedia,
} from './images';
import { State } from './state';
import { plainText } from './utils';

const SLIDE_MARKER = '<!-- slide -->';

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/**
 * Links to Markdown files in the input directory point to their pages:
 * chapter.md#intro becomes chapter.html#intro, and README.md index.html.
 * Markdown files in subdirectories are not converted, but copied, so links
 * to them stay as they are.
 */
const pageHref = (href: string) => {
  const match = /^(?:\.\/)?([^/?#]+)\.md((?:[?#].*)?)$/.exec(href);
  if (!match) {
    return href;
  }
  const [, name, rest] = match;
  return `${name === 'README' ? 'index' : name}.html${rest}`;
};

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
    const texts = getTexts(language);
    this.footnotes = new Footnotes({
      footnote: texts.footnote,
      back: texts.footnoteBack,
      reference: texts.footnoteReference,
    });
    const titles: Record<string, string> = texts.alerts;

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
          const isExternal = /^(https?:)?\/\//i.test(href);
          const link = isExternal ? href : pageHref(href);
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
          renderer(token) {
            // The slug comes from the Markdown text, so existing anchors keep
            // working; the table of contents shows the text without Markdown.
            const slug = state.getSlug(token.text);
            const number = state.getHeadingNumber(token.depth);
            const prefix = number ? `${number} ` : '';
            const tokens = token.tokens ?? [];
            state.addToTableOfContents(
              prefix + plainText(tokens),
              slug,
              token.depth,
            );
            const content = this.parser.parseInline(tokens);
            return `<h${token.depth} id="${slug}">${escapeHtml(prefix)}${content}</h${token.depth}>`;
          },
        },
        {
          name: 'code',
          renderer: (token) => {
            const id = this.state.getCodeSnippetId();
            // The first word of the info string, e.g. js in ```js {1,3}
            const lang = /^\S*/.exec(token.lang ?? '')![0];
            if (lang === 'mermaid') {
              // Escaped like other code: Mermaid reads the text with the
              // entities decoded, and <<interface>> or <br> stay intact
              return `<pre class="mermaid" id="${id}">${escapeHtml(token.text)}</pre>`;
            } else {
              const language = hljs.getLanguage(lang) ? lang : 'plaintext';
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
