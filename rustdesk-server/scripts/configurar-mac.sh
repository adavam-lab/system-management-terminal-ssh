#!/usr/bin/env bash
# Configura RustDesk (ya instalado en /Applications) en una Mac remota para usar tu servidor.
#
# Antes, en la Mac remota:
#   1. Instala RustDesk:  brew install --cask rustdesk   (o el .dmg de GitHub)
#   2. Ábrelo una vez y concede los permisos que pide en Ajustes del Sistema →
#      Privacidad y seguridad: "Grabación de pantalla" y "Accesibilidad".
#      macOS NO permite conceder estos permisos por script.
#   3. En RustDesk, menú → "Instalar servicio" (para que funcione sin sesión abierta).
#
# Uso:
#   sudo ./configurar-mac.sh <servidor> "<clave id_ed25519.pub>" "<contraseña permanente>"
set -euo pipefail

SERVIDOR="${1:?Falta el servidor (IP o dominio)}"
CLAVE="${2:?Falta la clave (contenido de data/id_ed25519.pub)}"
CONTRASENA="${3:?Falta la contraseña permanente}"
RD="/Applications/RustDesk.app/Contents/MacOS/RustDesk"

[ "$(id -u)" -eq 0 ] || { echo "Ejecuta con sudo." >&2; exit 1; }
[ -x "$RD" ] || { echo "No se encontró $RD. Instala RustDesk primero." >&2; exit 1; }
[ "${#CONTRASENA}" -ge 8 ] || { echo "Usa una contraseña de al menos 8 caracteres." >&2; exit 1; }

"$RD" --option custom-rendezvous-server "$SERVIDOR"
"$RD" --option key "$CLAVE"
"$RD" --password "$CONTRASENA"

echo
echo "=============================================="
echo " Listo. Datos para XSSH Manager:"
echo "   ID de RustDesk : $("$RD" --get-id)"
echo "   Contraseña     : (la que pasaste como 3er parámetro)"
echo "=============================================="
