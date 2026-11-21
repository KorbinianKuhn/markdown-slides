import hljs from 'highlight.js';
import { Marked, Renderer, Tokenizer, Tokens } from 'marked';
import { template } from '../template';
import { MediaAttributes, parseMediaAttributes, renderMedia } from './images';
import { State } from './state';

export class MarkdownParser {
  private marked!: Marked;

  constructor(private state: State) {
    const renderer = new Renderer();

    renderer.table = (header, body) => {
      return template.table({ header, body });
    };

    renderer.link = (href, title, text) => {
      const regex =
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/gi;
      const isExternal = href.match(regex) !== null;
      if (isExternal) {
        return `<a href="${href}" title="${text}" target="_blank">${text}</a>`;
      } else if (href.endsWith('.md')) {
        const link = href.replace('.md', '.html');
        return `<a href="${link}" title="${text}">${text}</a>`;
      }
      return `<a href="${href}" title="${text}">${text}</a>`;
    };

    const errors = this.errors;
    const warnings = this.warnings;

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

    renderer.image = (href, title, text) => media(href, text);

    this.marked = new Marked({ renderer }).use({
      pedantic: false,
      gfm: true,
      breaks: false,
      extensions: [
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
  }

  /** Errors of the last parse() call, e.g. invalid image attributes. */
  public readonly errors: string[] = [];
  /** Warnings of the last parse() call, e.g. images without alt text. */
  public readonly warnings: string[] = [];

  parse(content: string): string {
    this.errors.length = 0;
    this.warnings.length = 0;
    return this.marked.parse(content) as string;
  }
}
