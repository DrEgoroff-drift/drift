/* ══════════════ шахта: порода ══════════════
   Отрезано от `23a-dig-draw` 25.08.2026: файл дорос до 50 КБ, и внутри у него
   лежали рядом две разные работы — из чего сложена гора и что в ней построено.
   Здесь первая: пласты, материал, трещины, блоки, дайки, сырые потёки и старые
   брошенные выработки, то есть всё, что было тут до кирки. Пустота, крепь,
   настилы, вагонетка и свет остались в `23a`.

   Порядок склейки: 23 кладёт `DIG_*` и `digCell`, эти двое их читают.
   Рисуется через тайловый кэш (`drawTiles`, 18c): порода под камерой не
   меняется, значит печётся один раз, а кадр только кладёт картинки. */

/* ── отрисовка ──
   Шахта рисовалась поклеточно: у каждой ячейки своя заливка, своя кромка и
   своя обводка. На экране это читалось клетчатой скатертью — сетка тридцати
   пикселей была видна раньше, чем порода, и никакой материал её не спасал.

   Устройство перевёрнуто: порода — сплошной массив с пластами и материалом,
   а рисуется не она, а **пустота**. Выработка собирается в один путь из всех
   пройденных клеток, заливается тьмой и обводится кромкой света. Сетки не
   остаётся нигде: внутренних границ у объединённого пути нет.

   Свет тоже другой: глубина сама по себе темнеет, а видно ровно столько,
   сколько берёт фонарь. Пласт, из которого копаешь, читается полосой поперёк
   всего кадра — по нему видно, что порода сменилась, ещё до того, как это
   скажет строка. */
function digRockPass(D,p,camx,camy){
  /* пласты во всю ширину: тот же разрез, что в срезе грунта и в геологии */
  const G0=geologyOf(p);
  for(let k=0;k<G0.length;k++){
    const L=G0[k];
    const P=new Path2D();
    let started=false;
    for(let sx=-20;sx<=W+20;sx+=26){
      const wx=camx+sx, y=(L.d0+geoWob(L,wx))/DIG_GEO_K-camy;
      if(!started){P.moveTo(sx,y);started=true;}else P.lineTo(sx,y);
    }
    P.lineTo(W+20,H+40);P.lineTo(-20,H+40);P.closePath();
    ctx.fillStyle="rgb("+L.col.join(",")+")";
    ctx.fill(P);
    ctx.strokeStyle="rgba(0,0,0,.34)";ctx.lineWidth=1.4;ctx.stroke(P);
    /* контакт пластов: под кровлей каждого — полоса тени, по самой кромке —
       волосок света. Без этого пласты — полосы заливки с линией между ними,
       а не породы, лежащие одна на другой (G3). Клип по пласту: тень только
       внутрь, вверх она не лезет. */
    ctx.save();ctx.clip(P);
    ctx.strokeStyle="rgba(0,0,0,.22)";ctx.lineWidth=18;ctx.stroke(P);
    ctx.strokeStyle="rgba(255,255,255,.07)";ctx.lineWidth=2.6;ctx.stroke(P);
    ctx.restore();
    /* жилы минерала внутри пласта — те же штрихи, что в срезе: короткие,
       наклонные, от координаты, поэтому не мигают при движении */
    if(L.vein>.05){
      const mn=MINERAL[(L.seed>>>3)%MINERAL.length];
      ctx.save();ctx.clip(P);
      const st=54, x0=Math.floor((camx-st)/st)*st;
      for(let wx=x0;wx<camx+W+st;wx+=st){
        const hh=hashi(Math.floor(wx/st),L.seed,0x5EED);
        if((hh&255)/255>L.vein*.5)continue;
        const dy=L.d0+((hh>>>8)&63)/63*L.th*.8;
        const sx=wx-camx, sy=(dy+geoWob(L,wx))/DIG_GEO_K-camy;
        if(sy<-20||sy>H+20)continue;
        const ln=9+((hh>>>14)&15), ang=((hh>>>18)&15)/15*1.1-.55;
        ctx.strokeStyle="rgba("+mn.join(",")+","+(.16+((hh>>>22)&7)/7*.26).toFixed(2)+")";
        ctx.lineWidth=1+((hh>>>25)&1);
        ctx.beginPath();ctx.moveTo(sx,sy);
        ctx.lineTo(sx+Math.cos(ang)*ln,sy+Math.sin(ang)*ln);ctx.stroke();
      }
      ctx.restore();
    }
  }
  /* ── массив, а не заливка (M169) ──
     Пласты дают полосы цвета, материал — общий шум, и на глубине, где пластов
     уже нет, полкадра оставалось ровным пятном: порода читалась фоном, а не
     камнем, в котором прорублен ход. Камню нужны ТРИ вещи, и все три —
     крупнее клетки: система трещин, блоки между ними и секущая дайка.
     Всё считается от мировых координат и печётся в тайл: кадру бесплатно. */
  /* материал планеты поверх пластов: два прохода, как везде */
  const mat=planetMat(p);
  if(mat)fillMaterial(mat,camx,camy,.52,.30,null,{x:0,y:0,w:W,h:H});
  /* массив кладётся ПОСЛЕ материала: под ним трещины и пятна съедались до
     невидимости (самокритика M169) */
  digBedding(G0,camx,camy);
  digRockMass(p,camx,camy);
  /* Глубина: чем ниже, тем меньше света. Плоская чёрная заливка поверх гасила
     не только яркость, но и разницу тонов — камень становился одноцветным.
     Умножение темнит пропорционально: тёмное темнеет сильнее светлого, и весь
     рисунок породы остаётся виден. */
  const dk=clamp((camy+H*.5)/2600,0,.34);
  const k=Math.round(255*(1-(.16+dk)));
  ctx.save();
  ctx.globalCompositeOperation="multiply";
  ctx.fillStyle="rgb("+k+","+k+","+(k+6)+")";
  ctx.fillRect(0,0,W,H);
  ctx.restore();
}
/* ── слоистость внутри пласта (M55 #1) ──
   Пласты дают полосы разного цвета — но только там, где их в кадре несколько.
   На малой глубине, то есть там, где игрок оказывается ПЕРВЫЙ раз, один слой
   занимает почти весь экран, и порода выходит ровной заливкой. Внешний
   тестировщик назвал шахту самым слабым экраном игры, и вот отчего: она
   идёт сразу после поверхности — лучшего экрана в игре, — и разница добивает.

   Осадок однотонным не бывает: он отложен слойками, и каждый чуть светлее или
   темнее соседа. Прослои идут ПО ВОЛНЕ пласта, а не поперёк кадра: вдоль него,
   иначе это не порода, а полосатые обои.

   КЛАДЁТСЯ ПОСЛЕ МАТЕРИАЛА — и это не мелочь порядка. Первый счёт рисовал
   прослои внутри цикла пластов, то есть ДО `fillMaterial`, и материал съедал
   их ровно так же, как когда-то съел трещины (самокритика M169). Тот же
   урок, второй раз, в том же файле: всё, что должно быть видно на камне,
   ложится поверх материала. */
