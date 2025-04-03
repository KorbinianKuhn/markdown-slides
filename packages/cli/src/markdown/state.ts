import { Settings } from '../settings';

interface MenuItem {
  level: number;
  title: string;
  slug: string;
  slideNumber: number;
  children: MenuItem[];
}

export class State {
  private slugs: string[] = [];
  private toc: Array<{
    level: number;
    slug: string;
    title: string;
    slideNumber: number;
  }> = [];
  private tocNumbering: number[] = [];
  private slideNumber = -1;
  private codeSnippetsCounter = 0;

  constructor(private settings: Settings) {
    this.reset();
  }

  reset() {
    this.slugs.length = 0;
    this.toc.length = 0;
    this.tocNumbering = [0, 0, 0, 0];
    this.slideNumber = 0;
    this.codeSnippetsCounter = 0;
  }

  increaseSlideNumber() {
    this.slideNumber++;
  }

  getSlug(title: string): string {
    const text = title.toLowerCase().replace(/[^\w]+/g, '-');

    const getUniqueSlug = (title: string, counter: number): string => {
      const slug = counter === 0 ? title : `${title}-${counter}`;
      if (this.slugs.find((o) => o === slug)) {
        return getUniqueSlug(title, counter === 0 ? counter + 2 : counter + 1);
      }
      return slug;
    };
    const slug = getUniqueSlug(text, 0);
    this.slugs.push(slug);
    return slug;
  }

  getCodeSnippetId(): string {
    this.codeSnippetsCounter++;
    return `code-snippet-${this.codeSnippetsCounter}`;
  }

  getTableOfContents(): MenuItem[] {
    const items: MenuItem[] = [];

    let last!: MenuItem;
    for (const heading of this.toc) {
      const item: MenuItem = {
        level: heading.level,
        title: heading.title,
        slug: heading.slug,
        slideNumber: heading.slideNumber,
        children: [],
      };

      if (!last || heading.level <= last.level) {
        items.push(item);
        last = item;
        continue;
      }

      last.children.push(item);
    }

    return items;
  }

  getHeading(text: string, level: number): string {
    if (this.settings.tocNumbering) {
      if (level < this.tocNumbering.length) {
        this.tocNumbering = this.tocNumbering.map((o, i) => {
          if (i < level) {
            return o;
          } else if (i === level) {
            return o + 1;
          } else {
            return 0;
          }
        });
        const tocNumber = this.tocNumbering.slice(2, level + 1).join('.');

        return `${tocNumber} ${text}`;
      }
    }

    return text;
  }

  addToTableOfContents(title: string, slug: string, level: number) {
    if (level > 3) {
      return;
    }

    const last = this.toc[this.toc.length - 1];

    if (last?.title !== title) {
      this.toc.push({
        level,
        slug,
        title,
        slideNumber: this.slideNumber,
      });
    }
  }
}
