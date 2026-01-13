// Analyze Comments report: which affiliates gained/lost most users
// Usage: npm run analyze:comments

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

const COMMENTS_PATH = path.resolve(__dirname, '..', 'public', 'comments.csv');
const REPORTS_DIR = path.resolve(__dirname, '..', 'reports');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function toInt(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function isValidTransfer(row) {
  const fromId = toInt(row.from_affiliate_id);
  const toId = toInt(row.to_affiliate_id);
  if (fromId === null || toId === null) return false;
  if (fromId === toId) return false;
  return true;
}

async function analyze() {
  console.log('=== Analisi Report: Comments ===');
  console.log('File:', COMMENTS_PATH);
  if (!fs.existsSync(COMMENTS_PATH)) {
    console.error('Errore: file non trovato');
    process.exit(1);
  }

  const inbound = new Map(); // to_affiliate_id -> count
  const outbound = new Map(); // from_affiliate_id -> count
  const flows = new Map(); // `${from} -> ${to}` -> count
  const usersMoved = new Set();

  let totalRows = 0;
  let transferRows = 0;

  await new Promise((resolve, reject) => {
    const parser = fs
      .createReadStream(COMMENTS_PATH)
      .pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          relax_quotes: true,
        })
      );

    parser.on('data', (row) => {
      totalRows++;
      if (!isValidTransfer(row)) return;
      transferRows++;

      const fromId = toInt(row.from_affiliate_id);
      const toId = toInt(row.to_affiliate_id);
      const user = row.bullwaves_user || row.bullwaves_id;
      if (user) usersMoved.add(String(user));

      inbound.set(toId, (inbound.get(toId) || 0) + 1);
      outbound.set(fromId, (outbound.get(fromId) || 0) + 1);

      const key = `${fromId} -> ${toId}`;
      flows.set(key, (flows.get(key) || 0) + 1);
    });

    parser.on('end', resolve);
    parser.on('error', reject);
  });

  // Build affiliate stats
  const allAffiliates = new Set([...inbound.keys(), ...outbound.keys()]);
  const stats = [];
  for (const affId of [...allAffiliates].sort((a, b) => a - b)) {
    const inCnt = inbound.get(affId) || 0;
    const outCnt = outbound.get(affId) || 0;
    stats.push({
      affiliate_id: affId,
      inbound: inCnt,
      outbound: outCnt,
      net: inCnt - outCnt,
    });
  }

  // Sort for views
  const byInbound = [...stats].sort((a, b) => b.inbound - a.inbound);
  const byOutbound = [...stats].sort((a, b) => b.outbound - a.outbound);
  const byNet = [...stats].sort((a, b) => b.net - a.net);

  // Report to console
  console.log(`\nTotale righe: ${totalRows}`);
  console.log(`Trasferimenti validi: ${transferRows}`);
  console.log(`Utenti unici trasferiti: ${usersMoved.size}`);
  console.log(`Affiliati unici coinvolti: ${allAffiliates.size}`);

  console.log('\nTop 10 affiliati per utenti acquisiti (inbound):');
  byInbound.slice(0, 10).forEach((r, i) => {
    console.log(`${String(i + 1).padStart(2)}. ${r.affiliate_id}: ${r.inbound} (net ${r.net})`);
  });

  console.log('\nTop 10 affiliati per utenti persi (outbound):');
  byOutbound.slice(0, 10).forEach((r, i) => {
    console.log(`${String(i + 1).padStart(2)}. ${r.affiliate_id}: ${r.outbound} (net ${r.net})`);
  });

  console.log('\nTop 10 affiliati per netto (inbound - outbound):');
  byNet.slice(0, 10).forEach((r, i) => {
    console.log(`${String(i + 1).padStart(2)}. ${r.affiliate_id}: net ${r.net} (in ${r.inbound}, out ${r.outbound})`);
  });

  // Export files
  ensureDir(REPORTS_DIR);

  const statsCsvPath = path.join(REPORTS_DIR, 'comments_affiliate_metrics.csv');
  const flowsCsvPath = path.join(REPORTS_DIR, 'comments_flows.csv');
  const summaryMdPath = path.join(REPORTS_DIR, 'comments_summary.md');

  const statsHeader = 'affiliate_id,inbound,outbound,net\n';
  const statsCsv = statsHeader + stats.map(s => `${s.affiliate_id},${s.inbound},${s.outbound},${s.net}`).join('\n') + '\n';
  fs.writeFileSync(statsCsvPath, statsCsv, 'utf8');

  const flowsHeader = 'flow,count\n';
  const flowsSorted = [...flows.entries()].sort((a, b) => b[1] - a[1]);
  const flowsCsv = flowsHeader + flowsSorted.map(([k, v]) => `${k},${v}`).join('\n') + '\n';
  fs.writeFileSync(flowsCsvPath, flowsCsv, 'utf8');

  const topInbound = byInbound[0];
  const topOutbound = byOutbound[0];
  const bestNet = byNet[0];
  const worstNet = byNet[byNet.length - 1];

  const summary = `# Comments Report — Insights\n\n` +
    `- Totale righe: ${totalRows}\n` +
    `- Trasferimenti validi: ${transferRows}\n` +
    `- Utenti unici trasferiti: ${usersMoved.size}\n` +
    `- Affiliati unici coinvolti: ${allAffiliates.size}\n\n` +
    `- Top inbound (più utenti ricevuti): Affiliate ${topInbound.affiliate_id} — ${topInbound.inbound}\n` +
    `- Top outbound (più utenti persi): Affiliate ${topOutbound.affiliate_id} — ${topOutbound.outbound}\n` +
    `- Miglior netto: Affiliate ${bestNet.affiliate_id} — net ${bestNet.net} (in ${bestNet.inbound}, out ${bestNet.outbound})\n` +
    `- Peggior netto: Affiliate ${worstNet.affiliate_id} — net ${worstNet.net} (in ${worstNet.inbound}, out ${worstNet.outbound})\n`;

  fs.writeFileSync(summaryMdPath, summary, 'utf8');

  console.log('\n=== Esportazione completata ===');
  console.log('Metriche per affiliato:', statsCsvPath);
  console.log('Flussi da -> a:', flowsCsvPath);
  console.log('Sommario:', summaryMdPath);
}

analyze().catch((err) => {
  console.error('Errore durante l\'analisi:', err);
  process.exit(1);
});
