const fs = require('fs');
const j = JSON.parse(fs.readFileSync(__dirname + '/../public/traders_ranking_rewards_table.json', 'utf8'));
const clients = new Map();
for (const r of j.rows) {
  const id = String(r.client_id || '').trim();
  if (!id) continue;
  const dReg = new Date(String(r.client_timestamp || '').trim());
  const dLtt = new Date(String(r.ltt_date || '').trim());
  const dLtd = new Date(String(r.ltd_date || '').trim());
  const c = clients.get(id) || { regDate: null, lastLtt: null, lastLtd: null };
  if (!isNaN(dReg) && (!c.regDate || dReg < c.regDate)) c.regDate = dReg;
  if (!isNaN(dLtt) && (!c.lastLtt || dLtt > c.lastLtt)) c.lastLtt = dLtt;
  if (!isNaN(dLtd) && (!c.lastLtd || dLtd > c.lastLtd)) c.lastLtd = dLtd;
  clients.set(id, c);
}
const now = new Date('2026-04-01');
const churnByMonth = {};
let noLttCount = 0;
for (const [, c] of clients) {
  if (!c.regDate) continue;
  // Ultima attività = max(LTT, LTD), fallback registrazione
  let lastActivity = c.lastLtt || null;
  if (c.lastLtd && (!lastActivity || c.lastLtd > lastActivity)) {
    lastActivity = c.lastLtd;
  }
  if (!lastActivity) lastActivity = c.regDate;
  if (!c.lastLtt) noLttCount++;
  
  const days = Math.floor((now - lastActivity) / 86400000);
  if (days >= 60) {
    // Assegna al mese di maturazione churn60 (lastActivity + 60)
    const churnDate = new Date(lastActivity.getTime() + 60 * 86400000);
    const churnMonth = churnDate.getUTCFullYear() + '-' + String(churnDate.getUTCMonth() + 1).padStart(2, '0');
    if (!churnByMonth[churnMonth]) churnByMonth[churnMonth] = 0;
    churnByMonth[churnMonth]++;
  }
}
console.log('Clienti senza LTT (mai tradato):', noLttCount);
console.log('');
console.log('Churn 60d per mese di maturazione:');
const sorted = Object.keys(churnByMonth).sort();
for (const m of sorted) {
  console.log(m, '→', churnByMonth[m], 'churners');
}

