Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("C:\Users\Cristian Vianey\.gemini\antigravity\brain\2a6b7f11-6e05-4751-8269-0b1afe6ebfca\logo_58mm_final_v4_1778889793822.png")
# Calculamos alto proporcional para evitar achatamiento
$targetWidth = 360
$ratio = $targetWidth / $img.Width
$targetHeight = [int]($img.Height * $ratio)

$bmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.Clear([System.Drawing.Color]::White)
$g.DrawImage($img, 0, 0, $targetWidth, $targetHeight)
$bmp.Save("c:\Users\Cristian Vianey\Documents\+HUGO-APP\deaquiydealla\public\images\logo_58mm_final.bmp", [System.Drawing.Imaging.ImageFormat]::Bmp)
$bmp.Dispose()
$img.Dispose()
$g.Dispose()
