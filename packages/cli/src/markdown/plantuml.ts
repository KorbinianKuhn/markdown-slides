import plantumlEncoder from 'plantuml-encoder';
import { logger } from './../logger';

const plantUMLHttpRequest = async (
  encodedUML: string,
  type: 'dsvg' | 'svg'
) => {
  const url = `https://www.plantuml.com/plantuml/${type}/${encodedUML}`;
  logger.info(`Convert PlantUML to SVG: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  const svg = await response.text();
  return svg;
};

export const plantUMLtoSVG = async (
  content: string
): Promise<{ light: string; dark: string }> => {
  const encoded = plantumlEncoder.encode(content);

  const light = await plantUMLHttpRequest(encoded, 'svg');
  const dark = await plantUMLHttpRequest(encoded, 'dsvg');

  return {
    light,
    dark,
  };
};
