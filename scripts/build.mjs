import { lstatSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkCatalog, generatedFiles } from './validate.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

export function buildCatalog(root = repoRoot) {
  const dist = join(root, 'dist');
  if (!lstatSync(dist, { throwIfNoEntry: false })) mkdirSync(dist);
  const { count, files } = generatedFiles(root);
  for (const [path] of files) {
    const stat = lstatSync(path, { throwIfNoEntry: false });
    if (stat && !stat.isFile()) throw new Error(`${path}: expected a regular file`);
  }
  for (const [path, contents] of files) writeFileSync(path, contents);
  return count;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const check = args[0] === '--check';
    if (check) args.shift();
    if (args.length > 1 || args[0]?.startsWith('--')) throw new Error('Usage: node scripts/build.mjs [--check] [catalog-dir]');
    const root = args[0];
    if (check) {
      console.log(`Generated files are current for ${checkCatalog(root)} tools`);
    } else {
      console.log(`Built dist/tools.json and README.md from ${buildCatalog(root)} tools`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
