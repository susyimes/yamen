param(
  [Parameter(Mandatory = $true)] [string]$RequestFile,
  [Parameter(Mandatory = $true)] [string]$ResponseJsonPath
)

$ErrorActionPreference = 'Stop'
node runtime/openclaw-bridge-relay.js write-response $RequestFile $ResponseJsonPath
