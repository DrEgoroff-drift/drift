#!/bin/sh
# site/parrot.js = заглушка (16 строк) + src/12x без игровой части + 12y + 12z + жёрдочка (хвост файла)
cd "$(dirname "$0")"
{ sed -n '1,16p' site/parrot.js
  cat src/12x-parrot.js src/12y-parrot-face.js src/12z-parrot-acts.js | sed -n '165,$p'
  sed -n '970,$p' site/parrot.js
} > /tmp/parrot.new && mv /tmp/parrot.new site/parrot.js
