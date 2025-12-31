const fs = require('fs');
const inPath = 'tmp_full_paste.csv';
const outPath = 'tmp_full_paste_normalized.csv';
const raw = fs.readFileSync(inPath,'utf8');
const lines = raw.split(/\r?\n/);
const out = [];
let buf = '';
let quotes = 0;
for (let i=0;i<lines.length;i++){
  const line = lines[i];
  if (buf.length>0) buf += '\n' + line; else buf = line;
  // count quotes in buffer
  quotes = (buf.match(/\"/g)||[]).length;
  if (quotes % 2 === 0){
    out.push(buf);
    buf = '';
  } else {
    // keep accumulating
  }
}
if (buf.length>0) out.push(buf);
fs.writeFileSync(outPath, out.join('\n'), 'utf8');
console.log('Normalized lines:', lines.length, '->', out.length);
