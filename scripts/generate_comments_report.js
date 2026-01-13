// Generate a board-ready Markdown report from comments.csv, with charts and PDF
// Usage: npm run report:comments

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const puppeteer = require('puppeteer');
const { mdToPdf } = require('md-to-pdf');

const COMMENTS_PATH = path.resolve(__dirname, '..', 'public', 'comments.csv');
const REPORTS_DIR = path.resolve(__dirname, '..', 'reports');
const OUTPUT_MD = path.join(REPORTS_DIR, 'comments_board_report.md');
const OUTPUT_PDF = path.join(REPORTS_DIR, 'comments_board_report.pdf');
const IMAGES_DIR = path.join(REPORTS_DIR, 'images');

const CPA_EUR = 650; // average CPA in EUR

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

function fmt(num) {
  return new Intl.NumberFormat('it-IT').format(num);
}

function fmtEUR(num) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(num);
}

function asTable(rows, headers) {
  const headerLine = `| ${headers.join(' | ')} |`;
  const sepLine = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map(r => `| ${r.join(' | ')} |`).join('\n');
  return `${headerLine}\n${sepLine}\n${body}`;
}

async function renderBarChartPng({ title, labels, values, color = 'rgba(25, 118, 210, 0.8)', width = 1200, height = 600, outputPath }) {
  ensureDir(path.dirname(outputPath));
  const chartJsPath = path.resolve(__dirname, '..', 'node_modules', 'chart.js', 'dist', 'chart.umd.js');
  const chartJsCode = fs.readFileSync(chartJsPath, 'utf8');

  const html = `<!DOCTYPE html>
  <html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0}</style>
  <script>${chartJsCode}</script></head>
  <body>
    <canvas id="c" width="${width}" height="${height}"></canvas>
    <script>
      const ctx = document.getElementById('c').getContext('2d');
      const chart = new Chart(ctx, {
        type: 'bar',
        data: { labels: ${JSON.stringify(labels)}, datasets: [{ label: '${title}', data: ${JSON.stringify(values)}, backgroundColor: '${color}' }] },
        options: {
          responsive: false,
          plugins: {
            title: { display: true, text: '${title}' },
            legend: { display: false }
          },
          scales: {
            x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 } },
            y: { beginAtZero: true }
          }
        }
      });
    </script>
  </body></html>`;

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const canvas = await page.$('#c');
  await canvas.screenshot({ path: outputPath });
  await browser.close();
}

