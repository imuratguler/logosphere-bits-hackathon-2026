<#
.SYNOPSIS
  Logosphere BITS session-record opener (project SessionStart hook helper).

.DESCRIPTION
  Creates the session file `Logosphere BITS, yyyymmdd_hhnnss_TST.MD` (TST =
  UTC+03:00, Europe/Istanbul) in the docs folder. Idempotent: re-running with
  the same session id returns the existing file and never creates a second one
  or overwrites any record. Reads the session id from -SessionId or the
  MUSE_SESSION_ID environment variable provided to hook commands.
#>
param(
  [string]$SessionId = $env:MUSE_SESSION_ID,
  [string]$OpenedAt = ''
)
$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($SessionId)) {
  throw 'SessionId is required: pass -SessionId or run with MUSE_SESSION_ID set.'
}
$root = Split-Path -Parent $PSScriptRoot
$tz = [System.TimeZoneInfo]::FindSystemTimeZoneById('Turkey Standard Time')
$now = [System.TimeZoneInfo]::ConvertTimeFromUtc([DateTime]::UtcNow, $tz)
$nowStamp = $now.ToString('yyyyMMdd_HHmmss')
$nowFull = $now.ToString('yyyy-MM-dd HH:mm:ss') + ' +03:00'
if ($OpenedAt -match '^\d{8}_\d{6}$') {
  $stamp = $OpenedAt
  $openedFull = [DateTime]::ParseExact($OpenedAt, 'yyyyMMdd_HHmmss', $null).ToString('yyyy-MM-dd HH:mm:ss') + ' +03:00'
  $openedSrc = 'manual -OpenedAt (reliable metadata)'
} else {
  $stamp = $nowStamp
  $openedFull = $nowFull
  $openedSrc = 'run time (hook fires at session start, creation ~= opening)'
}
$docs = Join-Path $root 'docs'
$existing = Get-ChildItem -Path $docs -Filter 'Logosphere BITS, *_TST.MD' -File -Force -ErrorAction SilentlyContinue |
  Where-Object { Select-String -Path $_.FullName -Pattern $SessionId -SimpleMatch -Quiet } |
  Select-Object -First 1
if ($existing) {
  Write-Output $existing.FullName
  exit 0
}
$name = "Logosphere BITS, ${stamp}_TST.MD"
$path = Join-Path $docs $name
$i = 2
while (Test-Path $path) {
  $name = "Logosphere BITS, ${stamp}_TST-$i.MD"
  $path = Join-Path $docs $name
  $i++
}
@(
  '# Logosphere BITS - Session Log'
  ''
  "- Session ID: $SessionId"
  "- Opened (TST): $openedFull (source: $openedSrc)"
  "- File created (TST): $nowFull"
  "- Last updated (TST): $nowFull"
  ''
  '## Handover (current)'
  ''
  '(Agent fills: where we are, verified state, next concrete action.)'
  ''
  '## Inherited state'
  ''
  '(Agent fills: previous record path + inherited summary after reading it.)'
  ''
  '## History'
  ''
  "### $nowFull - Session file created"
  ''
  '- Skeleton created by session opener; agent completes handover and history.'
) | Set-Content -Path $path -Encoding UTF8
Write-Output $path
