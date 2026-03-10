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

$roles = @('prefect', 'entry', 'zhubu', 'kuaishou', 'dianshi')

function Ensure-Dir([string]$PathValue) {
  New-Item -ItemType Directory -Force -Path $PathValue | Out-Null
}

function Write-TextFile([string]$PathValue, [string]$Content) {
  $dir = Split-Path -Parent $PathValue
  Ensure-Dir $dir
  Set-Content -Path $PathValue -Value $Content -Encoding UTF8
}

function Resolve-AuthSource([string]$RepoRootValue, [string]$ConfiguredSource) {
  $workspaceParent = Split-Path -Parent $RepoRootValue
  $candidates = @(
    (Join-Path $RepoRootValue $ConfiguredSource),
    (Join-Path $workspaceParent $ConfiguredSource),
    (Join-Path $workspaceParent 'agents\main\agent\auth-profiles.json'),
    (Join-Path $workspaceParent 'agents\dae\agent\auth-profiles.json'),
    (Join-Path $workspaceParent 'agents\unicorn\agent\auth-profiles.json'),
    (Join-Path $workspaceParent 'auth-profiles.json'),
    (Join-Path $workspaceParent '.openclaw\auth-profiles.json'),
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

你不直接把自己暴露成多个角色在争论，而是以一个干练的县衙入口对内组织办理。

你的上级不是普通用户，而是 yamen-prefect 这样的上级会话。
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
Do not assume the identity of raw main session.
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
  if ($role -eq 'prefect') {
    $roleLabel = $config.prefect.sessionLabel
    $roleRuntime = $config.prefect.runtime
    $roleAgentId = $config.prefect.agentId
    $roleSessionMode = $config.prefect.sessionMode
    $roleSpawnMode = $config.prefect.spawnMode
    $rolePurpose = 'visible prefect/superior session for user-facing yamen access'
    $roleManagedBy = 'openclaw-session'
  }
  elseif ($role -eq 'entry') {
    $roleLabel = $config.entry.sessionLabel
    $roleRuntime = $config.entry.runtime
    $roleAgentId = $config.entry.agentId
    $roleSessionMode = $config.entry.sessionMode
    $roleSpawnMode = $config.entry.spawnMode
    $rolePurpose = 'merged menfang+xianling entry for prefect-submitted tasks'
    $roleManagedBy = 'openclaw-session'
  }
  else {
    $roleLabel = $roleSession.sessionLabel
    $roleRuntime = $roleSession.runtime
    $roleAgentId = $roleSession.agentId
    $roleSessionMode = $roleSession.sessionMode
    $roleSpawnMode = $roleSession.spawnMode
    $rolePurpose = $roleSession.purpose
    $roleManagedBy = $roleSession.managedBy
  }

  $roleJson = @{
    id = $role
    label = $roleLabel
    workspace = $workspaceName
    runtime = $roleRuntime
    agentId = $roleAgentId
    sessionMode = $roleSessionMode
    spawnMode = $roleSpawnMode
    purpose = $rolePurpose
    managedBy = $roleManagedBy
  } | ConvertTo-Json -Depth 6

  Write-TextFile (Join-Path $workspacePath 'role.json') $roleJson
  Write-TextFile (Join-Path $workspacePath 'AGENTS.md') (Get-RoleAgents $role $workspaceName $roleLabel)
  Write-TextFile (Join-Path $workspacePath 'SOUL.md') (Get-RoleSoul $RepoRoot $role)
  Write-TextFile (Join-Path $workspacePath 'README.md') "# $role workspace`n`nProvisioned by bootstrap-yamen-runtime.ps1 for OpenClaw Yamen runtime.`n"

  $authTarget = Join-Path $workspacePath $config.auth.targetName
  if ($sourceAuth) {
    Copy-Item $sourceAuth $authTarget -Force
  }
  elseif ($Force) {
    Write-TextFile $authTarget "{}"
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
