#!/bin/bash
# Сеанс в облаке Claude: то, без чего игра здесь не собирается, не проверяется и не рисуется (25.09).
# Дома у автора хук молчит — там свой PowerShell и настоящая видеокарта. Подробно — docs/CLOUD.md.
set -euo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# PowerShell 7: build.ps1 и test.ps1 написаны на нём (раннер GitHub собирает так же).
if ! command -v pwsh >/dev/null 2>&1; then
  . /etc/os-release
  deb=/tmp/packages-microsoft-prod.deb
  if curl -fsSL "https://packages.microsoft.com/config/${ID}/${VERSION_ID}/packages-microsoft-prod.deb" -o "$deb"; then
    dpkg -i "$deb" >/dev/null
    # чужой PPA за сетевой политикой не должен ронять весь хук: ошибки update — не повод сдаваться
    apt-get update -qq >/dev/null 2>&1 || true
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq powershell >/dev/null 2>&1 || true
  fi
fi

# Страж больших бинарников в pre-commit — единственная правка git config, которую разрешает CLAUDE.md.
git config core.hooksPath .githooks

# Видеокарты здесь нет: docs/shot.py рисует WebGPU на SwiftShader.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  grep -qsx 'export DRIFT_GPU=swiftshader' "$CLAUDE_ENV_FILE" || echo 'export DRIFT_GPU=swiftshader' >> "$CLAUDE_ENV_FILE"
fi

if command -v pwsh >/dev/null 2>&1; then
  echo "облако готово: pwsh $(pwsh -NoProfile -Command '$PSVersionTable.PSVersion.ToString()'), node $(node --version), DRIFT_GPU=swiftshader — см. docs/CLOUD.md"
else
  echo "облако: PowerShell НЕ встал (packages.microsoft.com недоступен?) — сборки нет; см. docs/CLOUD.md"
fi
