# PowerShell script to resolve merge conflicts by keeping incoming changes (after =======)
# This keeps the properly typed versions instead of 'unknown' types

$files = Get-ChildItem -Recurse -Include *.tsx,*.ts,*.md | Select-String -Pattern '^<<<<<<< ' | Select-Object -ExpandProperty Path -Unique

foreach ($file in $files) {
    Write-Host "Processing $file..."
    
    $content = Get-Content $file -Raw
    $originalContent = $content
    
    # Pattern to match merge conflicts:
    # <<<<<<< HEAD
    # ... (current/HEAD content)
    # =======
    # ... (incoming content)
    # >>>>>>> commit
    
    # Replace conflicts by keeping only the incoming part (after =======)
    $content = $content -replace '(?s)<<<<<<< HEAD.*?=======\r?\n(.*?)>>>>>>> [^\r\n]+\r?\n', '$1'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file -Value $content -NoNewline
        Write-Host "  Fixed conflicts in $file"
    }
}

Write-Host "Done! Processed $($files.Count) files."

