import type { TokenizerAndRendererExtension, Tokens } from 'marked';

/**
 * marked extensions for the slide directives:
 *
 * - :spacer, :spacer{size=lg} or the older :spacer[lg]
 * - @module[123456] and @semester[Summer 2026] on the title slide
 * - <!-- row -->, <!-- col --> and their :end markers, and other comments
 *
 * Each directive works on a line of its own (rendered without a surrounding
 * paragraph) and inside text.
 */

const SPACER_SIZES = ['sm', 'md', 'lg', 'xl'];
const SPACER = /:spacer(?:\{([^}\n]*)\}|\[([^\]\n]*)\])?/;
const META = /@(module|semester)\[([^\]\n]+)\]/;

/** Matches a directive that fills a whole line (block level). */
const blockRule = (rule: RegExp) =>
  new RegExp(`^ {0,3}${rule.source}[ \\t]*(?:\\n+|$)`);
/** Matches a directive at the start of inline text. */
const inlineRule = (rule: RegExp) => new RegExp(`^${rule.source}`);

const spacer = (errors: string[]) => {
  const render = (token: Tokens.Generic) => {
    let size = token.legacySize ?? 'md';
    if (token.attributes !== undefined) {
      const parsed = /^\s*size=(\S+)\s*$/.exec(token.attributes);
      if (!parsed) {
        errors.push(
          `Invalid spacer "${token.directive}", expected :spacer{size=sm|md|lg|xl}`,
        );
        return '';
      }
      size = parsed[1];
    }
    if (!SPACER_SIZES.includes(size)) {
      errors.push(`Invalid spacer size "${size}", expected sm, md, lg or xl`);
      return '';
    }
    return `<div class="spacer ${size}"></div>`;
  };

  const tokenizer = (rule: RegExp, type: string) => (src: string) => {
    const match = rule.exec(src);
    if (!match) {
      return undefined;
    }
    return {
      type,
      raw: match[0],
      directive: match[0].trim(),
      attributes: match[1],
      legacySize: match[2],
    };
  };

  return [
    {
      name: 'spacerBlock',
      level: 'block',
      tokenizer: tokenizer(blockRule(SPACER), 'spacerBlock'),
      renderer: render,
    },
    {
      name: 'spacer',
      level: 'inline',
      start: (src: string) => src.search(SPACER),
      tokenizer: tokenizer(inlineRule(SPACER), 'spacer'),
      renderer: render,
    },
  ] satisfies TokenizerAndRendererExtension[];
};

const meta = () => {
  const render = (token: Tokens.Generic) =>
    `<div class="${token.name}">${token.value}</div>`;

  const tokenizer = (rule: RegExp, type: string) => (src: string) => {
    const match = rule.exec(src);
    if (!match) {
      return undefined;
    }
    return { type, raw: match[0], name: match[1], value: match[2] };
  };

  return [
    {
      name: 'metaBlock',
      level: 'block',
      tokenizer: tokenizer(blockRule(META), 'metaBlock'),
      renderer: render,
    },
    {
      name: 'meta',
      level: 'inline',
      start: (src: string) => src.search(META),
      tokenizer: tokenizer(inlineRule(META), 'meta'),
      renderer: render,
    },
  ] satisfies TokenizerAndRendererExtension[];
};

export const directives = (errors: string[]) => [...spacer(errors), ...meta()];

const LAYOUT_MARKERS: Record<string, string> = {
  '<!-- row -->': '<div class="row">',
  '<!-- row:end -->': '</div>',
  '<!-- col -->': '<div class="column">',
  '<!-- col:end -->': '</div>',
};

/**
 * Renders raw HTML: layout markers become divs, all other comments
 * (including misplaced slide markers) are removed.
 */
export const renderHtml = (html: string) =>
  html.replace(/<!--[\s\S]*?-->/g, (comment) => LAYOUT_MARKERS[comment] ?? '');

/** Counts the layout markers in raw HTML, e.g. to check rows and columns. */
export const countLayoutMarkers = (html: string) => {
  const count = (marker: string) => html.split(marker).length - 1;
  return {
    row: count('<!-- row -->'),
    'row:end': count('<!-- row:end -->'),
    col: count('<!-- col -->'),
    'col:end': count('<!-- col:end -->'),
  };
};
