# Fix all remaining TypeScript errors
# Get list of files with errors
$errorFiles = npm run lint 2>&1 | Select-String "^C:\\Users" | ForEach-Object { 
    ($_ -replace '^\s+', '').Trim() 
} | Select-Object -Unique

Write-Host "Files with errors: $($errorFiles.Count)"

foreach ($file in $errorFiles) {
    Write-Host "Processing: $file"
    
    # Read content
    $content = Get-Content $file -Raw
    $originalContent = $content
    
    # Fix: any[] -> unknown[]
    $content = $content -replace ':\s*any\[\]', ': unknown[]'
    $content = $content -replace '<any\[\]>', '<unknown[]>'
    
    # Fix: any as function parameter/return type
    $content = $content -replace '\(([^:]+):\s*any\)', '($1: unknown)'
    $content = $content -replace ':\s*any\s*=>', ': unknown =>'
    $content = $content -replace 'Promise<any>', 'Promise<unknown>'
    $content = $content -replace 'Record<string,\s*any>', 'Record<string, unknown>'
    
    # Fix: let customerId -> const customerId (specific cases)
    $content = $content -replace 'let customerId =', 'const customerId ='
    $content = $content -replace 'let formData =', 'const formData ='
    
    # Save if changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file -Value $content -NoNewline
        Write-Host "  Fixed: $file"
    }
}

Write-Host "Done! Running lint to check..."


