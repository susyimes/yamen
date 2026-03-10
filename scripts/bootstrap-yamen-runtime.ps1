param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$RuntimeRoot = ""
)

$ErrorActionPreference = 'Stop'

if (-not $RuntimeRoot) {
  $RuntimeRoot = Join-Path $RepoRoot '.openclaw\yamen-runtime'
}

$configPath = Join-Path $RepoRoot 'config\provisioning.json'
$config = Get-Content -Raw $configPath | ConvertFrom-Json

$roles = @('entry', 'zhubu', 'kuaishou', 'dianshi')
$sourceAuth = Join-Path $RepoRoot $config.auth.source

function Ensure-Dir([string]$PathValue) {
  New-Item -ItemType Directory -Force -Path $PathValue | Out-Null
}

function Write-TextFile([string]$PathValue, [string]$Content) {
  $dir = Split-Path -Parent $PathValue
  Ensure-Dir $dir
  Set-Content -Path $PathValue -Value $Content -Encoding UTF8
}

foreach ($role in $roles) {
  $workspaceName = $config.roles.$role.workspace
  $workspacePath = Join-Path $RuntimeRoot $workspaceName
  Ensure-Dir $workspacePath

  $roleLabel = if ($role -eq 'entry') { $config.entry.sessionLabel } else { "yamen-$role" }
  $rolePurpose = if ($role -eq 'entry') { 'merged menfang+xianling entry' } else { $role }

  Write-TextFile (Join-Path $workspacePath 'role.json') (@{
    id = $role
    label = $roleLabel
    workspace = $workspaceName
    runtime = if ($role -eq 'entry') { $config.entry.runtime } else { 'subagent' }
    agentId = if ($role -eq 'entry') { $config.entry.agentId } else { 'main' }
    purpose = $rolePurpose
  } | ConvertTo-Json -Depth 5)

  Write-TextFile (Join-Path $workspacePath 'AGENTS.md') "# $role`n`nThis workspace is provisioned for Yamen role runtime.`n"
  Write-TextFile (Join-Path $workspacePath 'SOUL.md') "# $role`n`nProvisioned role workspace for Yamen.`n"

  if (Test-Path $sourceAuth) {
    Copy-Item $sourceAuth (Join-Path $workspacePath $config.auth.targetName) -Force
  }
}

Write-Host "Provisioned Yamen runtime at: $RuntimeRoot"
Get-ChildItem $RuntimeRoot -Directory | Select-Object FullName
