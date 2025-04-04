import { exec } from 'child_process';
import { readFile, unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { logger } from '../logger.js';

const mermaidToSvgFile = async (
  mermaidCode: string,
  theme?: string
): Promise<string> => {
  const tempFile = join(tmpdir(), `mermaid-${Date.now()}.mmd`);
  const outputFile = tempFile.replace('.mmd', '.svg');

  try {
    await writeFile(tempFile, mermaidCode, 'utf-8');

    await new Promise<void>((resolve, reject) => {
      const args = [
        `-i ${tempFile}`,
        `-o ${outputFile}`,
        theme ? `-t ${theme}` : '',
        // '-b transparent',
      ];
      const cmd = `npx mmdc ${args.join(' ')}`;
      logger.info(`Executing: ${cmd}`);
      exec(cmd, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    return readFile(outputFile, 'utf-8');
  } finally {
    // Clean up temporary files
    await unlink(tempFile).catch(() => {});
    await unlink(outputFile).catch(() => {});
  }
};

export const mermaidToSvg = async (
  mermaidCode: string
): Promise<{ light: string; dark: string }> => {
  const light = await mermaidToSvgFile(mermaidCode);
  const dark = await mermaidToSvgFile(mermaidCode, 'dark');
  return { light, dark };
};