async function run() {
  console.log('Preparing Comments board report...');
  if (!fs.existsSync(COMMENTS_PATH)) {
    console.error('File not found:', COMMENTS_PATH);
    process.exit(1);
  }

  const inbound = new Map(); // to_affiliate_id -> count
  const outbound = new Map(); // from_affiliate_id -> count
  const flows = new Map(); // `${from} -> ${to}` -> count
  const users = new Set();
  let firstDate = null;
  let lastDate = null;

  let totalRows = 0;
  let transferRows = 0;
  let movedFrom2287 = 0;

  await new Promise((resolve, reject) => {
    const parser = fs.createReadStream(COMMENTS_PATH).pipe(
      parse({ columns: true, skip_empty_lines: true, relax_quotes: true })
    );

    parser.on('data', (row) => {
      totalRows++;
      const fromId = toInt(row.from_affiliate_id);
      const toId = toInt(row.to_affiliate_id);

      // parse date if present
      const d = row.created_on ? new Date(row.created_on) : null;
      if (!isNaN(d)) {
        if (!firstDate || d < firstDate) firstDate = d;
        if (!lastDate || d > lastDate) lastDate = d;
      }

      if (fromId === null || toId === null || fromId === toId) return;
      transferRows++;

      const user = row.bullwaves_user || row.bullwaves_id;
      if (user) users.add(String(user));

      inbound.set(toId, (inbound.get(toId) || 0) + 1);
      outbound.set(fromId, (outbound.get(fromId) || 0) + 1);

      if (fromId === 2287) movedFrom2287++;

      const key = `${fromId} -> ${toId}`;
      flows.set(key, (flows.get(key) || 0) + 1);
    });

    parser.on('end', resolve);
    parser.on('error', reject);
  });

  const allAffiliates = new Set([...inbound.keys(), ...outbound.keys()]);
  const stats = [];
  for (const id of [...allAffiliates].sort((a, b) => a - b)) {
    const inCnt = inbound.get(id) || 0;
    const outCnt = outbound.get(id) || 0;
    stats.push({ affiliate_id: id, inbound: inCnt, outbound: outCnt, net: inCnt - outCnt });
  }

  const byInbound = [...stats].sort((a, b) => b.inbound - a.inbound);
  const byOutbound = [...stats].sort((a, b) => b.outbound - a.outbound);
  const byNet = [...stats].sort((a, b) => b.net - a.net);
  const flowsSorted = [...flows.entries()].sort((a, b) => b[1] - a[1]);

  const topInbound = byInbound.slice(0, 10);
  const topOutbound = byOutbound.slice(0, 10);
  const topNet = byNet.slice(0, 10);
  const topFlows = flowsSorted.slice(0, 15);

  const extraCost = movedFrom2287 * CPA_EUR;

  // Generate charts
  const inboundImg = path.join(IMAGES_DIR, 'top_inbound.png');
  const outboundImg = path.join(IMAGES_DIR, 'top_outbound.png');
  const netImg = path.join(IMAGES_DIR, 'top_net.png');
  const flowsImg = path.join(IMAGES_DIR, 'top_flows.png');

  const inboundLabels = topInbound.map(r => String(r.affiliate_id));
  const inboundValues = topInbound.map(r => r.inbound);
  const outboundLabels = topOutbound.map(r => String(r.affiliate_id));
  const outboundValues = topOutbound.map(r => r.outbound);
  const netLabels = topNet.map(r => String(r.affiliate_id));
  const netValues = topNet.map(r => r.net);
  const flowsLabels = topFlows.map(([k]) => k);
  const flowsValues = topFlows.map(([, v]) => v);

  await renderBarChartPng({ title: 'Top 10 Inbound (utenti ricevuti)', labels: inboundLabels, values: inboundValues, color: 'rgba(46, 125, 50, 0.85)', outputPath: inboundImg });
  await renderBarChartPng({ title: 'Top 10 Outbound (utenti persi)', labels: outboundLabels, values: outboundValues, color: 'rgba(198, 40, 40, 0.85)', outputPath: outboundImg });
  await renderBarChartPng({ title: 'Top 10 Net (in - out)', labels: netLabels, values: netValues, color: 'rgba(251, 140, 0, 0.85)', outputPath: netImg });
  await renderBarChartPng({ title: 'Top 15 Flussi (da → a)', labels: flowsLabels, values: flowsValues, color: 'rgba(25, 118, 210, 0.85)', outputPath: flowsImg });

  // Build Markdown
  const period = firstDate && lastDate
    ? `${firstDate.toISOString().slice(0,10)} → ${lastDate.toISOString().slice(0,10)}`
    : 'N/D';

  const md = `# Comments — Report per il Board\n\n` +
`Periodo analizzato: ${period}\\\n` +
`Fonte dati: public/comments.csv\\\n` +
`Generato il: ${new Date().toISOString().slice(0,10)}\n\n` +
`## Executive Summary\n` +
`- Trasferimenti validi: ${fmt(transferRows)} (su ${fmt(totalRows)} righe totali)\n` +
`- Utenti unici trasferiti: ${fmt(users.size)}\n` +
`- Affiliati coinvolti: ${fmt(allAffiliates.size)}\n` +
`- Maggior destinatario: Affiliate ${topInbound[0]?.affiliate_id} (${fmt(topInbound[0]?.inbound || 0)} utenti)\n` +
`- Maggior sorgente: Affiliate ${topOutbound[0]?.affiliate_id} (${fmt(topOutbound[0]?.outbound || 0)} utenti)\n` +
`- Miglior netto: Affiliate ${topNet[0]?.affiliate_id} (net ${fmt(topNet[0]?.net || 0)})\n\n` +
`### Possibile costo extra (Affiliate 2287)\n` +
`- Utenti spostati DA affiliate 2287: ${fmt(movedFrom2287)}\n` +
`- CPA medio stimato: ${fmtEUR(CPA_EUR)}\n` +
`- Costo extra potenziale: ${fmtEUR(extraCost)}\n\n` +
`## Top 10 Affiliati per Utenti Acquisiti\n` +
`![Top 10 Inbound](images/${path.basename(inboundImg)})\n\n` +
asTable(topInbound.map(r => [r.affiliate_id, fmt(r.inbound), fmt(r.outbound), fmt(r.net)]), ['Affiliate', 'Inbound', 'Outbound', 'Net']) + '\n\n' +
`## Top 10 Affiliati per Utenti Persi\n` +
`![Top 10 Outbound](images/${path.basename(outboundImg)})\n\n` +
asTable(topOutbound.map(r => [r.affiliate_id, fmt(r.inbound), fmt(r.outbound), fmt(r.net)]), ['Affiliate', 'Inbound', 'Outbound', 'Net']) + '\n\n' +
`## Top 10 Affiliati per Netto\n` +
`![Top 10 Net](images/${path.basename(netImg)})\n\n` +
asTable(topNet.map(r => [r.affiliate_id, fmt(r.inbound), fmt(r.outbound), fmt(r.net)]), ['Affiliate', 'Inbound', 'Outbound', 'Net']) + '\n\n' +
`## Principali Flussi di Trasferimento (da → a)\n` +
`![Top 15 Flussi](images/${path.basename(flowsImg)})\n\n` +
asTable(topFlows.map(([k, v]) => [k, fmt(v)]), ['Flusso', 'Utenti']) + '\n\n' +
`## Note Metodologiche\n` +
`- Sono considerati solo record con entrambi gli ID affiliate valorizzati e diversi.\n` +
`- Inbound: conteggio utenti spostati VERSO un affiliate. Outbound: conteggio utenti spostati DA un affiliate. Net = Inbound − Outbound.\n` +
`- Il costo extra è una stima: utenti spostati da 2287 × CPA medio (${fmtEUR(CPA_EUR)}).\n` +
`- Data e numeriche sono state normalizzate per quanto possibile dal CSV sorgente.\n`;

  ensureDir(REPORTS_DIR);
  fs.writeFileSync(OUTPUT_MD, md, 'utf8');
  console.log('Report scritto in:', OUTPUT_MD);

  // Generate PDF
  try {
    const pdf = await mdToPdf({ path: OUTPUT_MD }, { dest: OUTPUT_PDF });
    if (pdf) console.log('PDF scritto in:', OUTPUT_PDF);
  } catch (err) {
    console.warn('Avviso: generazione PDF fallita:', err.message);
  }
}

run().catch((err) => {
  console.error('Errore nella generazione report:', err);
  process.exit(1);
});
