param(
  [string]$RequestFile = "runtime/sample-request.filed.ascii.json",
  [switch]$AutoScaffold,
  [switch]$AutoReport
)

$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $RepoRoot

function NodeJson([string[]]$Args) {
  $out = & node @Args
  if ($LASTEXITCODE -ne 0) {
    throw "node $($Args -join ' ') failed"
  }
  return ($out -join "`n") | ConvertFrom-Json
}

function NodeText([string[]]$Args) {
  $out = & node @Args
  if ($LASTEXITCODE -ne 0) {
    throw "node $($Args -join ' ') failed"
  }
  return ($out -join "`n")
}

function Get-CaseIdFromSubmit([string]$SubmitText) {
  $m = [regex]::Match($SubmitText, '"case_id"\s*:\s*"([^"]+)"')
  if (-not $m.Success) {
    throw "Unable to parse case_id from submit output"
  }
  return $m.Groups[1].Value
}

function Get-PendingRequestByAction([string]$CaseId, [string]$Action) {
  $out = & node -e "const {listPending}=require('./runtime/openclaw-bridge-relay'); const caseId=process.argv[1]; const action=process.argv[2]; const x=listPending().find(i=>!i.has_response && i.case_id===caseId && i.action===action); if(!x){process.exit(2)}; console.log(x.request_file);" $CaseId $Action
  if ($LASTEXITCODE -ne 0) {
    return $null
  }
  return ($out -join "`n").Trim()
}

function Wait-Request([string]$CaseId, [string]$Action) {
  for ($i = 0; $i -lt 40; $i++) {
    $req = Get-PendingRequestByAction $CaseId $Action
    if (-not [string]::IsNullOrWhiteSpace($req)) { return $req }
    Start-Sleep -Milliseconds 500
  }
  throw "Timeout waiting request for case_id=$CaseId action=$Action"
}

function Resolve-Role([string]$Action) {
  switch ($Action) {
    "draft_case_note" { return "zhubu" }
    "execute_task" { return "kuaishou" }
    "submit_result" { return "kuaishou" }
    default { return "unknown" }
  }
}

function Complete-BridgeStep([string]$CaseId, [string]$Action) {
  Write-Host "`n== Trigger step: $Action =="

  $outFile = "runtime/tmp-step-$Action-$CaseId.out.log"
  $errFile = "runtime/tmp-step-$Action-$CaseId.err.log"
  $proc = Start-Process -FilePath node -ArgumentList @("runtime/orchestrator.js", "step", $CaseId, $Action) -WorkingDirectory $RepoRoot -NoNewWindow -PassThru -RedirectStandardOutput $outFile -RedirectStandardError $errFile

  $role = Resolve-Role $Action
  $requestFile = Wait-Request $CaseId $Action

  Write-Host "pending request: $requestFile (role=$role)"
  Write-Host "--- exported payload draft ---"
  NodeText @("scripts/relay-semi-auto.js", $requestFile) | Out-Host

  if ($AutoScaffold) {
    Write-Host "auto scaffold response for $requestFile"
    NodeText @("runtime/openclaw-bridge-relay.js", "scaffold", $requestFile) | Out-Host
  }
  else {
    Write-Host "Paste real role JSON now using:"
    Write-Host "  node runtime/openclaw-bridge-relay.js write-response-stdin $requestFile"
    Read-Host "Press Enter after response is written"
  }

  Wait-Process -Id $proc.Id
  if ($proc.ExitCode -ne 0) {
    if (Test-Path $errFile) { Get-Content $errFile | Out-Host }
    throw "orchestrator step failed: $Action"
  }

  if (Test-Path $outFile) { Get-Content $outFile | Out-Host }
  Remove-Item $outFile, $errFile -ErrorAction SilentlyContinue
}

function Build-EntryReport([string]$CaseId) {
  $c = NodeJson @("runtime/orchestrator.js", "show", $CaseId)

  $route = @("entry", "zhubu", "kuaishou")
  $report = [ordered]@{
    case_id = $c.case_id
    case_title = $c.title
    mode = $c.mode
    final_status = $c.status
    route_taken = $route
    summary = "Filed rehearsal completed through zhubu and kuaishou."
    reply_to_prefect = "Filed rehearsal done: zhubu and kuaishou results collected."
    artifacts = @($c.artifacts)
    blockers = @($c.blocking_issues)
    review_notes = @()
    runtime_outcome = "normal"
    reported_by = "entry"
    reported_at = (Get-Date).ToUniversalTime().ToString("o")
  }

  $tmp = "runtime/tmp-entry-report-$CaseId.json"
  $report | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $tmp
  return $tmp
}

Write-Host "[1/6] submit prefect request: $RequestFile"
$caseId = (& node -e "const {spawnSync}=require('child_process'); const req=process.argv[1]; const r=spawnSync(process.execPath,['runtime/prefect-flow.js','submit',req],{encoding:'utf8'}); if(r.status!==0){process.stderr.write(r.stderr||r.stdout||'submit failed'); process.exit(r.status||1);} const j=JSON.parse(r.stdout); process.stdout.write(j.case_id||'');" $RequestFile).Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($caseId)) { throw "Unable to detect case_id after submit" }
Write-Host "case_id=$caseId"

Write-Host "[2/6] entry intake transitions"
& node runtime/orchestrator.js step $caseId classify_request | Out-Host
& node runtime/orchestrator.js step $caseId open_filed_case | Out-Host

Write-Host "[3/6] bridge zhubu"
Complete-BridgeStep -CaseId $caseId -Action "draft_case_note"

Write-Host "[4/6] bridge kuaishou execute"
Complete-BridgeStep -CaseId $caseId -Action "execute_task"

Write-Host "[5/6] bridge kuaishou submit"
Complete-BridgeStep -CaseId $caseId -Action "submit_result"

Write-Host "[6/6] final case status"
& node runtime/orchestrator.js show $caseId | Out-Host

if ($AutoReport) {
  Write-Host "`n[report] attach entry report via prefect-flow report"
  $reportFile = Build-EntryReport -CaseId $caseId
  & node runtime/prefect-flow.js report $caseId $reportFile | Out-Host
  Remove-Item $reportFile -ErrorAction SilentlyContinue
}

Write-Host "`nDone. Filed bridge rehearsal completed for case_id=$caseId"
