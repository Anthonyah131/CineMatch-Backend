# PowerShell script to fix line endings in TypeScript files

Write-Host "Converting all TypeScript files to LF line endings..." -ForegroundColor Green

# Get all TypeScript files recursively
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.js", "*.json" -File

foreach ($file in $files) {
    Write-Host "Processing: $($file.FullName)" -ForegroundColor Yellow

    # Read content and replace CRLF with LF
    $content = Get-Content $file.FullName -Raw
    if ($content -ne $null) {
        $content = $content -replace "`r`n", "`n"
        $content = $content -replace "`r", "`n"

        # Write back with UTF8 encoding and LF line endings
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.UTF8Encoding]::new($false))
    }
}

Write-Host "Conversion complete!" -ForegroundColor Green
Write-Host "Running prettier to format all files..." -ForegroundColor Blue

# Run prettier
npm run format

Write-Host "All files processed!" -ForegroundColor Green
