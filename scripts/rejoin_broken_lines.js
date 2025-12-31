const fs = require('fs');
const Papa = require('papaparse');
const inPath = 'tmp_full_paste.csv';
const outPath = 'tmp_full_paste_rejoined.csv';
const raw = fs.readFileSync(inPath,'utf8');
const rawLines = raw.split(/\r?\n/);
if(rawLines.length===0) process.exit(1);
// Determine header fields count by parsing first non-empty line
let headerLineIndex = 0;
while(headerLineIndex < rawLines.length && rawLines[headerLineIndex].trim()==='') headerLineIndex++;
const headerParse = Papa.parse(rawLines[headerLineIndex], {delimiter: ',', quoteChar: '"', skipEmptyLines: false});
const expected = headerParse.data[0].length;
const out = [];
// push header as-is
out.push(rawLines[headerLineIndex]);
let i = headerLineIndex + 1;
while(i < rawLines.length){
  if(rawLines[i].trim()===''){ i++; continue; }
  let candidate = rawLines[i];
  let fields = Papa.parse(candidate, {delimiter: ',', quoteChar: '"', skipEmptyLines:false}).data[0] || [];
  let j = i+1;
  while(fields.length > 0 && fields.length < expected && j < rawLines.length){
    candidate += '\n' + rawLines[j];
    fields = Papa.parse(candidate, {delimiter: ',', quoteChar: '"', skipEmptyLines:false}).data[0] || [];
    j++;
  }
  if(fields.length === expected){
    out.push(candidate);
    i = j;
  } else {
    // give up: push as-is and move on
    out.push(candidate);
    i = j;
  }
}
fs.writeFileSync(outPath, out.join('\n'), 'utf8');
console.log('Rejoined lines:', rawLines.length, '->', out.length, 'expected columns:', expected);