function digBedding(G0,camx,camy){
  for(const L of G0){
    const top=L.d0/DIG_GEO_K, bot=(L.d0+L.th)/DIG_GEO_K;
    if(bot-camy<-40||top-camy>H+40)continue;
    const step=clamp(L.th/DIG_GEO_K/9,10,46);
    for(let d=top,i=0; d<bot; d+=step,i++){
      const yy0=d-camy;
      if(yy0>H+60||yy0+step<-60)continue;
      const hh=hashi(i,L.seed,0x8ED0);
      const a=((hh&31)/31-.5)*.30;                /* светлее или темнее */
      if(Math.abs(a)<.05)continue;
      const th2=step*(.30+((hh>>>5)&7)/7*.55);
      ctx.fillStyle=a>0?"rgba(255,246,228,"+a.toFixed(3)+")"
                       :"rgba(6,8,4,"+(-a).toFixed(3)+")";
      ctx.beginPath();
      let st2=false;
      for(let sx=-20;sx<=W+20;sx+=26){
        const wx=camx+sx, y2=d+geoWob(L,wx)/DIG_GEO_K-camy;
        if(!st2){ctx.moveTo(sx,y2);st2=true;}else ctx.lineTo(sx,y2);
      }
      for(let sx=W+20;sx>=-20;sx-=26){
        const wx=camx+sx, y2=d+th2+geoWob(L,wx)/DIG_GEO_K-camy;
        ctx.lineTo(sx,y2);
      }
      ctx.closePath();ctx.fill();
    }
  }
}
/* ── трещины, блоки и дайки ──
   Шаг трещин — двести с лишним пикселей: это в семь раз крупнее клетки, и
   именно поэтому массив читается массивом, а не текстурой. Ячейка сетки
   трещин берёт свой наклон и свою длину из хеша координат, так что рисунок
   не повторяется и не дрожит при движении камеры. */
