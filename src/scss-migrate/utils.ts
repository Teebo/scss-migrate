import { renderSync } from 'sass';
import * as fs from 'fs';
import * as path from 'path';

export const scssToCss = (filename: string): string => {
  const data = fs.readFileSync(path.resolve(filename)).toString();
  const result = renderSync({ data });
  return result.css.toString();
}