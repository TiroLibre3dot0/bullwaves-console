const fs = require('fs');
const content = fs.readFileSync('public/Media Report.csv', 'utf8');
const lines = content.split('\n').slice(1, 100); // Prime 100 righe di dati

let totalPL = 0;
let count = 0;
let positivePL = 0;
let negativePL = 0;

lines.forEach(line => {
  if (line.trim()) {
    const cols = line.split(',');
    if (cols.length >= 21) { // PL è alla colonna 20 (0-based)
      const pl = parseFloat(cols[20].replace(/"/g, ''));
      if (!isNaN(pl)) {
        totalPL += pl;
        count++;
        if (pl > 0) positivePL++;
        if (pl < 0) negativePL++;
      }
    }
  }
});

console.log('Righe analizzate:', count);
console.log('PL totale:', totalPL);
console.log('PL positivi:', positivePL);
console.log('PL negativi:', negativePL);
console.log('PL medio:', count > 0 ? totalPL / count : 0);