function digRockMass(p,camx,camy){
  const S=600;                                   /* ячейка, из которой растут трещины */
  const x0=Math.floor((camx-S)/S)*S, y0=Math.floor((camy-S)/S)*S;
  ctx.save();
  /* ── облачность тона ──
     Первый заход красил КВАДРАТ ячейки: на экране проступала ровно та сетка,
     от которой весь режим уходит. Пятна ставятся со смещением из хеша и
     радиусом больше ячейки — границ нет нигде (самокритика M169). */
  for(let wy=y0;wy<camy+H+S;wy+=S)for(let wx=x0;wx<camx+W+S;wx+=S){
    for(let i=0;i<3;i++){
      const h=hashi(Math.floor(wx/S)*7+i,Math.floor(wy/S)*13+i*5,0x30C4);
      const px=wx+(h&1023)/1023*S-camx, py=wy+((h>>>10)&1023)/1023*S-camy;
      const rr=S*(.35+((h>>>20)&7)/7*.5);
      /* пятна не только светлее-темнее, но и ТЕПЛЕЕ-ХОЛОДНЕЕ: одна бирюза на
         весь кадр читается краской, а не камнем. Плотность поднята вдвое —
         при пяти сотых её съедали материал, глубина и виньетка (M169) */
      const kind=(h>>>23)&3;
      const col=kind===0?"255,244,214":kind===1?"0,4,10":kind===2?"196,150,110":"110,150,170";
      const g=ctx.createRadialGradient(px,py,0,px,py,rr);
      const a=(.09+((h>>>25)&7)/7*.13).toFixed(3);
      g.addColorStop(0,"rgba("+col+","+a+")");
      g.addColorStop(1,"rgba("+col+",0)");
      ctx.fillStyle=g;ctx.fillRect(px-rr,py-rr,rr*2,rr*2);
    }
    /* ── трещины ──
       Короткие отрезки в каждой ячейке читались волосками на стекле. Трещина
       в породе — это ломаная в несколько сот пикселей, которая проходит
       ячейку насквозь и уходит к соседям; ветвь отходит под острым углом.
       Геометрия считается от мировых координат, поэтому на стыке тайлов
       линия продолжается сама собой. */
    for(let j=0;j<2;j++){
      const h=hashi(Math.floor(wx/S)*31+j,Math.floor(wy/S)*17+j*3,0x5A17);
      let jx=wx+(h&1023)/1023*S, jy=wy+((h>>>10)&1023)/1023*S;
      let ang=(((h>>>20)&31)/31-.5)*.9+((h&1)?Math.PI/2:.15);
      const seg=4+((h>>>26)&3), ln=180+((h>>>16)&127);
      const pts=[[jx,jy]];
      for(let k=0;k<seg;k++){
        const hh=hashi(Math.floor(wx/S)*97+j*13+k,Math.floor(wy/S)*61+k,0x77A1);
        ang+=((hh&15)/15-.5)*.5;
        jx+=Math.cos(ang)*ln;jy+=Math.sin(ang)*ln;
        pts.push([jx,jy]);
      }
      const draw=(off,style,w)=>{
        ctx.strokeStyle=style;ctx.lineWidth=w;
        ctx.beginPath();
        ctx.moveTo(pts[0][0]-camx+off,pts[0][1]-camy);
        for(let k=1;k<pts.length;k++)ctx.lineTo(pts[k][0]-camx+off,pts[k][1]-camy);
        ctx.stroke();
      };
      draw(0,"rgba(0,3,8,.58)",2+((h>>>28)&1));
      draw(1.8,"rgba(232,230,216,.14)",1);
      /* ветвь от середины */
      const m=pts[Math.floor(pts.length/2)];
      const a2=ang+(((h>>>5)&7)/7-.5)*1.8;
      ctx.strokeStyle="rgba(0,3,8,.34)";ctx.lineWidth=1.2;
      ctx.beginPath();
      ctx.moveTo(m[0]-camx,m[1]-camy);
      ctx.lineTo(m[0]-camx+Math.cos(a2)*ln*1.2,m[1]-camy+Math.sin(a2)*ln*1.2);
      ctx.stroke();
    }
    /* крап: зерно крупнее пыли материала */
    for(let i=0;i<26;i++){
      const hh=hashi(Math.floor(wx/S)*131+i,Math.floor(wy/S)*29+i*3,0x9C0B);
      const gx=wx+(hh&1023)/1023*S-camx, gy=wy+((hh>>>10)&1023)/1023*S-camy;
      const rr=.9+((hh>>>20)&3)*.7;
      ctx.fillStyle=((hh>>>22)&1)?"rgba(0,2,6,.34)":"rgba(232,226,208,.24)";
      ctx.beginPath();ctx.ellipse(gx,gy,rr*1.7,rr,.4,0,TAU);ctx.fill();
    }
  }
  /* ── чужие выработки ──
     Ствол уходил вниз сквозь мёртвый однородный камень, и на весь экран не
     было ни одной причины посмотреть в сторону (долг G3: «длинный ствол
     остаётся длинным стволом»). Раз в полторы тысячи пикселей в стороне от
     ствола лежит ЗАБРОШЕННАЯ камера: обрушенная кровля, сгнившая крепь,
     осыпь. Она не проходима — это след, а не ход, и он говорит, что здесь
     копали до вас. */
  const AB=640;
  for(let k=Math.floor((camy-AB)/AB);k<=Math.floor((camy+H)/AB);k++){
    const h=hashi(k,11,0xAB0C);
    const side=((h>>>1)&1)?1:-1;
    const ax=side*(170+((h>>>2)&191)), ay=k*AB+((h>>>10)&255);
    const aw=90+((h>>>19)&63), ah=44+((h>>>25)&31);
    const sx=ax-camx, sy=ay-camy;
    if(sx<-aw*2||sx>W+aw*2||sy<-ah*3||sy>H+ah*3)continue;
    ctx.save();
    /* Полость рваная, а не купол: гладкая арка читалась дыркой, вырезанной
       ножницами (самокритика M169). Кромку ведём ломаной из хеша — тот же
       приём, что у выработки игрока. */
    ctx.beginPath();
    const N=11;
    for(let i=0;i<=N;i++){
      const t=i/N, a=Math.PI*(1+t);                 /* верхняя дуга слева направо */
      const hh=hashi(k*23+i,9,0x0C0C);
      const rj=1+((hh&15)/15-.5)*.34;
      const px2=sx+Math.cos(a)*aw*.5*rj, py2=sy+Math.sin(a)*ah*.9*rj;
      i?ctx.lineTo(px2,py2):ctx.moveTo(px2,py2);
    }
    ctx.lineTo(sx+aw*.46,sy+ah*.5);
    for(let i=N;i>=0;i--){                          /* пол: осыпь, а не прямая */
      const t=i/N;
      const hh=hashi(k*31+i,13,0x0D0D);
      ctx.lineTo(sx-aw*.46+aw*.92*t,sy+ah*.5-((hh&7)/7)*4);
    }
    ctx.closePath();
    /* нутро не чёрное: сверху чуть теплее (пыль ловит свет фонарей), вглубь
       гаснет — плоская заливка .92 черноты читалась дырой без кромки, и автор
       ткнул в неё на скрине (M178, то же правило, что у валуна и устья) */
    const vg=ctx.createLinearGradient(sx,sy-ah,sx,sy+ah*.5);
    vg.addColorStop(0,"rgba(34,32,30,.94)");
    vg.addColorStop(.5,"rgba(18,18,19,.94)");
    vg.addColorStop(1,"rgba(10,11,13,.94)");
    ctx.fillStyle=vg;ctx.fill();
    /* кромка, поймавшая свет: верхняя дуга заметно светлее нижней */
    ctx.save();ctx.clip();
    ctx.strokeStyle="rgba(226,222,206,.30)";ctx.lineWidth=2.2;
    ctx.beginPath();
    for(let i=0;i<=N;i++){
      const t=i/N, a=Math.PI*(1+t);
      const hh=hashi(k*23+i,9,0x0C0C);
      const rj=1+((hh&15)/15-.5)*.34;
      const px2=sx+Math.cos(a)*aw*.5*rj, py2=sy+Math.sin(a)*ah*.9*rj+1.4;
      i?ctx.lineTo(px2,py2):ctx.moveTo(px2,py2);
    }
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle="rgba(226,222,206,.10)";ctx.lineWidth=1;ctx.stroke();
    ctx.clip();
    /* обрушение из кровли: конус светлее полости, иначе его нет */
    ctx.fillStyle="rgba(58,54,48,.95)";
    ctx.beginPath();
    ctx.moveTo(sx-aw*.06,sy-ah*.85);ctx.lineTo(sx+aw*.30,sy+ah*.5);
    ctx.lineTo(sx-aw*.38,sy+ah*.5);ctx.closePath();ctx.fill();
    ctx.fillStyle="rgba(84,78,68,.75)";
    for(let i=0;i<14;i++){
      const hh=hashi(k*17+i,5,0x0B0B);
      ctx.beginPath();
      ctx.ellipse(sx-aw*.34+(hh&63)/63*aw*.68,sy+ah*.36+((hh>>>6)&7)/7*7,
        2.2+((hh>>>9)&3),1.6+((hh>>>11)&2),0,0,TAU);ctx.fill();
    }
    /* сгнившая крепь: рама, у которой выбило стойку, и обломок ригеля */
    ctx.strokeStyle="rgba(92,74,52,.95)";ctx.lineWidth=3.4;
    ctx.beginPath();
    ctx.moveTo(sx-aw*.36,sy+ah*.5);ctx.lineTo(sx-aw*.32,sy-ah*.42);
    ctx.lineTo(sx+aw*.10,sy-ah*.30);ctx.stroke();
    ctx.lineWidth=2.6;
    ctx.beginPath();
    ctx.moveTo(sx+aw*.32,sy+ah*.5);ctx.lineTo(sx+aw*.20,sy-ah*.16);ctx.stroke();
    ctx.strokeStyle="rgba(120,98,68,.5)";ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(sx-aw*.32,sy-ah*.42);ctx.lineTo(sx-aw*.30,sy+ah*.2);ctx.stroke();
    ctx.restore();
  }
  /* мокрые потёки: там, где вода нашла трещину, порода темнее и блестит */
  for(let k=Math.floor((camy-700)/700);k<=Math.floor((camy+H)/700);k++){
    const h=hashi(k,3,0xD12D);
    if((h&3)===0)continue;
    const wx2=(((h>>>2)&2047)-1024)*1.2, wy2=k*700+((h>>>13)&511);
    const ww=30+((h>>>22)&63), hh2=120+((h>>>26)&63)*3;
    const sx=wx2-camx, sy=wy2-camy;
    if(sx<-ww*2||sx>W+ww*2)continue;
    const g=ctx.createLinearGradient(sx,sy,sx,sy+hh2);
    g.addColorStop(0,"rgba(0,6,12,.30)");
    g.addColorStop(.6,"rgba(0,6,12,.16)");
    g.addColorStop(1,"rgba(0,6,12,0)");
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.moveTo(sx-ww*.5,sy);ctx.lineTo(sx+ww*.5,sy);
    ctx.lineTo(sx+ww*.2,sy+hh2);ctx.lineTo(sx-ww*.3,sy+hh2);ctx.closePath();ctx.fill();
    ctx.fillStyle="rgba(150,190,210,.10)";
    ctx.fillRect(sx-1,sy,1.6,hh2*.7);
  }
  /* дайка: раз в две с лишним тысячи пикселей глубины породу сечёт полоса
     другого камня — по ней видно, что спуск идёт куда-то, а не по одному и
     тому же коридору (хвост G3: «длинный ствол остаётся длинным стволом») */
  const DK=2300;
  for(let k=Math.floor((camy-DK)/DK);k<=Math.floor((camy+H)/DK);k++){
    const h=hashi(k,7,0xDA1C);
    if((h&3)===0)continue;                        /* не на каждом ярусе */
    const wy=k*DK+((h>>>2)&511);
    const th=46+((h>>>11)&63);
    const sl=(((h>>>17)&15)/15-.5)*1.6;           /* наклон дайки */
    const mn=MINERAL[(h>>>21)%MINERAL.length];
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-20,wy-camy+(-20-camx)*sl*.06);
    ctx.lineTo(W+20,wy-camy+(W+20-camx)*sl*.06);
    ctx.lineTo(W+20,wy-camy+th+(W+20-camx)*sl*.06);
    ctx.lineTo(-20,wy-camy+th+(-20-camx)*sl*.06);
    ctx.closePath();
    ctx.fillStyle="rgba("+mn.join(",")+",.13)";ctx.fill();
    ctx.strokeStyle="rgba(0,2,6,.34)";ctx.lineWidth=1.6;ctx.stroke();
    ctx.clip();
    ctx.strokeStyle="rgba(255,250,238,.07)";ctx.lineWidth=1;
    for(let i=0;i<26;i++){
      const hh=hashi(k*53+i,3,0x1D1D);
      const gx=(hh&1023)/1023*(W+40)-20;
      ctx.beginPath();
      ctx.moveTo(gx,wy-camy+(gx-camx)*sl*.06);
      ctx.lineTo(gx+((hh>>>10)&15)-7,wy-camy+th+(gx-camx)*sl*.06);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}
/* пустота: один путь на всю выработку */
