# Script untuk menambahkan dark variants ke semua class yang belum punya
$files = @(
    "resources\js\Pages\Barcode\Index.tsx",
    "resources\js\Pages\DamagedItems\Index.tsx",
    "resources\js\Pages\Items\Index.tsx",
    "resources\js\Pages\Locations\Index.tsx",
    "resources\js\Pages\Sales\Index.tsx",
    "resources\js\Pages\StockTransactions\Index.tsx",
    "resources\js\Pages\Users\Index.tsx"
)

$replacements = @{
    'text-slate-800"' = 'text-slate-800 dark:text-slate-100"'
    'text-slate-700"' = 'text-slate-700 dark:text-slate-200"'
    'text-slate-600"' = 'text-slate-600 dark:text-slate-400"'
    'text-slate-500"' = 'text-slate-500 dark:text-slate-400"'
    'text-slate-400"' = 'text-slate-400 dark:text-slate-500"'
    'bg-slate-100 ' = 'bg-slate-100 dark:bg-slate-800 '
    'bg-slate-50/' = 'bg-slate-50/ dark:bg-slate-800/'
    'bg-white ' = 'bg-white dark:bg-slate-900 '
    'border-slate-100 ' = 'border-slate-100 dark:border-slate-800 '
    'border-slate-200 ' = 'border-slate-200 dark:border-slate-700 '
    'divide-slate-100"' = 'divide-slate-100 dark:divide-slate-800"'
    'hover:bg-slate-50/' = 'hover:bg-slate-50/ dark:hover:bg-slate-800/'
}

foreach ($file in $files) {
    $path = Join-Path $PSScriptRoot $file
    if (Test-Path $path) {
        $content = Get-Content $path -Raw -Encoding UTF8
        $modified = $false
        
        foreach ($pattern in $replacements.Keys) {
            $replacement = $replacements[$pattern]
            if ($content -match [regex]::Escape($pattern) -and $content -notmatch [regex]::Escape($replacement)) {
                $content = $content -replace [regex]::Escape($pattern), $replacement
                $modified = $true
            }
        }
        
        if ($modified) {
            Set-Content $path $content -Encoding UTF8 -NoNewline
            Write-Host "Updated: $file" -ForegroundColor Green
        } else {
            Write-Host "Skipped: $file (already has dark variants)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`nDone! Run 'npm run build' to compile." -ForegroundColor Cyan
