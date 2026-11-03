<#
.SYNOPSIS
  Instala RustDesk en una PC Windows y la deja lista para recibir conexiones desde XSS Manager.

.EXAMPLE
  # PowerShell como ADMINISTRADOR, en la PC remota:
  powershell -ExecutionPolicy Bypass -File .\instalar-windows.ps1 -Servidor rd.miempresa.com -Clave "AbC...=" -Contrasena "UnaClaveLarga2026"
#>
param(
  [Parameter(Mandatory = $true)] [string] $Servidor,   # IP o dominio del servidor hbbs
  [Parameter(Mandatory = $true)] [string] $Clave,      # contenido de data/id_ed25519.pub
  [Parameter(Mandatory = $true)] [string] $Contrasena, # contraseña permanente de esta PC
  [string] $Version = "1.5.0"
)
$ErrorActionPreference = "Stop"

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Ejecuta este script en PowerShell como Administrador."
}
if ($Contrasena.Length -lt 8) { throw "Usa una contraseña de al menos 8 caracteres." }

$exe = "C:\Program Files\RustDesk\rustdesk.exe"

if (-not (Test-Path $exe)) {
  $msi = Join-Path $env:TEMP "rustdesk-$Version-x86_64.msi"
  Write-Host "Descargando RustDesk $Version..."
  Invoke-WebRequest "https://github.com/rustdesk/rustdesk/releases/download/$Version/rustdesk-$Version-x86_64.msi" -OutFile $msi
  Write-Host "Instalando..."
  Start-Process msiexec.exe -ArgumentList "/i `"$msi`" /qn" -Wait
  # Esperar a que el servicio arranque
  for ($i = 0; $i -lt 30; $i++) {
    if (Get-Service RustDesk -ErrorAction SilentlyContinue) { break }
    Start-Sleep 2
  }
}
if (-not (Test-Path $exe)) { throw "No se encontró $exe tras la instalación." }

Write-Host "Configurando servidor propio y contraseña..."
& $exe --option custom-rendezvous-server $Servidor | Out-String | Out-Null
& $exe --option key $Clave | Out-String | Out-Null
& $exe --password $Contrasena | Out-String | Out-Null
Restart-Service RustDesk -ErrorAction SilentlyContinue
Start-Sleep 5

$id = (& $exe --get-id | Out-String).Trim()
Write-Host ""
Write-Host "=============================================="
Write-Host " Listo. Datos para XSS Manager:"
Write-Host "   ID de RustDesk : $id"
Write-Host "   Contraseña     : (la que pasaste en -Contrasena)"
Write-Host "=============================================="
