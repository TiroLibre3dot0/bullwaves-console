const fs = require('fs');
const path = 'public/Payments Report.csv';

const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n').filter(line => line.trim());

console.log('Righe attuali:', lines.length);

// Conta duplicati per ID
const idCount = new Map();
for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(',');
  if (cols.length >= 2) {
    const id = cols[1].replace(/"/g, '').trim();
    idCount.set(id, (idCount.get(id) || 0) + 1);
  }
}

let totalDuplicates = 0;
for (const [id, count] of idCount) {
  if (count > 1) {
    console.log('ID', id, 'appare', count, 'volte');
    totalDuplicates += count - 1;
  }
}

console.log('Duplicati totali rimanenti:', totalDuplicates);