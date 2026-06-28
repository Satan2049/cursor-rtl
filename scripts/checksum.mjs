import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const vsixFiles = readdirSync('.').filter((file) => file.endsWith('.vsix')).sort();
const vsix = vsixFiles[vsixFiles.length - 1];

if (!vsix) {
    console.error('No .vsix file found. Run npm run package first.');
    process.exit(1);
}

const data = readFileSync(vsix);
const hash = createHash('sha256').update(data).digest('hex').toUpperCase();
const line = `${vsix}  ${hash}\n`;

writeFileSync('checksums.sha256', line);
console.log(line.trim());
