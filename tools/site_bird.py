# Геометрия с опубликованной 3D-птицей; без WebGL и отдельного цикла страницы.
from pathlib import Path
root=Path(__file__).resolve().parents[1]
names=['10-math','15-geom','20-body','21-parts','22-feather']
for i,name in enumerate(names):
    s=(root/'bird'/f'{name}.js').read_text(encoding='utf-8')
    if i==0:s='/* Геометрия сайта treplo3d: tools/site_bird.py, исходники bird/. */\nconst SITE_BIRD=(()=>{\n'+s
    if i==len(names)-1:s+='\nreturn {buildBody,buildParts,buildBeads,buildFeather,layoutCoat,layoutPlumes,FEA_STRIDE};\n})();\n'
    (root/'src'/f'12y2{chr(97+i)}-site-bird.js').write_text(s,encoding='utf-8')
print('Site bird geometry synchronized from bird/:',len(names),'modules')
