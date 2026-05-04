/**
 * generate_prime_email_index.js
 * Reads prime_clients_ranking_table.json (local, gitignored 81MB file)
 * and outputs a lightweight prime_email_index.json with just clientId→email
 * and normalizedClientName→email mappings.
 *
 * Usage: node scripts/generate_prime_email_index.js
 * Output: public/prime_email_index.json
 */

const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, '..', 'public', 'prime_clients_ranking_table.json');
const OUTPUT = path.join(__dirname, '..', 'public', 'prime_email_index.json');

if (!fs.existsSync(INPUT)) {
  console.error('Input file not found:', INPUT);
  console.error('Regenerate prime_clients_ranking_table.json first, or point to the Excel source.');
  process.exit(1);
}

console.log('Reading', INPUT, '...');
const data = JSON.parse(fs.readFileSync(INPUT, 'utf8'));

const headers = data.headers || [];
const rows = data.rows || [];

const idIdx     = headers.indexOf('client_id');
const nameIdx   = headers.indexOf('client_name');
const emailIdx  = headers.indexOf('client_email');

if (idIdx < 0 || nameIdx < 0 || emailIdx < 0) {
  console.error('Missing required columns. Found headers:', headers);
  process.exit(1);
}

const normalize = (s) =>
  String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const byId   = {};
const byName = {};
let total = 0;

for (const row of rows) {
  const clientId    = String(row[idIdx]  || '').trim();
  const clientName  = String(row[nameIdx]|| '').trim();
  const email       = String(row[emailIdx]|| '').trim();

  if (!email || !email.includes('@')) continue;

  total++;
  if (clientId && !byId[clientId]) {
    byId[clientId] = email;
  }
  if (clientName) {
    const key = normalize(clientName);
    if (key && !byName[key]) {
      byName[key] = email;
    }
  }
}

const output = { byId, byName };
fs.writeFileSync(OUTPUT, JSON.stringify(output), 'utf8');

const sizeMb = (fs.statSync(OUTPUT).size / 1024 / 1024).toFixed(2);
console.log(`Done. ${total} email rows processed.`);
console.log(`Unique clientIds: ${Object.keys(byId).length}`);
console.log(`Unique clientNames: ${Object.keys(byName).length}`);
console.log(`Output: ${OUTPUT} (${sizeMb} MB)`);
