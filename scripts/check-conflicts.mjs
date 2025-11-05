import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const conflictMarkers = ['<<' + '<<<<<', '='.repeat(7), '>>' + '>>>>'];

async function walk(dir, ignore = new Set(['.git', 'node_modules'])) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignore.has(entry.name)) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath, ignore));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

let hasConflicts = false;
const files = await walk('.');

for (const file of files) {
  const contents = await readFile(file, 'utf8');
  if (conflictMarkers.some(marker => contents.includes(marker))) {
    hasConflicts = true;
    console.error(`Conflict marker found in ${file}`);
  }
}

if (hasConflicts) {
  console.error('\nResolve the conflicts before continuing.');
  process.exitCode = 1;
} else {
  console.log('No merge conflict markers detected.');
}
