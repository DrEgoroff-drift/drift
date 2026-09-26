#!/bin/sh
# site/parrot.js = заглушка вместо игры (до маркера) + src/12y + src/12z + жёрдочка (с маркера)
cd "$(dirname "$0")"
# С 12y1 (G15, 26.09) птица игры рисуется видеокартой: 2D-кисти parrotDraw в 12y больше нет, и склейка дала бы
# странице птицы тело без рисунка. site/parrot.js заморожен на 0.470.0 (решение Контроля 26.09: у страницы своя 2D-копия).
if ! grep -q "^function parrotDraw(c,W,H)" src/12y-parrot-face.js; then
  echo "regen-parrot: заморожен на 0.470.0: попугай игры на движке (b226135b)"; exit 0
fi
H=$(grep -n "трепло: жёрдочка" site/parrot.js | head -1 | cut -d: -f1)
T=$(grep -n "^/\* ── жёрдочка ──" site/parrot.js | cut -d: -f1)
{ sed -n "1,$((H-1))p" site/parrot.js
  cat src/12y-parrot-face.js src/12z-parrot-acts.js
  sed -n "$T,\$p" site/parrot.js
} > /tmp/parrot.new && mv /tmp/parrot.new site/parrot.js
