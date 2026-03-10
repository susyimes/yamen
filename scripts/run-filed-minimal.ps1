param(
  [string]$RequestFile = "runtime/sample-request.filed.json"
)

$ErrorActionPreference = 'Stop'

function Get-JsonValue($json, $path) {
  $obj = $json | ConvertFrom-Json
  foreach ($part in $path.Split('.')) {
    $obj = $obj.$part
  }
  return $obj
}

Write-Host "[1/5] create case from $RequestFile"
$created = node runtime/orchestrator.js create $RequestFile
$caseId = Get-JsonValue $created 'case_id'
Write-Host "case_id=$caseId"

Write-Host "[2/5] classify request"
node runtime/orchestrator.js step $caseId classify_request | Out-Host

Write-Host "[3/5] open filed case"
node runtime/orchestrator.js step $caseId open_filed_case | Out-Host

Write-Host "[4/5] wait for zhubu request"
node runtime/orchestrator.js step $caseId draft_case_note

Write-Host "Now use relay helper / OpenClaw session to produce response for zhubu:"
Write-Host "  node runtime/openclaw-bridge-relay.js list"
Write-Host "  node runtime/openclaw-bridge-relay.js show <request-file>"
Write-Host "  node runtime/openclaw-bridge-relay.js scaffold-json <request-file>"
Write-Host "  node runtime/openclaw-bridge-relay.js write-response <request-file> <response-json-path>"
Write-Host "Then continue with:"
Write-Host "  node runtime/orchestrator.js step $caseId draft_case_note"
Write-Host "  node runtime/orchestrator.js step $caseId execute_task"
Write-Host "  node runtime/orchestrator.js step $caseId submit_result"
