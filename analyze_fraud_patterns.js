const fs = require('fs');
const path = require('path');

// Leggi il file CSV
const csvPath = path.join(__dirname, 'public', 'Registrations Report.csv');
const csvData = fs.readFileSync(csvPath, 'utf8');
const lines = csvData.split('\n').filter(line => line.trim());

// Parsing delle righe
const data = [];
for (let i = 1; i < lines.length; i++) { // Salta header
  const cols = lines[i].split('","').map(col => col.replace(/"/g, ''));
  if (cols.length >= 8) {
    data.push({
      userId: cols[0],
      name: cols[1],
      mt5Account: cols[2],
      country: cols[5],
      affiliate: cols[7],
      netDeposits: parseFloat(cols[12].replace(/,/g, '')) || 0,
      depositCount: parseInt(cols[13]) || 0
    });
  }
}

console.log(`📊 ANALISI COMPLETA REGISTRATIONS REPORT (${data.length} record)\n`);

// 1. MULTI-ACCOUNTING PER NOME
const nameCounts = {};
data.forEach(row => {
  if (!nameCounts[row.name]) nameCounts[row.name] = [];
  nameCounts[row.name].push(row);
});

const multiNameCases = Object.entries(nameCounts)
  .filter(([name, accounts]) => accounts.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log('🚨 1. MULTI-ACCOUNTING PER NOME:');
multiNameCases.slice(0, 10).forEach(([name, accounts]) => {
  const countries = [...new Set(accounts.map(a => a.country))];
  const affiliates = [...new Set(accounts.map(a => a.affiliate))];
  console.log(`   ${name}: ${accounts.length} account`);
  console.log(`     Paesi: ${countries.join(', ')}`);
  console.log(`     Affiliate: ${affiliates.join(', ')}\n`);
});

// 2. AFFILIATE CON MOLTI ACCOUNT
const affiliateCounts = {};
data.forEach(row => {
  if (!affiliateCounts[row.affiliate]) affiliateCounts[row.affiliate] = [];
  affiliateCounts[row.affiliate].push(row);
});

const topAffiliates = Object.entries(affiliateCounts)
  .filter(([affiliate, accounts]) => accounts.length > 10)
  .sort((a, b) => b[1].length - a[1].length);

console.log('🚨 2. AFFILIATE CON ALTA CONCENTRAZIONE DI ACCOUNT:');
topAffiliates.slice(0, 10).forEach(([affiliate, accounts]) => {
  const countries = [...new Set(accounts.map(a => a.country))];
  const avgDeposits = accounts.reduce((sum, a) => sum + a.netDeposits, 0) / accounts.length;
  console.log(`   Affiliate ${affiliate}: ${accounts.length} account`);
  console.log(`     Paesi principali: ${countries.slice(0, 3).join(', ')}`);
  console.log(`     Depositi medi: $${avgDeposits.toFixed(2)}\n`);
});

// 3. PAESI CON ALTA CONCENTRAZIONE
const countryCounts = {};
data.forEach(row => {
  if (!countryCounts[row.country]) countryCounts[row.country] = [];
  countryCounts[row.country].push(row);
});

const topCountries = Object.entries(countryCounts)
  .filter(([country, accounts]) => accounts.length > 50)
  .sort((a, b) => b[1].length - a[1].length);

console.log('🚨 3. PAESI CON ALTA CONCENTRAZIONE DI REGISTRAZIONI:');
topCountries.slice(0, 10).forEach(([country, accounts]) => {
  const affiliates = [...new Set(accounts.map(a => a.affiliate))];
  const avgDeposits = accounts.reduce((sum, a) => sum + a.netDeposits, 0) / accounts.length;
  console.log(`   ${country}: ${accounts.length} account`);
  console.log(`     Affiliate attivi: ${affiliates.length}`);
  console.log(`     Depositi medi: $${avgDeposits.toFixed(2)}\n`);
});

// 4. NOMI CON PATTERN SOSPETTI
const suspiciousPatterns = [
  /\d{4,}/, // Molti numeri consecutivi
  /test/i,
  /demo/i,
  /fake/i,
  /spam/i,
  /^[a-z]+\d+$/i, // Lettere seguite da numeri
  /^\d+[a-z]+$/i  // Numeri seguiti da lettere
];

const suspiciousNames = data.filter(row => {
  return suspiciousPatterns.some(pattern => pattern.test(row.name));
});

console.log('🚨 4. NOMI CON PATTERN SOSPETTI:');
suspiciousNames.slice(0, 10).forEach(row => {
  console.log(`   ${row.name} (${row.country}, Affiliate: ${row.affiliate})\n`);
});

// 5. STESSO NOME, PAESI DIVERSI
const crossBorderNames = multiNameCases.filter(([name, accounts]) => {
  const countries = [...new Set(accounts.map(a => a.country))];
  return countries.length > 1;
});

console.log('🚨 5. STESSO NOME, PAESI DIVERSI (POSSIBILE TRAFFICO INTERNAZIONALE):');
crossBorderNames.slice(0, 10).forEach(([name, accounts]) => {
  const countries = [...new Set(accounts.map(a => a.country))];
  console.log(`   ${name}: ${countries.join(' → ')} (${accounts.length} account totali)\n`);
});

// 6. AFFILIATE CON POCHI DEPOSITI MA MOLTI ACCOUNT
const lowDepositAffiliates = Object.entries(affiliateCounts)
  .filter(([affiliate, accounts]) => {
    const totalDeposits = accounts.reduce((sum, a) => sum + a.netDeposits, 0);
    const depositAccounts = accounts.filter(a => a.netDeposits > 0).length;
    return accounts.length > 5 && depositAccounts / accounts.length < 0.1; // Meno del 10% ha depositato
  })
  .sort((a, b) => b[1].length - a[1].length);

console.log('🚨 6. AFFILIATE CON BASSA ATTIVITÀ DEPOSITI (POSSIBILE SPAM/FARMING):');
lowDepositAffiliates.slice(0, 10).forEach(([affiliate, accounts]) => {
  const depositAccounts = accounts.filter(a => a.netDeposits > 0).length;
  const totalDeposits = accounts.reduce((sum, a) => sum + a.netDeposits, 0);
  console.log(`   Affiliate ${affiliate}: ${accounts.length} account, ${depositAccounts} depositi`);
  console.log(`     Volume totale depositi: $${totalDeposits.toFixed(2)}\n`);
});

// Output per il componente React
const fraudCases = [
  // Multi-accounting critico
  ...multiNameCases.filter(([name, accounts]) => accounts.length >= 10).map(([name, accounts]) => ({
    type: 'Multi-Accounting Critico',
    severity: 'CRITICAL',
    description: `${accounts.length} account con stesso nome`,
    details: `${name}: ${accounts.slice(0, 3).map(a => a.mt5Account).join(', ')}${accounts.length > 3 ? ` +${accounts.length - 3} altri` : ''}`,
    countries: [...new Set(accounts.map(a => a.country))],
    affiliates: [...new Set(accounts.map(a => a.affiliate))],
    accounts: accounts.map(a => a.mt5Account),
    checkType: 'Verifica manuale account, controllo documenti, analisi IP'
  })),
  // Affiliate con molti account
  ...topAffiliates.slice(0, 5).map(([affiliate, accounts]) => ({
    type: 'Affiliate Clustering',
    severity: 'HIGH',
    description: `${accounts.length} account da singolo affiliate`,
    details: `Affiliate ${affiliate}: ${accounts.length} registrazioni`,
    countries: [...new Set(accounts.map(a => a.country))],
    affiliates: [affiliate],
    accounts: accounts.slice(0, 5).map(a => a.mt5Account),
    checkType: 'Analisi comportamento affiliate, verifica fonti traffico'
  })),
  // Paesi ad alto rischio
  ...topCountries.slice(0, 3).map(([country, accounts]) => ({
    type: 'Concentrazione Geografica',
    severity: 'MEDIUM',
    description: `${accounts.length} account da ${country}`,
    details: `${country}: ${accounts.length} registrazioni concentrate`,
    countries: [country],
    affiliates: [...new Set(accounts.map(a => a.affiliate))].slice(0, 3),
    accounts: accounts.slice(0, 3).map(a => a.mt5Account),
    checkType: 'Verifica regolarità paese, controllo compliance locale'
  })),
  // Nomi cross-border
  ...crossBorderNames.slice(0, 5).map(([name, accounts]) => ({
    type: 'Attività Cross-Border',
    severity: 'MEDIUM',
    description: `Stesso nome in ${[...new Set(accounts.map(a => a.country))].length} paesi`,
    details: `${name}: ${[...new Set(accounts.map(a => a.country))].join(', ')}`,
    countries: [...new Set(accounts.map(a => a.country))],
    affiliates: [...new Set(accounts.map(a => a.affiliate))],
    accounts: accounts.map(a => a.mt5Account),
    checkType: 'Verifica identità, controllo documenti internazionali'
  }))
];

// Salva i risultati per il componente
fs.writeFileSync('fraud-analysis-results.json', JSON.stringify({
  totalRecords: data.length,
  fraudCases: fraudCases,
  summary: {
    multiAccountingCases: multiNameCases.length,
    highVolumeAffiliates: topAffiliates.length,
    highVolumeCountries: topCountries.length,
    suspiciousNames: suspiciousNames.length,
    crossBorderCases: crossBorderNames.length,
    lowDepositAffiliates: lowDepositAffiliates.length
  }
}, null, 2));

console.log('✅ Analisi completata. Risultati salvati in fraud-analysis-results.json');</content>
<parameter name="filePath">c:\Users\Famiglia Vullo\Visionaryos_Mother\Bullwaves_new\analyze_fraud_patterns.js