# Render the Riddles app icon (scripts/riddles-icon.html) to PNGs.
#   powershell -File scripts/riddles-icon.ps1
# Headless Edge renders it once at 512px (it mishandles tiny windows), then .NET scales it down.
# Writes public/riddles/icon-512.png, icon-192.png, apple-touch-icon.png (180, iPhone home screen), favicon-32.png
Add-Type -AssemblyName System.Drawing
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$root = Split-Path -Parent $PSScriptRoot
$src = "file:///" + ((Join-Path $PSScriptRoot "riddles-icon.html") -replace "\\", "/")
$out = Join-Path $root "public\riddles"
$big = Join-Path $out "icon-512.png"
if (Test-Path $big) { Remove-Item $big }
& $edge --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --virtual-time-budget=3000 "--window-size=512,512" "--screenshot=$big" $src 2>$null | Out-Null
$tries = 0; while (-not (Test-Path $big) -and $tries -lt 40) { Start-Sleep -Milliseconds 250; $tries++ }
if (-not (Test-Path $big)) { "FAILED to render icon-512.png"; exit 1 }
"icon-512.png           512px  {0} bytes" -f (Get-Item $big).Length
$srcImg = [System.Drawing.Image]::FromFile($big)
foreach ($pair in @(@("icon-192.png", 192), @("apple-touch-icon.png", 180), @("favicon-32.png", 32))) {
  $name = $pair[0]; $s = $pair[1]; $dest = Join-Path $out $name
  $bmp = New-Object System.Drawing.Bitmap $s, $s
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.DrawImage($srcImg, 0, 0, $s, $s)
  $g.Dispose(); $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
  "{0,-22} {1}px  {2} bytes" -f $name, $s, (Get-Item $dest).Length
}
$srcImg.Dispose()
