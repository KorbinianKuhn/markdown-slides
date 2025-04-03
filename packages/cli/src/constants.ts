import { join } from 'path';

const root = join(__dirname, '../../');

export const Constants = {
  ROOT_DIRECTORY: root,
  BUILD_DIRECTORY: join(root, 'dist'),
  TEMPLATES_DIRECTORY: join(root, 'src/templates'),
};
