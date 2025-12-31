const fs = require('fs');
const csv = fs.readFileSync('public/Registrations Report.csv', 'utf8');
const lines = csv.split('\n').slice(1, 1000);

const names = new Map();
const deposits = [];

lines.forEach((line, index) => {
  if (!line.trim()) return;
  const cols = line.split('","').map(col => col.replace(/"/g, ''));
  if (cols.length < 6) return;

  const name = cols[1];
  const country = cols[5];
  const affiliate = cols[7];
  const netDeposits = parseFloat(cols[12].replace(/,/g, '')) || 0;
  const depositCount = parseInt(cols[13]) || 0;

  if (!names.has(name)) names.set(name, []);
  names.get(name).push({ country, affiliate, netDeposits, depositCount, line: index + 2 });

  if (netDeposits > 1000) {
    deposits.push({ name, country, affiliate, netDeposits, depositCount, line: index + 2 });
  }
});

const duplicateNames = Array.from(names.entries())
  .filter(([name, entries]) => entries.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log('🔍 PATTERN IDENTIFICATI NEL REGISTRATIONS REPORT:');
console.log('==================================================\n');

console.log('1. 👥 UTENTI CON STESSO NOME (possibile multi-accounting):');
duplicateNames.slice(0, 10).forEach(([name, entries]) => {
  console.log(`   ${name}: ${entries.length} account`);
  entries.forEach(entry => {
    console.log(`     - Paese: ${entry.country}, Affiliate: ${entry.affiliate}, Depositi: €${entry.netDeposits}`);
  });
});

console.log('\n2. 💰 DEPOSITI ELEVATI (> €1000):');
deposits.slice(0, 10).forEach(dep => {
  console.log(`   ${dep.name} (${dep.country}): €${dep.netDeposits} in ${dep.depositCount} depositi`);
});