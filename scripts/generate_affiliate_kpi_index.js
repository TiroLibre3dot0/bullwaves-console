// Generates a lightweight affiliate KPI index for dashboard lookups
// Reads from public/Payments Report.csv and public/KPI Report.csv
// Outputs public/affiliate_kpi_index.json

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const PUBLIC_DIR = path.join(__dirname, '../public');
const PAYMENTS_REPORT = path.join(PUBLIC_DIR, 'Payments Report.csv');
const KPI_REPORT = path.join(PUBLIC_DIR, 'KPI Report.csv');
const OUT_PATH = path.join(PUBLIC_DIR, 'affiliate_kpi_index.json');

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
  const paymentsRows = readCsv(PAYMENTS_REPORT);
  const kpiRows = readCsv(KPI_REPORT);
  const index = {};

  [...paymentsRows, ...kpiRows].forEach(row => {
    const affiliateId = normalizeId(row.affiliate_id || row['Affiliate ID'] || row.affiliateid);
    if (!affiliateId) return;
    if (!index[affiliateId]) index[affiliateId] = {};
    index[affiliateId] = {
      name: row.affiliate || row['Affiliate'] || row.affiliate_name || '',
      total_commissions: Number(row.commissions || row['Commissions'] || row.total_commissions || 0),
      kpi: row.kpi || row['KPI'] || '',
      deposits: Number(row.deposits || row['Deposits'] || 0),
      net_revenue: Number(row.net_revenue || row['Net Revenue'] || 0),
      users: Number(row.users || row['Users'] || 0),
    };
  });
  return index;
}

function main() {
  if (!FORCE && fs.existsSync(OUT_PATH)) {
    try {
      const outMt = fs.statSync(OUT_PATH).mtimeMs;
      const inputsMt = Math.max(
        fs.existsSync(PAYMENTS_REPORT) ? fs.statSync(PAYMENTS_REPORT).mtimeMs : 0,
        fs.existsSync(KPI_REPORT) ? fs.statSync(KPI_REPORT).mtimeMs : 0
      );
      if (outMt >= inputsMt) {
        console.log(`Affiliate KPI index up-to-date (use --force to regenerate) -> ${path.relative(process.cwd(), OUT_PATH)}`);
        return;
      }
    } catch {
      // Fall through to regeneration.
    }
  }

  const index = buildIndex();
  fs.writeFileSync(OUT_PATH, JSON.stringify(index, null, 2));
  console.log(`Generated ${Object.keys(index).length} affiliate KPIs -> ${path.relative(process.cwd(), OUT_PATH)}`);
}

if (require.main === module) main();
