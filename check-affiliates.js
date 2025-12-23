const fs = require('fs');
const path = require('path');

// Funzione per leggere e parsare CSV semplice
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      rows.push(row);
    }
  }
  return rows;
}

console.log('🔍 Controllo corrispondenze ID Affiliati vs Nomi...\n');

const results = {
  payments: {},
  media: {},
  conflicts: [],
  uniqueIds: new Set()
};

try {
  // Carica Payments Report
  const paymentsPath = path.join(__dirname, 'public', 'Payments Report.csv');
  if (fs.existsSync(paymentsPath)) {
    console.log('📊 Caricamento Payments Report...');
    const paymentsContent = fs.readFileSync(paymentsPath, 'utf8');
    const paymentsData = parseCSV(paymentsContent);
    console.log(`✅ Payments Report: ${paymentsData.length} righe caricate`);

    paymentsData.forEach(row => {
      const affiliateId = row['Affiliate ID'] || row['AffiliateID'] || row['ID'] || row['UID'];
      const affiliateName = row['Affiliate'] || row['Affiliate Name'] || row['Name'];

      if (affiliateId && affiliateId.trim()) {
        const idStr = affiliateId.trim();
        results.uniqueIds.add(idStr);

        if (!results.payments[idStr]) {
          results.payments[idStr] = new Set();
        }
        if (affiliateName && affiliateName.trim()) {
          results.payments[idStr].add(affiliateName.trim());
        }
      }
    });
  } else {
    console.log('⚠️  Payments Report non trovato');
  }

  // Carica Media Report
  const mediaPath = path.join(__dirname, 'public', 'Media Report.csv');
  if (fs.existsSync(mediaPath)) {
    console.log('📺 Caricamento Media Report...');
    const mediaContent = fs.readFileSync(mediaPath, 'utf8');
    const mediaData = parseCSV(mediaContent);
    console.log(`✅ Media Report: ${mediaData.length} righe caricate`);

    mediaData.forEach(row => {
      const affiliateId = row['UID'] || row['Affiliate ID'] || row['AffiliateID'] || row['ID'];
      const affiliateName = row['Affiliate'] || row['Affiliate Name'] || row['Name'];

      if (affiliateId && affiliateId.trim()) {
        const idStr = affiliateId.trim();
        results.uniqueIds.add(idStr);

        if (!results.media[idStr]) {
          results.media[idStr] = new Set();
        }
        if (affiliateName && affiliateName.trim()) {
          results.media[idStr].add(affiliateName.trim());
        }
      }
    });
  } else {
    console.log('⚠️  Media Report non trovato');
  }

  // Analizza i risultati
  console.log(`\n📈 Risultati:`);
  console.log(`   ID unici trovati: ${results.uniqueIds.size}`);

  // Trova conflitti
  for (const id of results.uniqueIds) {
    const paymentsNames = results.payments[id] || new Set();
    const mediaNames = results.media[id] || new Set();
    const allNames = new Set([...paymentsNames, ...mediaNames]);

    if (allNames.size > 1) {
      results.conflicts.push({
        id,
        payments: Array.from(paymentsNames),
        media: Array.from(mediaNames),
        allNames: Array.from(allNames)
      });
    }
  }

  console.log(`   Conflitti trovati: ${results.conflicts.length}`);

  // Mostra esempio specifico (ID 2287)
  const exampleId = '2287';
  if (results.uniqueIds.has(exampleId)) {
    console.log(`\n🎯 Esempio ID ${exampleId}:`);
    console.log(`   Payments: ${Array.from(results.payments[exampleId] || []).join(', ') || 'N/A'}`);
    console.log(`   Media: ${Array.from(results.media[exampleId] || []).join(', ') || 'N/A'}`);
  } else {
    console.log(`\n❌ ID ${exampleId} non trovato in nessun report`);
  }

  // Mostra alcuni conflitti
  if (results.conflicts.length > 0) {
    console.log(`\n⚠️  Primi 5 conflitti trovati:`);
    results.conflicts.slice(0, 5).forEach(conflict => {
      console.log(`   ID ${conflict.id}: ${conflict.allNames.join(' | ')}`);
    });
  }

  // Mostra distribuzione
  const paymentsOnly = Object.keys(results.payments).filter(id => !results.media[id]);
  const mediaOnly = Object.keys(results.media).filter(id => !results.payments[id]);
  const both = Object.keys(results.payments).filter(id => results.media[id]);

  console.log(`\n📊 Distribuzione:`);
  console.log(`   Solo in Payments: ${paymentsOnly.length}`);
  console.log(`   Solo in Media: ${mediaOnly.length}`);
  console.log(`   In entrambi: ${both.length}`);

} catch (error) {
  console.error('❌ Errore durante il controllo:', error.message);
}