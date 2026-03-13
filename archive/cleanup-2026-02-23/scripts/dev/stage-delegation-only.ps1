param(
    [switch]$IncludeHandoff
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $repoRoot

$files = @(
    'src/components/workspace-members-panel.tsx',
    'src/app/api/workspaces/[id]/invite/route.ts',
    'src/app/api/workspaces/[id]/members/[memberId]/route.ts',
    'src/lib/workspace-permissions.ts',
    'scripts/dev/permission-system-debug.ts',
    'PERMISSION_SYSTEM_AUDIT.md'
)

if ($IncludeHandoff) {
    $files += 'DELEGATION_TREE_PR_HANDOFF.md'
}

Write-Host 'Staging delegation-scope files only...' -ForegroundColor Cyan

foreach ($file in $files) {
    if (Test-Path -LiteralPath $file) {
        git add -- $file
        Write-Host "  staged: $file" -ForegroundColor Green
    } else {
        Write-Host "  missing: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nStaged files summary:" -ForegroundColor Cyan
git diff --name-only --cached

Write-Host "`nTip: inspect staged diff with:" -ForegroundColor DarkGray
Write-Host '  git diff --cached' -ForegroundColor DarkGray
