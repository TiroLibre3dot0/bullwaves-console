Set-Location 'c:\Syncthing\Workspace\Visionaryos_Mother\Bullwaves_clean'

$snap = Invoke-RestMethod -Uri 'http://localhost:4000/api/qlik/creolabs/reports/board-snapshot?brandScope=combined'
$datesResp = Invoke-RestMethod -Uri 'http://localhost:4000/api/qlik/creolabs/client-dates'
$rows = @($datesResp.data.rows)
$period = [string]$snap.periodContext.currentPeriod

if ($period -notmatch '^(\d{4})-([A-Za-z]{3})$') {
  throw "Unexpected period format: $period"
}

$year = [int]$Matches[1]
$monMap = @{ Jan = 1; Feb = 2; Mar = 3; Apr = 4; May = 5; Jun = 6; Jul = 7; Aug = 8; Sep = 9; Oct = 10; Nov = 11; Dec = 12 }
$month = $monMap[$Matches[2]]

function ToDate($s) {
  if ([string]::IsNullOrWhiteSpace($s) -or $s -eq '-') { return $null }
  try { return [datetime]::Parse($s).ToUniversalTime() } catch { return $null }
}

$oldActives = foreach ($r in $rows) {
  $ltd = ToDate $r.ltdDate
  $ltt = ToDate $r.lttDate
  if (($ltd -and $ltd.Year -eq $year -and $ltd.Month -eq $month) -or ($ltt -and $ltt.Year -eq $year -and $ltt.Month -eq $month)) {
    $r
  }
}

$newActives = foreach ($r in $rows) {
  $ltt = ToDate $r.lttDate
  if ($ltt -and $ltt.Year -eq $year -and $ltt.Month -eq $month) {
    $r
  }
}

$oldStart = ($oldActives | ForEach-Object { ToDate $_.clientTimestamp } | Where-Object { $_ } | Sort-Object | Select-Object -First 1)
$newStart = ($newActives | ForEach-Object { ToDate $_.clientTimestamp } | Where-Object { $_ } | Sort-Object | Select-Object -First 1)

function CountStages($start, $inputRows) {
  if (-not $start) {
    return [pscustomobject]@{ Registrations = 0; Ftd = 0; ActiveDepositors = 0; Retained14d = 0 }
  }

  $today = [datetime]::UtcNow
  $d14 = $today.AddDays(-14)

  $cohort = @($inputRows | Where-Object {
      $reg = ToDate $_.clientTimestamp
      $reg -and $reg -ge $start -and $reg -le $today
    })

  $ftd = @($cohort | Where-Object { ToDate $_.ltdDate })
  $ad = @($ftd | Where-Object { ToDate $_.lttDate })
  $ret = @($ad | Where-Object {
      $lt = ToDate $_.lttDate
      $lt -and $lt -ge $d14
    })

  return [pscustomobject]@{
    Registrations = $cohort.Count
    Ftd = $ftd.Count
    ActiveDepositors = $ad.Count
    Retained14d = $ret.Count
  }
}

$oldStages = CountStages $oldStart $rows
$newStages = CountStages $newStart $rows

Write-Output ('period=' + $period)
Write-Output ('rows=' + $rows.Count)
Write-Output ('OLD(start ltd||ltt): ' + ($(if ($oldStart) { $oldStart.ToString('yyyy-MM-dd') } else { 'n/a' })) + ' active=' + $oldActives.Count)
Write-Output ('NEW(start ltt only):  ' + ($(if ($newStart) { $newStart.ToString('yyyy-MM-dd') } else { 'n/a' })) + ' active=' + $newActives.Count)
Write-Output ('OLD stages: reg=' + $oldStages.Registrations + ' ftd=' + $oldStages.Ftd + ' activeDep=' + $oldStages.ActiveDepositors + ' retained14=' + $oldStages.Retained14d)
Write-Output ('NEW stages: reg=' + $newStages.Registrations + ' ftd=' + $newStages.Ftd + ' activeDep=' + $newStages.ActiveDepositors + ' retained14=' + $newStages.Retained14d)
