import { logger } from '../logger';

export const getLectureTitle = (content: string) => {
  const part = content.split(/^<!-- slide -->$/m)[0];
  const headlines = part.match(/^#\s(.*?)$/m);
  if (!headlines) {
    logger.error(
      'Could not detect course title (first h1 headline in markdown)'
    );
    process.exit(1);
  }

  return headlines[1];
};
