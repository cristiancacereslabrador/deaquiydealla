Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("C:\Users\Cristian Vianey\.gemini\antigravity\brain\2a6b7f11-6e05-4751-8269-0b1afe6ebfca\logo_58mm_final_v4_1778889793822.png")

$targetWidth = 360
$ratio = $targetWidth / $img.Width
$targetHeight = [int]($img.Height * $ratio)

# Creamos un bitmap temporal para renderizar con calidad
$tempBmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($tempBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.Clear([System.Drawing.Color]::White)
$g.DrawImage($img, 0, 0, $targetWidth, $targetHeight)

# Clonamos a formato de 1 bit (Blanco y Negro puro) para que pese poquísimo
# Nota: Creamos el rectángulo manualmente para evitar problemas de tipos
$rect = New-Object System.Drawing.Rectangle(0, 0, $targetWidth, $targetHeight)
$finalBmp = $tempBmp.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format1bppIndexed)

$finalBmp.Save("c:\Users\Cristian Vianey\Documents\+HUGO-APP\deaquiydealla\public\images\logo_58mm_final.bmp", [System.Drawing.Imaging.ImageFormat]::Bmp)

$finalBmp.Dispose()
$tempBmp.Dispose()
$img.Dispose()
$g.Dispose()
