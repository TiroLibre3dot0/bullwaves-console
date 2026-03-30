# agg_traders.ps1 - Legge Traders Ranking Rewards.xlsx via COM (bulk array)
# e calcola KPI aggregati, salvandoli in JSON.

$ErrorActionPreference = 'Stop'
$xlFile = "C:\Syncthing\Workspace\Visionaryos_Mother\Bullwaves_new\CREOLABS\Traders Ranking Rewards.xlsx"
$outFile = "C:\Syncthing\Workspace\Visionaryos_Mother\Bullwaves_new\artifacts\traders_kpi_analysis.json"

Write-Host "Opening Excel..."
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open($xlFile)
$ws = $wb.Worksheets.Item(1)
$used = $ws.UsedRange
$rows = $used.Rows.Count
$cols = $used.Columns.Count
Write-Host "Rows=$rows Cols=$cols - Loading bulk array..."

# Bulk load (molto piu' rapido di cella per cella)
$data = $used.Value2  # 2D array [row, col]

Write-Host "Array loaded. Mapping headers..."

# Mappa header -> indice colonna (1-based)
$headers = @{}
for ($c = 1; $c -le $cols; $c++) {
    $h = $data[1, $c]
    if ($h) { $headers[$h.ToString().Trim()] = $c }
}
Write-Host ("Headers: " + ($headers.Keys -join ", "))

# Indici colonne chiave
$iClientID   = $headers["Client ID"]
$iAffID      = $headers["Affiliate ID"]
$iCountry    = $headers["Country"]
$iBalance    = $headers["$ Balance"]
$iClosedPL   = $headers["$ Closed PL"]
$iOpenPL     = $headers["$ Open PL"]
$iTrades     = $headers["# Trades"]
$iFTD        = $headers["$ FTD"]
$iDeposit    = $headers["$ Deposit"]
$iWD         = $headers["$ WD"]
$iNet        = $headers["$ Net"]
$iEquity     = $headers["$ Equity"]
$iYM         = $headers["Year Month"]
$iLTVComm    = $headers["LTV Commission"]

Write-Host "Processing $rows rows..."

# Accumulatori
$totalDeposit = 0.0; $totalFTD = 0.0; $totalClosedPL = 0.0
$totalOpenPL  = 0.0; $totalNet  = 0.0; $totalWD       = 0.0
$totalBalance = 0.0; $totalEq   = 0.0; $totalTrades   = 0
$countWithFTD = 0; $sumFTD2 = 0.0; $maxFTD = 0.0; $maxBalance = 0.0; $maxClosedPL = 0.0

$clientSet    = [System.Collections.Generic.HashSet[string]]::new()
$affiliateSet = [System.Collections.Generic.HashSet[string]]::new()
$countryClients = [System.Collections.Generic.Dictionary[string,int]]::new()
$countryDeposit = [System.Collections.Generic.Dictionary[string,double]]::new()
$monthlyDep     = [System.Collections.Generic.Dictionary[string,double]]::new()
$monthlyClients = [System.Collections.Generic.Dictionary[string,object]]::new()
$monthlyTrades  = [System.Collections.Generic.Dictionary[string,int]]::new()

# Balance tiers (clienti con balance > 0)
$t0=0; $t1=0; $t2=0; $t3=0; $t4=0

# FTD list per percentili (campione max 50k)
$ftdList = [System.Collections.Generic.List[double]]::new()

# P&L per client (per top10)
$clientPL  = [System.Collections.Generic.Dictionary[string,double]]::new()
$clientName= [System.Collections.Generic.Dictionary[string,string]]::new()
$clientCtry= [System.Collections.Generic.Dictionary[string,string]]::new()

# Active traders (trades > 0)
$activePLSum = 0.0; $activeBalSum = 0.0; $activeTradesSum = 0; $activeCount = 0
$activeClientSet = [System.Collections.Generic.HashSet[string]]::new()

