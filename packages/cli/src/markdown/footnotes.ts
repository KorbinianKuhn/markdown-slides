import type { Token, TokenizerAndRendererExtension } from 'marked';

/**
 * GitHub-style footnotes, shown at the bottom of the slide that refers to
 * them:
 *
 *     Text with a footnote[^1].
 *
 *     [^1]: The footnote. Further paragraphs are indented by four spaces.
 *
 * Definitions belong to the whole file, so a footnote can be defined
 * anywhere and referred to from several slides. Each slide numbers its
 * footnotes from 1.
 */

const DEFINITION =
  /^ {0,3}\[\^([^\]\s]+)\]:[ \t]*([^\n]*(?:\n(?:[ \t]*\n)*(?: {4}|\t)[^\n]*)*)(?:\n+|$)/;
const REFERENCE = /^\[\^([^\]\s]+)\]/;

export interface FootnoteLabels {
  footnote: string;
  back: string;
  reference: string;
}

interface Note {
  number: number;
  id: number;
  refs: number;
}

export class Footnotes {
  /** Definitions of the file, by label */
  private definitions = new Map<string, Token[]>();
  /** Footnotes of the current slide, by label, in the order of reference */
  private notes = new Map<string, Note>();
  /** Unique within the page, so ids don't repeat across slides */
  private lastId = 0;

  constructor(private labels: FootnoteLabels) {}

  /** Before lexing a file */
  reset() {
    this.definitions.clear();
    this.lastId = 0;
  }

  extensions(): TokenizerAndRendererExtension[] {
    const definitions = this.definitions;
    return [
      {
        name: 'footnoteDefinition',
        level: 'block',
        start: (src) => src.match(/^ {0,3}\[\^[^\]\s]+\]:/m)?.index,
        tokenizer(src) {
          const match = DEFINITION.exec(src);
          if (!match) {
            return undefined;
          }
          const [raw, label, text] = match;
          const content = text.replace(/\n(?: {4}|\t)/g, '\n');
          const tokens = this.lexer.blockTokens(content, []);
          if (!definitions.has(label)) {
            definitions.set(label, tokens);
          }
          return { type: 'footnoteDefinition', raw, label, tokens };
        },
        // Rendered at the bottom of the slide, see render()
        renderer: () => '',
      },
      {
        name: 'footnoteRef',
        level: 'inline',
        start: (src) => src.indexOf('[^'),
        tokenizer(src) {
          const match = REFERENCE.exec(src);
          // Definitions are lexed before inline text. Without one, the text
          // stays as it is, like on GitHub.
          if (!match || !definitions.has(match[1])) {
            return undefined;
          }
          return { type: 'footnoteRef', raw: match[0], label: match[1] };
        },
        renderer: (token) => this.renderReference(token.label as string),
      },
    ];
  }

  private renderReference(label: string) {
    let note = this.notes.get(label);
    if (!note) {
      note = { number: this.notes.size + 1, id: ++this.lastId, refs: 0 };
      this.notes.set(label, note);
    }
    note.refs++;
    const suffix = note.refs > 1 ? `-${note.refs}` : '';
    return (
      `<sup class="footnote-ref"><a id="footnote-ref-${note.id}${suffix}" ` +
      `href="#footnote-${note.id}" ` +
      `aria-label="${this.labels.footnote} ${note.number}">${note.number}</a></sup>`
    );
  }

  /**
   * Renders the footnotes referred to since the last call, i.e. on the
   * current slide.
   */
  render(parse: (tokens: Token[]) => string): string {
    const items: string[] = [];
    // Footnotes can refer to further footnotes, which are added to the map
    // while iterating
    for (const [label, note] of this.notes) {
      const content = parse(this.definitions.get(label)!).trimEnd();
      const backLinks = Array.from({ length: note.refs }, (_, i) => {
        // The second and further links show their number, e.g. ↩²; the
        // label must contain it too (WCAG 2.5.3)
        const suffix = i > 0 ? `-${i + 1}` : '';
        const label = `${this.labels.back} ${note.number}${i > 0 ? `, ${this.labels.reference} ${i + 1}` : ''}`;
        return (
          `<a href="#footnote-ref-${note.id}${suffix}" class="footnote-back" ` +
          `aria-label="${label}">↩${i > 0 ? `<sup>${i + 1}</sup>` : ''}</a>`
        );
      }).join(' ');
      // Back links at the end of the last paragraph, like on GitHub
      const item = content.endsWith('</p>')
        ? `${content.slice(0, -4)} ${backLinks}</p>`
        : `${content}\n<p>${backLinks}</p>`;
      items.push(`<li id="footnote-${note.id}">\n${item}\n</li>`);
    }
    this.notes.clear();
    return items.length > 0
      ? `<div class="footnotes">\n<ol>\n${items.join('\n')}\n</ol>\n</div>`
      : '';
  }
}
