# Patch all @octokit packages to add require support
$octokitPackages = Get-ChildItem node_modules/@octokit -Directory

foreach ($pkg in $octokitPackages) {
    $pkgJsonPath = Join-Path $pkg.FullName "package.json"
    
    if (Test-Path $pkgJsonPath) {
        try {
            $pkgJson = Get-Content $pkgJsonPath | ConvertFrom-Json
            
            if ($pkgJson.exports) {
                $exports = $pkgJson.exports
                $dotExport = $exports | Get-Member -Name '.' -ErrorAction SilentlyContinue
                
                if ($dotExport) {
                    $modified = $false
                    $mainExport = $exports.'.'
                    
                    # Add require to node exports
                    if ($mainExport.node -and -not $mainExport.node.require) {
                        $mainExport.node | Add-Member -MemberType NoteProperty -Name 'require' -Value './dist-node/index.js' -Force
                        $modified = $true
                    }
                    
                    # Add require to default exports  
                    if ($mainExport.default -and -not $mainExport.default.require) {
                        $mainExport.default | Add-Member -MemberType NoteProperty -Name 'require' -Value './dist-node/index.js' -Force
                        $modified = $true
                    }
                    
                    if ($modified) {
                        $pkgJson | ConvertTo-Json -Depth 10 | Set-Content $pkgJsonPath
                        Write-Host "Patched: $($pkg.Name)"
                    }
                }
            }
        } catch {
            Write-Host "Failed: $($pkg.Name) - $($_.Exception.Message)"
        }
    }
}

Write-Host "Patch complete!"
