<#
.SYNOPSIS
  Dewey staging extractor: source dump rows to staging CSV.

.DESCRIPTION
  Parses tuple lines from the source .sql dump into a staging CSV for
  transfer.sql. The dump is NEVER executed: no TRUNCATE, INSERT,
  transaction, sequence, or ON CONFLICT clause from the source runs
  here or anywhere in the transfer path. This script performs a
  faithful conversion only (UTF-8 in, UTF-8 CSV out); every validation
  lives in transfer.sql, which aborts on the first failed check.

  Columns out: source_id, parent_source_id, code, name_tr, name_en
  (NULL parent becomes an empty CSV field). Any tuple line that fails
  to parse aborts with a nonzero exit so partial data can never flow
  silently into staging.

  RIGHTS GATE: do not run this against the dataset until its source
  and usage rights are verified (K73). Parser mechanics verified on a
  synthetic fixture only; full-data run is pending.
#>
param(
  [Parameter(Mandatory = $true)][string]$SourcePath,
  [Parameter(Mandatory = $true)][string]$CsvPath
)
$ErrorActionPreference = 'Stop'
$rx = "^\((\d+),(NULL|\d+),\d+,'((?:''|[^'])*)',\d+,\d+,'((?:''|[^'])*)','((?:''|[^'])*)',"
function ConvertTo-CsvField($v) {
  if ($null -eq $v) { return '' }
  if ($v -notmatch '[",\r\n]') { return $v }
  return '"' + ($v -replace '"', '""') + '"'
}
$tuples = 0
$unparsed = 0
$out = New-Object System.IO.StreamWriter($CsvPath, $false, (New-Object System.Text.UTF8Encoding($false)))
try {
  $out.WriteLine('source_id,parent_source_id,code,name_tr,name_en')
  Get-Content -Path $SourcePath -Encoding utf8 | ForEach-Object {
    if ($_ -match '^\(\d+,') {
      $tuples++
      if ($_ -match $rx) {
        $par = $Matches[2]
        if ($par -eq 'NULL') { $par = $null }
        $code = $Matches[3] -replace "''", "'"
        $tr = $Matches[4] -replace "''", "'"
        $en = $Matches[5] -replace "''", "'"
        $out.WriteLine(
          $Matches[1] + ',' + (ConvertTo-CsvField $par) + ',' +
          (ConvertTo-CsvField $code) + ',' + (ConvertTo-CsvField $tr) + ',' +
          (ConvertTo-CsvField $en)
        )
      } else {
        $unparsed++
      }
    }
  }
} finally {
  $out.Close()
}
Write-Output "TUPLES=$tuples UNPARSED=$unparsed CSV=$CsvPath"
if ($unparsed -gt 0) { throw "$unparsed tuple lines failed to parse; CSV is incomplete." }
