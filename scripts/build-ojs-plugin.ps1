# UDSM Insights OJS Plugin - Build & Package Script
# Run this script to create a ready-to-install OJS plugin package

param(
    [switch]$SkipBuild = $false,
    [string]$OutputDir = "."
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  UDSM Insights OJS Plugin Builder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Define paths
$ProjectRoot = Split-Path -Parent $PSScriptRoot
if (-not $ProjectRoot) { $ProjectRoot = Get-Location }
$PluginSourceDir = Join-Path $ProjectRoot "ojs-plugin"
$DistDir = Join-Path $ProjectRoot "dist"
$PluginOutputDir = Join-Path $OutputDir "udsmInsights"
$ArchiveName = "udsmInsights.tar.gz"

# Step 1: Build React app (unless skipped)
if (-not $SkipBuild) {
    Write-Host "[1/5] Building React application..." -ForegroundColor Yellow
    Push-Location $ProjectRoot
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "Build failed" }
    }
    finally {
        Pop-Location
    }
    Write-Host "      Build complete!" -ForegroundColor Green
} else {
    Write-Host "[1/5] Skipping build (using existing dist/)" -ForegroundColor Yellow
}

# Step 2: Create plugin directory structure
Write-Host "[2/5] Creating plugin directory structure..." -ForegroundColor Yellow
if (Test-Path $PluginOutputDir) {
    Remove-Item -Recurse -Force $PluginOutputDir
}
New-Item -ItemType Directory -Path $PluginOutputDir -Force | Out-Null
New-Item -ItemType Directory -Path "$PluginOutputDir/assets" -Force | Out-Null
New-Item -ItemType Directory -Path "$PluginOutputDir/locale/en_US" -Force | Out-Null
New-Item -ItemType Directory -Path "$PluginOutputDir/pages" -Force | Out-Null
New-Item -ItemType Directory -Path "$PluginOutputDir/templates" -Force | Out-Null
Write-Host "      Directory structure created!" -ForegroundColor Green

# Step 3: Copy plugin PHP files
Write-Host "[3/5] Copying plugin files..." -ForegroundColor Yellow
Copy-Item "$PluginSourceDir/*.php" $PluginOutputDir -Force
Copy-Item "$PluginSourceDir/*.xml" $PluginOutputDir -Force
Copy-Item "$PluginSourceDir/README.md" $PluginOutputDir -Force
Copy-Item "$PluginSourceDir/locale/en_US/*" "$PluginOutputDir/locale/en_US/" -Force
Copy-Item "$PluginSourceDir/pages/*" "$PluginOutputDir/pages/" -Force
Copy-Item "$PluginSourceDir/templates/*" "$PluginOutputDir/templates/" -Force
Write-Host "      Plugin files copied!" -ForegroundColor Green

# Step 4: Copy built React assets
Write-Host "[4/5] Copying React build assets..." -ForegroundColor Yellow
if (-not (Test-Path $DistDir)) {
    throw "dist/ folder not found. Run 'npm run build' first."
}

# Copy all dist files to assets
Copy-Item "$DistDir/*" "$PluginOutputDir/assets/" -Recurse -Force

# Also copy the logo
$LogoPath = Join-Path $ProjectRoot "public/udsmlogo.png"
if (Test-Path $LogoPath) {
    Copy-Item $LogoPath "$PluginOutputDir/assets/" -Force
}
Write-Host "      Assets copied!" -ForegroundColor Green

# Step 5: Create archive (if tar is available)
Write-Host "[5/5] Creating installation package..." -ForegroundColor Yellow
$ArchivePath = Join-Path $OutputDir $ArchiveName

# Try using tar (available on Windows 10+)
try {
    Push-Location $OutputDir
    tar -czvf $ArchiveName "udsmInsights"
    Pop-Location
    Write-Host "      Package created: $ArchivePath" -ForegroundColor Green
}
catch {
    Write-Host "      Note: tar not available, plugin folder ready for manual packaging" -ForegroundColor Yellow
    Write-Host "      Plugin folder: $PluginOutputDir" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Installation:" -ForegroundColor White
Write-Host "  1. Copy 'udsmInsights' folder to: [OJS]/plugins/generic/" -ForegroundColor Gray
Write-Host "  2. Enable plugin in OJS: Settings > Website > Plugins" -ForegroundColor Gray
Write-Host "  3. Configure API settings in plugin settings" -ForegroundColor Gray
Write-Host ""
Write-Host "Output files:" -ForegroundColor White
Write-Host "  - Plugin folder: $PluginOutputDir" -ForegroundColor Gray
if (Test-Path $ArchivePath) {
    Write-Host "  - Archive: $ArchivePath" -ForegroundColor Gray
}
