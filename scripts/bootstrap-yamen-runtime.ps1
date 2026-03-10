param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$RuntimeRoot = "",
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

if (-not $RuntimeRoot) {
  $RuntimeRoot = Join-Path $RepoRoot '.openclaw\yamen-runtime'
}

$configPath = Join-Path $RepoRoot 'config\provisioning.json'
$roleSessionsPath = Join-Path $RepoRoot 'config\role-sessions.json'
$config = Get-Content -Raw $configPath | ConvertFrom-Json
$roleSessions = Get-Content -Raw $roleSessionsPath | ConvertFrom-Json

$roles = @('entry', 'zhubu', 'kuaishou', 'dianshi')

function Ensure-Dir([string]$PathValue) {
  New-Item -ItemType Directory -Force -Path $PathValue | Out-Null
}

function Write-TextFile([string]$PathValue, [string]$Content) {
  $dir = Split-Path -Parent $PathValue
  Ensure-Dir $dir
  Set-Content -Path $PathValue -Value $Content -Encoding UTF8
}

function Resolve-AuthSource([string]$RepoRootValue, [string]$ConfiguredSource) {
  $candidates = @(
    (Join-Path $RepoRootValue $ConfiguredSource),
    (Join-Path (Split-Path -Parent $RepoRootValue) 'auth-profiles.json'),
    (Join-Path (Split-Path -Parent $RepoRootValue) '.openclaw\auth-profiles.json'),
    (Join-Path $env:USERPROFILE '.openclaw\auth-profiles.json')
  ) | Select-Object -Unique

  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path $candidate)) {
      return $candidate
    }
  }

  return $null
}

function Get-RoleSoul([string]$RepoRootValue, [string]$RoleId) {
  if ($RoleId -eq 'entry') {
    return @"
# yamen-entry

你是 Yamen 的合并入口，会同时承担：
- 门房：受理、清洗输入、判断是否成案
- 县令：判定 direct / filed / reviewed，决定是否调用主簿 / 快手 / 典史

你不直接把自己暴露成“多个角色在吵架”，而是以一个干练的县衙入口对外办事。

你的上级不是普通用户，而是知府 / 外部上级会话。
你负责接收知府下发任务，并在 Yamen 内部组织办理。
"@
  }

  $soulPath = Join-Path $RepoRootValue "agents\$RoleId\SOUL.md"
  if (Test-Path $soulPath) {
    return Get-Content -Raw $soulPath
  }

  return "# $RoleId`n`nProvisioned role workspace for Yamen.`n"
}

function Get-RoleAgents([string]$RoleId, [string]$WorkspaceName, [string]$Label) {
  return @"
# AGENTS.md - $RoleId

This workspace is provisioned for Yamen role runtime.

## Identity
- role: $RoleId
- workspace: $WorkspaceName
- label: $Label

## Rule
Work only within the Yamen role boundary for this workspace.
Do not assume the identity of prefect/main session.
"@
}

$sourceAuth = Resolve-AuthSource $RepoRoot $config.auth.source
$summary = @()

foreach ($role in $roles) {
  $workspaceName = $config.roles.$role.workspace
  $workspacePath = Join-Path $RuntimeRoot $workspaceName
  Ensure-Dir $workspacePath
  Ensure-Dir (Join-Path $workspacePath 'memory')
  Ensure-Dir (Join-Path $workspacePath 'logs')

  $roleSession = $roleSessions.roles.$role
  $roleLabel = if ($role -eq 'entry') { $config.entry.sessionLabel } else { $roleSession.sessionLabel }
  $roleRuntime = if ($role -eq 'entry') { $config.entry.runtime } else { $roleSession.runtime }
  $roleAgentId = if ($role -eq 'entry') { $config.entry.agentId } else { $roleSession.agentId }
  $rolePurpose = if ($role -eq 'entry') { 'merged menfang+xianling entry for prefect-submitted tasks' } else { $roleSession.purpose }

  $roleJson = @{
    id = $role
    label = $roleLabel
    workspace = $workspaceName
    runtime = $roleRuntime
    agentId = $roleAgentId
    sessionMode = if ($role -eq 'entry') { $config.entry.sessionMode } else { $roleSession.sessionMode }
    spawnMode = if ($role -eq 'entry') { $config.entry.spawnMode } else { $roleSession.spawnMode }
    purpose = $rolePurpose
    managedBy = if ($role -eq 'entry') { 'openclaw-session' } else { $roleSession.managedBy }
  } | ConvertTo-Json -Depth 6

  Write-TextFile (Join-Path $workspacePath 'role.json') $roleJson
  Write-TextFile (Join-Path $workspacePath 'AGENTS.md') (Get-RoleAgents $role $workspaceName $roleLabel)
  Write-TextFile (Join-Path $workspacePath 'SOUL.md') (Get-RoleSoul $RepoRoot $role)
  Write-TextFile (Join-Path $workspacePath 'README.md') "# $role workspace`n`nProvisioned by bootstrap-yamen-runtime.ps1 for OpenClaw Yamen runtime.`n"

  if ($sourceAuth) {
    Copy-Item $sourceAuth (Join-Path $workspacePath $config.auth.targetName) -Force
  } elseif ($Force) {
    Write-TextFile (Join-Path $workspacePath $config.auth.targetName) "{}"
  }

  $summary += [pscustomobject]@{
    role = $role
    workspace = $workspacePath
    label = $roleLabel
    authCopied = [bool]$sourceAuth
  }
}

Write-Host "Provisioned Yamen runtime at: $RuntimeRoot"
$summary | Format-Table -AutoSize
if (-not $sourceAuth) {
  Write-Warning "auth-profiles.json source not found; rerun with a valid source or use -Force to create placeholders."
}
