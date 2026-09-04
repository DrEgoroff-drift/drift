# -*- coding: utf-8 -*-
"""«Смена» в игру: docs/SMENA.md → src/12ud-smena-text.js (M353).

Проза живёт в markdown и правится там; этот скрипт кладёт её в таблицу
SMENA_TEXT={n:[абзацы…]} — абзац «· · ·» это разрыв сцены, абзац с «> » это
строка журнала. Запускать после каждой правки книги, перед build.ps1:

    python docs/mksmena.py
"""
import re, json, os, io
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = io.open(os.path.join(root, 'docs', 'SMENA.md'), encoding='utf-8').read()
chs = re.split(r'\n## (?=\d+\. )', src)[1:]
out = {}
titles = {}
for c in chs:
    head, _, body = c.partition('\n')
    n = int(head.split('.')[0]); titles[n] = head.split('. ', 1)[1].strip()
    paras = [p.strip() for p in body.split('\n\n') if p.strip()]
    paras = [p for p in paras if not (p.startswith('*Рис.') and p.endswith('*'))]
    out[n] = paras
assert len(out) == 72, len(out)
js = ['/* ══════════════ «Смена»: текст романа — СГЕНЕРИРОВАНО docs/mksmena.py из docs/SMENA.md, руками не править ══════════════ */',
      'const SMENA_TEXT=' + json.dumps({str(k): out[k] for k in sorted(out)}, ensure_ascii=False, separators=(',', ':')) + ';',
      'const SMENA_TITLE=' + json.dumps({str(k): titles[k] for k in sorted(titles)}, ensure_ascii=False, separators=(',', ':')) + ';']
io.open(os.path.join(root, 'src', '12ud-smena-text.js'), 'w', encoding='utf-8').write('\n'.join(js) + '\n')
print('chapters', len(out), 'chars', sum(len(p) for v in out.values() for p in v))
