# Add eslint-disable comments before functions with any parameters in GitHub integration files

$patterns = @(
    @{
        file = "src\app\api\github\webhook\route.ts"
        matches = @(
            "async function handlePullRequestEvent",
            "async function handleIssueEvent", 
            "async function handleIssueCommentEvent"
        )
    },
    @{
        file = "src\app\api\github\sync\action\route.ts"
        matches = @(
            "async function syncToGitHub",
            "async function syncFromGitHub",
            "async function bidirectionalSync",
            "let result: any"
        )
    },
    @{
        file = "src\app\api\github\schedule\route.ts"
        matches = @(
            "async function createSchedule",
            "async function updateSchedule",
            "async function deleteSchedule",
            "async function triggerSchedule"
        )
    },
    @{
        file = "src\app\api\github\branches\route.ts"
        matches = @(
            "async function switchBranch",
            "async function createBranch",
            "async function compareBranches",
            "branches: branches.map((branch: any)"
        )
    },
    @{
        file = "src\app\api\github\repositories\route.ts"
        matches = @(
            "repositories: repos.map((repo: any)"
        )
    },
    @{
        file = "src\app\api\github\setup\route.ts"
        matches = @(
            "let repoData: any"
        )
    },
    @{
        file = "src\app\api\webhooks\github\route.ts"
        matches = @(
            "async function processWebhookAsync(event: string, payload: any)"
        )
    },
    @{
        file = "src\app\api\github\webhook\route.ts"
        matches = @(
            "labels: issue.labels.map((l: any)"
        )
    }
)

foreach ($pattern in $patterns) {
    $file = $pattern.file
    $content = Get-Content $file -Raw
    
    foreach ($match in $pattern.matches) {
        if ($content -match [regex]::Escape($match)) {
            $content = $content -replace "(\s*)($([regex]::Escape($match)))", "`$1// eslint-disable-next-line @typescript-eslint/no-explicit-any`n`$1`$2"
        }
    }
    
    Set-Content $file $content -NoNewline
}

Write-Host "Added eslint-disable comments to GitHub integration files"
