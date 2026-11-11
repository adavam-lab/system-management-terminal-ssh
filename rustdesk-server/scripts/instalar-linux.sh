#!/usr/bin/env bash
# Instala RustDesk en una PC Linux (Debian/Ubuntu, x86_64 o arm64) y la configura
# para recibir conexiones desde XSSH Manager.
#
# Uso (en la PC remota):
#   sudo ./instalar-linux.sh <servidor> "<clave id_ed25519.pub>" "<contraseña permanente>"
set -euo pipefail

SERVIDOR="${1:?Falta el servidor (IP o dominio)}"
CLAVE="${2:?Falta la clave (contenido de data/id_ed25519.pub)}"
CONTRASENA="${3:?Falta la contraseña permanente}"
VERSION="${RUSTDESK_VERSION:-1.5.0}"

[ "$(id -u)" -eq 0 ] || { echo "Ejecuta con sudo." >&2; exit 1; }
[ "${#CONTRASENA}" -ge 8 ] || { echo "Usa una contraseña de al menos 8 caracteres." >&2; exit 1; }

if ! command -v rustdesk >/dev/null; then
  case "$(uname -m)" in
    x86_64) ARCH=x86_64 ;;
    aarch64|arm64) ARCH=aarch64 ;;
    *) echo "Arquitectura no soportada: $(uname -m)" >&2; exit 1 ;;
  esac
  DEB="/tmp/rustdesk-${VERSION}-${ARCH}.deb"
  echo "Descargando RustDesk ${VERSION} (${ARCH})..."
  curl -fsSL -o "$DEB" "https://github.com/rustdesk/rustdesk/releases/download/${VERSION}/rustdesk-${VERSION}-${ARCH}.deb"
  apt-get install -y "$DEB"
fi

systemctl enable --now rustdesk
echo "Configurando servidor propio y contraseña..."
rustdesk --option custom-rendezvous-server "$SERVIDOR"
rustdesk --option key "$CLAVE"
rustdesk --password "$CONTRASENA"
systemctl restart rustdesk
sleep 5

echo
echo "=============================================="
echo " Listo. Datos para XSSH Manager:"
echo "   ID de RustDesk : $(rustdesk --get-id)"
echo "   Contraseña     : (la que pasaste como 3er parámetro)"
echo "=============================================="
echo "Nota: con escritorio Wayland, inicia sesión en 'Xorg' para permitir control remoto."
