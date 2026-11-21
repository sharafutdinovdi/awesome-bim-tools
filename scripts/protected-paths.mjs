import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function checkProtectedPaths(author, changes, modificationsOnly = false) {
  if (!/^[A-Za-z0-9-]+(?:\[bot\])?$/.test(author ?? '')) throw new Error('Expected a pull request author login');
  if (author === 'sharafutdinovdi') return;
  if (changes === '') return;
  if (!changes.endsWith('\0')) throw new Error('Expected NUL-terminated paths from git diff');
  for (const path of changes.slice(0, -1).split('\0')) {
    if (path !== path.normalize('NFC') || path !== path.normalize('NFKC')) {
      throw new Error('External pull request paths must already be NFC and NFKC normalized');
    }
    if (!path.endsWith('.json') || !/^tools\/(?=[a-z0-9-]{1,60}\.json$)[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(path)) {
      throw new Error('External pull requests may only modify existing tools/<slug>.json files');
    }
    if (modificationsOnly) throw new Error('External pull requests may not add, remove or change the type of a tool file');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [author, option, ...rest] = process.argv.slice(2);
    if (rest.length || (option !== undefined && option !== '--reject-non-modifications')) {
      throw new Error('Usage: node scripts/protected-paths.mjs <author> [--reject-non-modifications]');
    }
    const changes = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(readFileSync(0));
    checkProtectedPaths(author, changes, option !== undefined);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
