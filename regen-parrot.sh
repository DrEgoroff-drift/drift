#!/bin/sh
# site/parrot.js = заглушка вместо игры (до маркера) + src/12y + src/12z + жёрдочка (с маркера)
cd "$(dirname "$0")"
H=$(grep -n "трепло: жёрдочка" site/parrot.js | head -1 | cut -d: -f1)
T=$(grep -n "^/\* ── жёрдочка ──" site/parrot.js | cut -d: -f1)
{ sed -n "1,$((H-1))p" site/parrot.js
  cat src/12y-parrot-face.js src/12z-parrot-acts.js
  sed -n "$T,\$p" site/parrot.js
} > /tmp/parrot.new && mv /tmp/parrot.new site/parrot.js
