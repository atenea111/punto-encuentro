$path = 'app/page.tsx'
$lines = Get-Content $path
$out = New-Object System.Collections.Generic.List[string]
$skip = $false
$keep = $true

foreach ($line in $lines) {
    if ($line -match '^<<<<<<< HEAD') {
        $skip = $true
        $keep = $true
        continue
    }
    if ($line -match '^=======') {
        $keep = $false
        continue
    }
    if ($line -match '^>>>>>>>') {
        $skip = $false
        $keep = $true
        continue
    }
    
    if (-not $skip -or $keep) {
        $out.Add($line)
    }
}
[IO.File]::WriteAllLines($path, $out)
