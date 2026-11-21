import { template } from '../template';

export interface MediaAttributes {
  width?: string;
  align?: 'left' | 'center' | 'right';
}

const ALIGNMENTS = ['left', 'center', 'right'];
const WIDTH = /^\d+(\.\d+)?(%|px)$/;

/**
 * Parses an attribute block like `width=70% align=left` that directly follows
 * an image: ![Alt text](image.png){width=70% align=left}
 *
 * Throws an error with a readable message for unknown or invalid attributes.
 */
export const parseMediaAttributes = (input: string): MediaAttributes => {
  const attributes: MediaAttributes = {};
  const parts = input.trim().split(/\s+/).filter((o) => o);

  for (const part of parts) {
    const [key, value, ...rest] = part.split('=');
    if (value === undefined || rest.length > 0 || !value) {
      throw new Error(`Invalid image attribute "${part}", expected key=value`);
    }
    if (key in attributes) {
      throw new Error(`Duplicate image attribute "${key}"`);
    }

    switch (key) {
      case 'width':
        if (!WIDTH.test(value)) {
          throw new Error(
            `Invalid image width "${value}", expected a percentage or pixels (e.g. 70% or 400px)`
          );
        }
        attributes.width = value;
        break;
      case 'align':
        if (!ALIGNMENTS.includes(value)) {
          throw new Error(
            `Invalid image alignment "${value}", expected left, center or right`
          );
        }
        attributes.align = value as MediaAttributes['align'];
        break;
      default:
        throw new Error(
          `Unknown image attribute "${key}", expected width or align`
        );
    }
  }

  return attributes;
};

/**
 * Renders an image or a video (.mp4, .webm) with optional attributes.
 */
export const renderMedia = (
  href: string | null,
  alt: string,
  attributes: MediaAttributes = {}
): string => {
  const src = href?.replace(/^\//, '') || '';
  const className = ['default', attributes.align && `align-${attributes.align}`]
    .filter((o) => o)
    .join(' ');
  const style = attributes.width ? `width: ${attributes.width}` : '';

  const isVideo = ['.mp4', '.webm'].some((o) => src.endsWith(o));
  return (isVideo ? template.video : template.image)({
    src,
    alt,
    className,
    style,
  });
};
