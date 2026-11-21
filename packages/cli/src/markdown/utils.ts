import { Lexer, Token } from 'marked';
import { logger } from '../logger';

/** Text of inline tokens without Markdown, e.g. `code` becomes code. */
const plainText = (tokens: Token[]): string =>
  tokens
    .map((token) =>
      'tokens' in token && token.tokens
        ? plainText(token.tokens)
        : 'text' in token
          ? token.text
          : '',
    )
    .join('');

/**
 * The first h1 headline of the first slide, as plain text. Headlines in code
 * and the setext style (Title, underlined with ===) are handled by marked.
 */
export const getLectureTitle = (content: string) => {
  for (const token of Lexer.lex(content)) {
    if (token.type === 'html' && token.text.trim() === '<!-- slide -->') {
      break;
    }
    if (token.type === 'heading' && token.depth === 1) {
      return plainText(token.tokens ?? []).trim();
    }
  }
  logger.error('Could not detect course title (first h1 headline in markdown)');
  process.exit(1);
};