for ($r = 2; $r -le $rows; $r++) {
    if ($r % 10000 -eq 0) { Write-Host "  row $r..." }

    $cid = if ($iClientID) { $data[$r, $iClientID] } else { $null }
    $aid = if ($iAffID)    { $data[$r, $iAffID] }    else { $null }
    $cty = if ($iCountry)  { $data[$r, $iCountry] }  else { "" }
    $ym  = if ($iYM)       { $data[$r, $iYM] }       else { "" }

    $cidStr = if ($cid) { $cid.ToString() } else { "" }
    $aidStr = if ($aid) { $aid.ToString() } else { "" }
    $ctyStr = if ($cty) { $cty.ToString().Trim() } else { "" }
    $ymStr  = if ($ym)  { $ym.ToString().Trim() }  else { "" }

    if ($cidStr) { [void]$clientSet.Add($cidStr) }
    if ($aidStr) { [void]$affiliateSet.Add($aidStr) }

    # Numerici
    function Num($v) { if ($v -and $v -ne "") { try { [double]$v } catch { 0.0 } } else { 0.0 } }

    $bal = Num($data[$r, $iBalance])
    $cpl = Num($data[$r, $iClosedPL])
    $opl = Num($data[$r, $iOpenPL])
    $tr  = [int](Num($data[$r, $iTrades]))
    $ftd = Num($data[$r, $iFTD])
    $dep = Num($data[$r, $iDeposit])
    $wd  = Num($data[$r, $iWD])
    $net = Num($data[$r, $iNet])
    $eq  = Num($data[$r, $iEquity])

    $totalDeposit += $dep; $totalFTD += $ftd; $totalClosedPL += $cpl
    $totalOpenPL  += $opl; $totalNet  += $net; $totalWD       += $wd
    $totalBalance += $bal; $totalEq   += $eq;  $totalTrades   += $tr

    if ($bal -gt $maxBalance) { $maxBalance = $bal }
    if ($cpl -gt $maxClosedPL) { $maxClosedPL = $cpl }

    # FTD
    if ($ftd -gt 0) {
        $countWithFTD++
        $sumFTD2 += $ftd
        if ($ftd -gt $maxFTD) { $maxFTD = $ftd }
        if ($ftdList.Count -lt 50000) { $ftdList.Add($ftd) }
    }

    # Balance tiers
    if ($bal -gt 0) {
        if ($bal -lt 500)                    { $t0++ }
        elseif ($bal -lt 2000)               { $t1++ }
        elseif ($bal -lt 10000)              { $t2++ }
        elseif ($bal -lt 50000)              { $t3++ }
        else                                 { $t4++ }
    }

    # Country
    if ($ctyStr) {
        if (-not $countryClients.ContainsKey($ctyStr)) { $countryClients[$ctyStr] = 0 }
        if (-not $countryDeposit.ContainsKey($ctyStr)) { $countryDeposit[$ctyStr] = 0.0 }
        if ($cidStr) { $countryClients[$ctyStr]++ }  # non unique ma serve trend
        $countryDeposit[$ctyStr] += $dep
    }

    # Monthly
    if ($ymStr) {
        if (-not $monthlyDep.ContainsKey($ymStr))     { $monthlyDep[$ymStr] = 0.0 }
        if (-not $monthlyClients.ContainsKey($ymStr)) { $monthlyClients[$ymStr] = [System.Collections.Generic.HashSet[string]]::new() }
        if (-not $monthlyTrades.ContainsKey($ymStr))  { $monthlyTrades[$ymStr] = 0 }
        $monthlyDep[$ymStr] += $dep
        if ($cidStr) { [void]($monthlyClients[$ymStr]).Add($cidStr) }
        $monthlyTrades[$ymStr] += $tr
    }

    # Active traders
    if ($tr -gt 0) {
        $activeTradesSum += $tr; $activePLSum += $cpl; $activeBalSum += $bal; $activeCount++
        if ($cidStr) { [void]$activeClientSet.Add($cidStr) }
    }

    # P&L per client
    if ($cidStr) {
        if (-not $clientPL.ContainsKey($cidStr)) {
            $clientPL[$cidStr] = 0.0
            $nm = if ($iClientID) { $data[$r, $iClientID+1] } else { "" }  # Client Name is col+1? No, let's use a separate lookup
        }
        $clientPL[$cidStr] += $cpl
        if (-not $clientName.ContainsKey($cidStr)) {
            $rawName = if ($cols -ge 3) { $data[$r, 3] } else { "" }
            $clientName[$cidStr]    = if ($rawName) { $rawName.ToString() } else { $cidStr }
            $clientCtry[$cidStr]    = $ctyStr
        }
    }
}

Write-Host "Aggregation done. Computing stats..."

