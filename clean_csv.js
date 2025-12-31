const fs = require('fs');
const path = 'public/Payments Report.csv';

const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n').filter(line => line.trim());

console.log('Righe originali:', lines.length);

// Rimuovi duplicati basati su ID, mantenendo la prima occorrenza
const seenIds = new Set();
const uniqueLines = [];

for (const line of lines) {
  const cols = line.split(',');
  if (cols.length >= 2) {
    const id = cols[1].trim().replace(/"/g, '');
    if (!seenIds.has(id) || id === 'id') {
      seenIds.add(id);
      uniqueLines.push(line);
    }
  } else {
    uniqueLines.push(line);
  }
}

console.log('Righe dopo rimozione duplicati:', uniqueLines.length);
console.log('Duplicati rimossi:', lines.length - uniqueLines.length);

// Scrivi il file pulito
const newContent = uniqueLines.join('\n');
fs.writeFileSync(path, newContent, 'utf8');

console.log('File Payments Report.csv pulito con successo!');