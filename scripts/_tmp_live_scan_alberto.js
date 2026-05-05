const base = 'http://localhost:4000/api/qlik';

async function j(url){
  const r = await fetch(url);
  let d = null;
  try { d = await r.json(); } catch {}
  return { ok:r.ok, status:r.status, data:d };
}

function cellText(c){
  if (c == null) return '';
  if (typeof c === 'string') return c;
  if (typeof c === 'number') return String(c);
  if (typeof c === 'object') return String(c.text ?? c.qText ?? '');
  return String(c);
}

(async()=>{
  const items = await j(`${base}/items?limit=200`);
  if(!items.ok || !items.data?.ok) throw new Error('items failed');
  const apps = (items.data.data?.data || []).filter(i => i.resourceType === 'app');
  const matches = [];

  for (const app of apps) {
    const appId = app.resourceId;
    const appName = app.name;
    const sheetsRes = await j(`${base}/engine/apps/${appId}/sheets`);
    if(!sheetsRes.ok || !sheetsRes.data?.ok) continue;
    const sheets = sheetsRes.data.data || [];

    for (const s of sheets){
      const objsRes = await j(`${base}/engine/apps/${appId}/sheets/${encodeURIComponent(s.id)}/objects`);
      if(!objsRes.ok || !objsRes.data?.ok) continue;
      const objs = objsRes.data.data || [];

      for (const o of objs){
        if(!o?.hasHypercube) continue;
        const t = String(o.type || '').toLowerCase();
        const likelyTable = t.includes('table') || t.includes('pivot');
        if (!likelyTable) continue;

        const dataRes = await j(`${base}/engine/apps/${appId}/objects/${encodeURIComponent(o.id)}/data?rows=1&cols=60`);
        if(!dataRes.ok || !dataRes.data?.ok) continue;

        const d = dataRes.data.data;
        const cols = [...(d.dimensions||[]), ...(d.measures||[])].map((c) => String(c || '').toLowerCase());

        const hasAffiliateId = cols.some((x) => x.includes('affiliate id') || x.includes('affiliate_id'));
        const hasClientId = cols.some((x) => x.includes('client id') || x.includes('client_id'));
        const hasClientName = cols.some((x) => x.includes('client name') || x.includes('client_name') || x === 'client');
        const hasClientLogin = cols.some((x) => x.includes('client login') || x.includes('client_login') || x === 'login');
        const hasTrades = cols.some((x) => x.includes('trades'));
        const hasClosedPl = cols.some((x) => x.includes('closed pl'));
        const hasYearMonth = cols.some((x) => x.includes('year month') || x.includes('year_month'));

        const score = [hasAffiliateId, hasClientId, hasClientName, hasClientLogin, hasTrades, hasClosedPl, hasYearMonth].filter(Boolean).length;
        if (score >= 5) {
          matches.push({
            appId,
            appName,
            sheetId: s.id,
            sheetTitle: s.title,
            objectId: o.id,
            objectType: o.type,
            objectTitle: o.title,
            score,
            columns: cols,
          });
        }
      }
    }
  }

  console.log(JSON.stringify({apps: apps.length, matches}, null, 2));
})().catch(err=>{ console.error(err); process.exit(1); });