# FTD percentili
$ftdArr  = $ftdList | Sort-Object
$ftdMed  = 0.0; $ftp75 = 0.0; $ftp90 = 0.0
if ($ftdArr.Count -gt 0) {
    $ftdMed = $ftdArr[[int]($ftdArr.Count * 0.50)]
    $ftp75  = $ftdArr[[int]($ftdArr.Count * 0.75)]
    $ftp90  = $ftdArr[[int]($ftdArr.Count * 0.90)]
}
$avgFTD = if ($countWithFTD -gt 0) { [Math]::Round($sumFTD2 / $countWithFTD, 2) } else { 0 }

# Top 15 countries by client count
$topCtryClients = $countryClients.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 15
$topCtryDeposit = $countryDeposit.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 10

# Top 10 trader by PL
$top10PL = $clientPL.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 10

# Monthly last 12
$monthKeys = $monthlyDep.Keys | Sort-Object | Select-Object -Last 12

# Build JSON
$json = [ordered]@{
    overview = [ordered]@{
        total_rows       = $rows - 1
        unique_clients   = $clientSet.Count
        unique_affiliates= $affiliateSet.Count
        unique_countries = $countryClients.Keys.Count
    }
    financials = [ordered]@{
        total_deposit_usd   = [Math]::Round($totalDeposit,  2)
        total_ftd_usd       = [Math]::Round($totalFTD,      2)
        total_closed_pl_usd = [Math]::Round($totalClosedPL, 2)
        total_open_pl_usd   = [Math]::Round($totalOpenPL,   2)
        total_net_usd       = [Math]::Round($totalNet,      2)
        total_wd_usd        = [Math]::Round($totalWD,       2)
        total_balance_usd   = [Math]::Round($totalBalance,  2)
        total_equity_usd    = [Math]::Round($totalEq,       2)
        total_trades        = $totalTrades
        max_balance         = [Math]::Round($maxBalance,    2)
        max_closed_pl       = [Math]::Round($maxClosedPL,   2)
        avg_balance         = if ($clientSet.Count -gt 0) { [Math]::Round($totalBalance/$clientSet.Count,2) } else { 0 }
        avg_closed_pl       = if ($clientSet.Count -gt 0) { [Math]::Round($totalClosedPL/$clientSet.Count,2) } else { 0 }
    }
    ftd_distribution = [ordered]@{
        count_with_ftd = $countWithFTD
        avg_ftd        = $avgFTD
        median_ftd     = [Math]::Round($ftdMed, 2)
        p75_ftd        = [Math]::Round($ftp75,  2)
        p90_ftd        = [Math]::Round($ftp90,  2)
        max_ftd        = [Math]::Round($maxFTD,  2)
    }
    active_traders = [ordered]@{
        unique_active_clients = $activeClientSet.Count
        total_active_rows     = $activeCount
        avg_trades            = if ($activeCount -gt 0) { [Math]::Round($activeTradesSum / $activeCount, 1) } else { 0 }
        avg_closed_pl         = if ($activeCount -gt 0) { [Math]::Round($activePLSum / $activeCount, 2) } else { 0 }
        avg_balance           = if ($activeCount -gt 0) { [Math]::Round($activeBalSum / $activeCount, 2) } else { 0 }
    }
    balance_tiers = [ordered]@{
        "lt500"        = $t0
        "500_2000"     = $t1
        "2000_10000"   = $t2
        "10000_50000"  = $t3
        "gt50000"      = $t4
    }
    top_countries_by_rows = ($topCtryClients | ForEach-Object { [ordered]@{ country=$_.Key; count=$_.Value } })
    top_countries_by_deposit = ($topCtryDeposit | ForEach-Object { [ordered]@{ country=$_.Key; deposit=[Math]::Round($_.Value,2) } })
    top10_by_closed_pl = ($top10PL | ForEach-Object { [ordered]@{
        client_id=$_.Key
        name=($clientName[$_.Key])
        country=($clientCtry[$_.Key])
        closed_pl=[Math]::Round($_.Value,2)
    }})
    monthly_trend = ($monthKeys | ForEach-Object {
        $ym = $_
        [ordered]@{
            period   = $ym
            deposits = [Math]::Round($monthlyDep[$ym], 2)
            clients  = if ($monthlyClients.ContainsKey($ym)) { ($monthlyClients[$ym]).Count } else { 0 }
            trades   = $monthlyTrades[$ym]
        }
    })
}

$jsonStr = $json | ConvertTo-Json -Depth 5
$jsonStr | Set-Content -Path $outFile -Encoding UTF8
Write-Host "SAVED: $outFile"
Write-Host "--- RESULT ---"
Write-Host $jsonStr

$wb.Close($false)
$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
Write-Host "DONE"
