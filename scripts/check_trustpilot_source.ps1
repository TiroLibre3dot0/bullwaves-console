param(
  [string]$SourceUrl = $env:TRUSTPILOT_SOURCE_URL,
  [string]$ConfigPath,
  [int]$TimeoutSec = 20,
  [switch]$NotifyOnSuccess
)

$ErrorActionPreference = 'Stop'

if (-not $ConfigPath) {
  $ConfigPath = Join-Path $PSScriptRoot 'trustpilot_sync.config.json'
}

if ((-not $SourceUrl) -and (Test-Path $ConfigPath)) {
  try {
    $cfg = Get-Content -Path $ConfigPath -Raw | ConvertFrom-Json
    if ($cfg.sourceUrl) {
      $SourceUrl = [string]$cfg.sourceUrl
    }
  } catch {
    throw "Invalid sync config file: $ConfigPath"
  }
}

if (-not $SourceUrl) {
  throw 'Missing SourceUrl. Provide -SourceUrl, set TRUSTPILOT_SOURCE_URL, or configure scripts/trustpilot_sync.config.json.'
}

$nodeScript = @'
const src = process.argv[1] || '';
const timeoutSec = Number(process.argv[2] || '20');

function normalizeHttpUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return '';
}

function toGoogleSheetsCsvExportUrl(inputUrl) {
  const source = normalizeHttpUrl(inputUrl);
  if (!source) return '';

  let parsed;
  try {
    parsed = new URL(source);
  } catch {
    return source;
  }

  const isGoogleHost = /(^|\.)docs\.google\.com$/i.test(parsed.hostname);
  if (!isGoogleHost) return source;

  const pathMatch = parsed.pathname.match(/\/spreadsheets\/d\/([^/]+)/i);
  if (!pathMatch) return source;

  const sheetId = pathMatch[1];
  let gid = parsed.searchParams.get('gid') || '';

  if (!gid && parsed.hash) {
    const hm = String(parsed.hash).match(/gid=(\d+)/i);
    if (hm) gid = hm[1];
  }

  const out = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/export`);
  out.searchParams.set('format', 'csv');
  if (gid) out.searchParams.set('gid', gid);
  return out.toString();
}

(async () => {
  const exportUrl = toGoogleSheetsCsvExportUrl(src);
  if (!exportUrl) {
    console.error('Invalid source URL.');
    process.exit(2);
  }

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), Math.max(1, timeoutSec) * 1000);

  try {
    const res = await fetch(exportUrl, {
      method: 'GET',
      headers: { Accept: 'text/csv,text/plain;q=0.9,*/*;q=0.8' },
      signal: ctl.signal,
    });

    const text = await res.text();
    if (!res.ok) {
      console.error(`HTTP ${res.status} from ${exportUrl}`);
      process.exit(3);
    }

    if (!String(text || '').trim()) {
      console.error(`Empty body from ${exportUrl}`);
      process.exit(4);
    }

    console.log(`OK ${exportUrl} bytes=${text.length}`);
  } catch (err) {
    const msg = err && err.name === 'AbortError' ? 'Request timeout' : (err && err.message ? err.message : String(err));
    console.error(`Fetch failed: ${msg}`);
    process.exit(5);
  } finally {
    clearTimeout(timer);
  }
})();
'@

$nodeOut = & node -e $nodeScript -- "$SourceUrl" "$TimeoutSec" 2>&1
$exitCode = $LASTEXITCODE
$summary = ($nodeOut | Out-String).Trim()

if ($exitCode -eq 0) {
  Write-Host "[Trustpilot Healthcheck] $summary"
  if ($NotifyOnSuccess) {
    & eventcreate /L APPLICATION /T INFORMATION /ID 1302 /SO "BullwavesTrustpilot" /D "Trustpilot source check OK. $summary" | Out-Null
  }
  exit 0
}

$message = "Trustpilot source check failed. $summary"
Write-Error $message
& eventcreate /L APPLICATION /T ERROR /ID 1301 /SO "BullwavesTrustpilot" /D $message | Out-Null
exit $exitCode
