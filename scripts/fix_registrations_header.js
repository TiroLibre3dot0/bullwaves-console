const fs = require('fs');
const path = require('path');

const inPath = path.join(__dirname, '..', 'public', 'Registrations Report.csv');
const outPath = path.join(__dirname, '..', 'public', 'Registrations Report.fixed.csv');

if (!fs.existsSync(inPath)) {
  console.error('Input file not found:', inPath);
  process.exit(1);
}

const text = fs.readFileSync(inPath, 'utf8');
const lines = text.split(/\r?\n/);
if (lines.length === 0) {
  console.error('Empty file');
  process.exit(1);
}

const first = lines[0];
let newHeader = first;

if (first.startsWith('"') && first.endsWith('"')) {
  // remove outer quotes then normalize common problematic patterns
  let inner = first.slice(1, -1);
  // some headers are separated by ,"" (comma + double double-quote) — normalize to ','"' so split works
  inner = inner.replace(/,\"\"/g, '\\",\\"');
  const parts = inner.split('\",\"');
  const cleaned = parts.map(h => {
    // replace doubled quotes with single
    let s = h.replace(/""/g, '"');
    // trim stray quotes and whitespace
    s = s.replace(/^\"+|\"+$/g, '').trim();
    return s;
  });
  newHeader = cleaned.join(',');
} else {
  // fallback: collapse common patterns
  newHeader = first.replace(/\"\s*,\s*\"/g, ',').replace(/\"\"/g, '"').replace(/^\"+|\"+$/g, '');
}

const outLines = [newHeader, ...lines.slice(1)];
fs.writeFileSync(outPath, outLines.join('\n'), 'utf8');
console.log('Wrote fixed CSV:', outPath);
