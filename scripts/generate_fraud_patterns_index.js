// Generates a lightweight fraud patterns index for dashboard lookups
// Reads from public/Fraud Report.csv and public/Chargebacks Report.csv
// Outputs public/fraud_patterns_index.json

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const PUBLIC_DIR = path.join(__dirname, '../public');
const FRAUD_REPORT = path.join(PUBLIC_DIR, 'Fraud Report.csv');
const CHARGEBACKS_REPORT = path.join(PUBLIC_DIR, 'Chargebacks Report.csv');
const OUT_PATH = path.join(PUBLIC_DIR, 'fraud_patterns_index.json');

const FORCE = process.argv.includes('--force');

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const text = fs.readFileSync(filePath, 'utf8');
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
  return data;
}

function normalizeId(id) {
  return String(id).trim().toLowerCase();
}

function buildIndex() {
  const fraudRows = readCsv(FRAUD_REPORT);
  const chargebackRows = readCsv(CHARGEBACKS_REPORT);
  const index = {};

  [...fraudRows, ...chargebackRows].forEach(row => {
    const userId = normalizeId(row.user_id || row['User ID'] || row.userid);
    if (!userId) return;
    index[userId] = {
      reason: row.reason || row['Fraud Reason'] || row.chargeback_reason || '',
      amount: Number(row.amount || row['Amount'] || 0),
      date: row.date || row['Date'] || '',
      type: row.type || row['Type'] || (row.chargeback_reason ? 'chargeback' : 'fraud'),
    };
  });
  return index;
}

function main() {
  if (!FORCE && fs.existsSync(OUT_PATH)) {
    try {
      const outMt = fs.statSync(OUT_PATH).mtimeMs;
      const inputsMt = Math.max(
        fs.existsSync(FRAUD_REPORT) ? fs.statSync(FRAUD_REPORT).mtimeMs : 0,
        fs.existsSync(CHARGEBACKS_REPORT) ? fs.statSync(CHARGEBACKS_REPORT).mtimeMs : 0
      );
      if (outMt >= inputsMt) {
        console.log(`Fraud patterns index up-to-date (use --force to regenerate) -> ${path.relative(process.cwd(), OUT_PATH)}`);
        return;
      }
    } catch {
      // Fall through to regeneration.
    }
  }

  const index = buildIndex();
  fs.writeFileSync(OUT_PATH, JSON.stringify(index, null, 2));
  console.log(`Generated ${Object.keys(index).length} fraud patterns -> ${path.relative(process.cwd(), OUT_PATH)}`);
}

if (require.main === module) main();
