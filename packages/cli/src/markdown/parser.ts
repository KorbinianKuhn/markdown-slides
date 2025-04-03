import hljs from 'highlight.js';
import { Marked, Renderer } from 'marked';
import { template } from '../template';
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
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
      const isExternal = href.match(regex) !== null;
      if (isExternal) {
        return `<a href="${href}" title="${text}" target="_blank">${text}</a>`;
      } else if (href.endsWith('.md')) {
        const link = href.replace('.md', '.html');
        return `<a href="${link}" title="${text}">${text}</a>`;
      }
      return `<a href="${href}" title="${text}">${text}</a>`;
    };

    renderer.image = (href, title, text) => {
      const src = href?.replace(/^\//, '') || '';
      if (['.mp4', '.webm'].some((o) => src.endsWith(o))) {
        return template.video({ src, alt: text });
      } else {
        return template.image({ src, alt: text });
      }
    };

    this.marked = new Marked({ renderer }).use({
      pedantic: false,
      gfm: true,
      breaks: false,
      extensions: [
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
          },
        },
        // {
        //   name: 'image',
        //   renderer: (token) => {
        //     console.log(token);
        //     const src = token.href?.replace(/^\//, '') || '';
        //     if (['.mp4', '.webm'].some((o) => src.endsWith(o))) {
        //       return template.video({ src, alt: token.alt });
        //     } else {
        //       return template.image({ src, alt: token.alt });
        //     }
        //   },
        // },
        // {
        //   name: 'link',
        //   renderer: ({ href, text, title }) => {
        //     const regex =
        //       /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
        //     const isExternal = href.match(regex) !== null;
        //     if (isExternal) {
        //       return `<a href="${href}" target="_blank">${text}</a>`;
        //     } else if (href.endsWith('.md')) {
        //       const link = href.replace('.md', '.html');
        //       return `<a href="${link}">${text}</a>`;
        //     }
        //     return `<a href="${href}">${text}</a>`;
        //   },
        // },
      ],
    });
  }

  parse(content: string): string {
    return this.marked.parse(content) as string;
  }
}
