# Fix all API route files to use validateApiAuth
$files = Get-ChildItem -Path "src\app\api" -Recurse -Filter "*.ts" -Exclude "*[...nextauth]*"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    # Check if file contains getServerSession
    if ($content -match 'getServerSession') {
        Write-Host "Processing: $($file.Name)"
        
        # Remove old imports if they exist
        if ($content -match "import \{ getServerSession \} from 'next-auth';") {
            $content = $content -replace "import \{ getServerSession \} from 'next-auth';`r?`n", ""
            $modified = $true
        }
        
        if ($content -match "import \{ authOptions \} from '@/lib/auth';") {
            $content = $content -replace "import \{ authOptions \} from '@/lib/auth';`r?`n", ""
            $modified = $true
        }
        
        # Add validateApiAuth import if not present
        if ($content -notmatch "validateApiAuth") {
            # Find the last import statement and add after it
            if ($content -match "(import .+ from .+;)\r?\n") {
                $lastImport = $matches[1]
                $content = $content -replace "($lastImport\r?\n)", "`$1import { validateApiAuth } from '@/lib/auth-utils';`n"
                $modified = $true
            }
        }
        
        # Replace getServerSession calls and remove auth checks
        $pattern = "const session = await getServerSession\(authOptions\);`r?`n`r?`n(\s+)if \(\!session\?\.user\?\.(id|email)\) \{`r?`n\s+return NextResponse\.json\(\s*\{[^\}]+\},\s*\{\s*status:\s*401\s*\}\s*\);`r?`n\s+\}"
        if ($content -match $pattern) {
            $content = $content -replace $pattern, "const session = await validateApiAuth();"
            $modified = $true
        }
        
        # Also handle cases without the empty line between
        $pattern2 = "const session = await getServerSession\(authOptions\);`r?`n\s+if \(\!session\?\.user\?\.(id|email)\) \{`r?`n\s+return NextResponse\.json\(\s*\{[^\}]+\},\s*\{\s*status:\s*401\s*\}\s*\);`r?`n\s+\}"
        if ($content -match $pattern2) {
            $content = $content -replace $pattern2, "const session = await validateApiAuth();"
            $modified = $true
        }
        
        if ($modified) {
            Set-Content -Path $file.FullName -Value $content
            Write-Host "  ✓ Updated"
        }
    }
}

Write-Host ""
Write-Host "Done! All files processed."
