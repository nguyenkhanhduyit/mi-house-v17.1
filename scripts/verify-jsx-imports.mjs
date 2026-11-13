import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// fileURLToPath keeps the path valid on Windows; URL.pathname would yield
// "/C:/..." and break the directory walk.
const base = fileURLToPath(new URL('../src/', import.meta.url));
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(dir,e.name)) : e.name.endsWith('.jsx') ? [join(dir,e.name)] : []);
const files = walk(base);
const bad = files.filter(path => !/^import React(?:,\s*\{|\s+from)/m.test(readFileSync(path, 'utf8')));
console.log(`${files.length - bad.length}/${files.length} JSX files import React`);
if (bad.length) { console.error(bad.join('\n')); process.exitCode = 1; }
