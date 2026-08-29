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
        /* угол жилы — от поля направлений, а не свой на каждый штрих (M253):
           жилы одного пласта текут согласованно, лёгкий разброс остаётся */
        const ln=9+((hh>>>14)&15),
              ang=dirAt(wx,dy,L.seed,1/340)+(((hh>>>18)&15)/15-.5)*.3;
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
  /* профиль почвы у самой поверхности: до потемнения глубиной, чтобы верх
     разреза жил по тем же правилам света, что и всё остальное */
  digSoil(p,camx,camy);
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
    /* ── у полости есть ЗАДНЯЯ СТЕНКА (хвост M214: «нутро выработок плоское») ──
       Нутро красилось градиентом от тёмного вверху к ещё более тёмному внизу —
       то есть пол выходил самым чёрным местом камеры, и вся она читалась
       плоской вырезкой. В пещере свет так не лежит никогда: темнее всего
       КРОВЛЯ (она отвёрнута от всего, что светит), а ниже видна задняя стенка,
       и пол — самое светлое, потому что на него всё и осыпалось.

       Поэтому здесь три вещи, а не заливка: кровля почти чёрная, задняя стенка
       той же породы, что вокруг, но втрое темнее, и на ней — своё зерно. */
    const back=digSMix((geologyOf(p)[0]||{col:[90,88,86]}).col,[0,0,0],.72);
    const vg=ctx.createLinearGradient(sx,sy-ah,sx,sy+ah*.5);
    vg.addColorStop(0,"rgba(7,7,9,.96)");
    vg.addColorStop(.42,digRGB(back,.96));
    vg.addColorStop(1,digRGB(digSMix(back,[255,240,214],.14),.96));
    ctx.fillStyle=vg;ctx.fill();
    /* зерно на задней стенке: без него она ровная краска, а не камень в тени */
    ctx.save();ctx.clip();
    for(let i=0;i<22;i++){
      const hh=hashi(k*41+i,7,0x2A9E);
      const gx=sx-aw*.48+((hh&63)/63)*aw*.96, gy=sy-ah*.5+((hh>>>6)&63)/63*ah;
      ctx.fillStyle=(hh>>>13&1)?"rgba(255,246,228,.05)":"rgba(0,0,0,.16)";
      ctx.fillRect(gx,gy,2+((hh>>>14)&3),1.2);
    }
    ctx.restore();
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
    /* обрушение из кровли: конус светлее полости, иначе его нет. Теперь под ним
       стоит задняя стенка, и он обязан быть светлее уже ЕЁ */
    /* Склоны у осыпи не прямые: это груда обломков под своим углом, а ровный
       треугольник читался вырезанным ножницами — той же ошибкой, что когда-то
       гладкий купол полости. Ведём оба склона ломаной из хеша. */
    {
      const apx=sx-aw*.06, apy=sy-ah*.85, fy=sy+ah*.5;
      const jit=(i,sd)=>((hashi(k*53+i,sd,0x6C0E)&15)/15-.5);
      ctx.fillStyle=digRGB(digSMix(back,[255,244,220],.26),.95);
      ctx.beginPath();
      ctx.moveTo(apx,apy);
      for(let i=1;i<=5;i++){
        const t=i/5;
        ctx.lineTo(apx+(sx+aw*.30-apx)*t+jit(i,3)*7,apy+(fy-apy)*t+jit(i,5)*4);
      }
      ctx.lineTo(sx-aw*.38,fy);
      for(let i=4;i>=1;i--){
        const t=i/5;
        ctx.lineTo(apx+(sx-aw*.38-apx)*t+jit(i,7)*7,apy+(fy-apy)*t+jit(i,11)*4);
      }
      ctx.closePath();ctx.fill();
      /* свет ложится на верх осыпи: без этого груда — плоское пятно */
      ctx.strokeStyle=digRGB(digSMix(back,[255,246,226],.5),.5);
      ctx.lineWidth=1.4;
      ctx.beginPath();
      ctx.moveTo(apx,apy);
      for(let i=1;i<=3;i++){
        const t=i/5;
        ctx.lineTo(apx+(sx+aw*.30-apx)*t+jit(i,3)*7,apy+(fy-apy)*t+jit(i,5)*4);
      }
      ctx.stroke();
    }
    ctx.fillStyle=digRGB(digSMix(back,[255,244,220],.42),.8);
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

/* ══════════════ почвенный профиль: небо кончается не линейкой ══════════════
   Хвост M214. Шахта начиналась с ЛИНЕЙКИ: ровная горизонталь во всю ширину
   кадра, выше — небо, ниже — сплошная порода. Так земля не устроена нигде.
   У любого разреза сверху лежит профиль, и по нему глаз мгновенно понимает,
   что смотрит на землю, а не на заливку: дёрн, под ним рыхлое с камнями и
   корнями, ещё ниже — разбитая выветриванием кровля коренной породы, и только
   потом свежий камень. Плюс сама поверхность не линейка: она гуляет.

   ПРОФИЛЬ ИДЁТ ОТ МИРА, А НЕ ОТ ВКУСА. Верхний тон берётся из палитры планеты
   (той же, которой она видна с орбиты), нижний — из первого пласта геологии.
   На мире без воздуха дёрна не бывает: там сверху не почва, а рыхлый развал
   обломков — реголит, светлее и без единого корня.

   Печётся в тайл вместе с породой: камера его только двигает. */
const DIG_TURF=9, DIG_SUB=27, DIG_WEA=66;
function digSMix(a,b,t){return [Math.round(lerp(a[0],b[0],t)),Math.round(lerp(a[1],b[1],t)),Math.round(lerp(a[2],b[2],t))];}
function digRGB(c,a){return "rgba("+c[0]+","+c[1]+","+c[2]+","+(a===undefined?1:a)+")";}
/* линия поверхности: две волны, обе от посева планеты. Больше двенадцати
   пикселей размаха брать нельзя — верхний ряд клеток стоит от нуля, и рельеф
   не должен выедать его наполовину */
function digSurfY(p,wx){
  const s=(p&&p.seed)|0;
  return (noise1(wx*.0085,s^0x50A1)-.5)*23+(noise1(wx*.038,s^0x11B2)-.5)*8;
}
function digSoilCols(p){
  const pal=(p&&p.T&&p.T.pal)||[[70,70,74]];
  const top=pal[Math.min(3,pal.length-1)];
  const G0=(typeof geologyOf==="function")?geologyOf(p):null;
  const rock=(G0&&G0[0]&&G0[0].col)||[90,88,86];
  const air=!!(p&&p.T&&p.T.atm!=="отсутствует");
  return {
    air,
    /* дёрн: тот же тон, что виден сверху, но втоптанный в органику. Без
       воздуха вместо него реголит — светлее камня, а не темнее */
    turf: air?digSMix(top,[24,20,13],.60):digSMix(top,[150,148,150],.42),
    /* подпочва БУРАЯ: она темнее и теплее и камня, и того, что видно сверху.
       Первый счёт мешал только эти два тона и на зелёном мире выходил зелёным —
       то есть тем же камнем, только светлее, и профиля в кадре не было */
    sub:  digSMix(digSMix(top,rock,.5),[96,68,38],.46),
    rock
  };
}
/* полоса между двумя кривыми: верхняя слева направо, нижняя обратно */
function digSoilBand(camx,camy,fy0,fy1,fill){
  ctx.beginPath();
  for(let sx=-12;sx<=W+12;sx+=6)ctx.lineTo(sx,fy0(camx+sx)-camy);
  for(let sx=W+12;sx>=-12;sx-=6)ctx.lineTo(sx,fy1(camx+sx)-camy);
  ctx.closePath();
  ctx.fillStyle=fill;ctx.fill();
}
function digSoil(p,camx,camy){
  const hi=-16, lo=DIG_TURF+DIG_SUB+DIG_WEA+16;
  if(camy>lo||camy+H<hi)return;                    /* тайл не задевает профиль */
  const C=digSoilCols(p);
  const s=(p&&p.seed)|0;
  const y0=wx=>digSurfY(p,wx);
  const y1=wx=>digSurfY(p,wx)+DIG_TURF+(noise1(wx*.05,s^0x7711)-.5)*4;
  const y2=wx=>digSurfY(p,wx)+DIG_TURF+DIG_SUB+(noise1(wx*.032,s^0x3391)-.5)*9;
  const y3=wx=>digSurfY(p,wx)+DIG_TURF+DIG_SUB+DIG_WEA+(noise1(wx*.021,s^0x2255)-.5)*16;
  ctx.save();
  /* 1. кора выветривания: коренная порода, разбитая сверху. Тон уходит в ржавь
        (в этой полосе всё окислено) и растворяется книзу — граница со свежим
        камнем не линия, а сход на нет */
  const wg=ctx.createLinearGradient(0,DIG_TURF+DIG_SUB-camy,0,DIG_TURF+DIG_SUB+DIG_WEA-camy);
  const wea=digSMix(C.rock,[132,88,42],.42);
  wg.addColorStop(0,digRGB(wea,.92));
  wg.addColorStop(1,digRGB(wea,0));
  digSoilBand(camx,camy,y2,y3,wg);
  /* и она РАЗБИТА, а не подкрашена: сверху камень уже развалился на отдельные
     куски, и между ними видны тёмные щели. Без этого «кора выветривания» —
     просто ржавый оттенок, которого в кадре никто не заметит */
  for(let wx=Math.floor((camx-60)/26)*26;wx<camx+W+60;wx+=26){
    const hh=hashi(Math.floor(wx/26),s,0x8B10);
    const bw=14+((hh>>>3)&15), bh=7+((hh>>>7)&7);
    const t=((hh>>>11)&7)/7;
    const yy=lerp(y2(wx),y3(wx),t*t*.8)-camy;
    ctx.fillStyle="rgba(0,0,0,"+(.20*(1-t)+.04).toFixed(3)+")";
    ctx.beginPath();
    ctx.moveTo(wx-camx,yy);
    ctx.lineTo(wx-camx+bw,yy-1.5+((hh>>>15)&3));
    ctx.lineTo(wx-camx+bw-2,yy+bh);
    ctx.lineTo(wx-camx-1,yy+bh-2);
    ctx.closePath();ctx.fill();
    ctx.fillStyle="rgba(255,246,228,"+(.09*(1-t)).toFixed(3)+")";
    ctx.fillRect(wx-camx,yy-1,bw-3,1.1);
  }
  /* 2. рыхлое: подпочва с камнями */
  digSoilBand(camx,camy,y1,y2,digRGB(C.sub));
  /* 3. дёрн (или реголит) */
  digSoilBand(camx,camy,y0,y1,digRGB(C.turf));
  /* ── камни в рыхлом ──
     Обломки лежат гуще к низу: наверху их вымыло, внизу они ещё не окатались */
  for(let wx=Math.floor((camx-40)/9)*9;wx<camx+W+40;wx+=9){
    const hh=hashi(Math.floor(wx/9),s,0x51F5);
    if((hh&7)<4)continue;
    const t=((hh>>>3)&15)/15;
    const yy=lerp(y1(wx),y2(wx),.15+t*.8)-camy;
    const rr=1.2+((hh>>>7)&3)*.7;
    ctx.fillStyle=digRGB(digSMix(C.sub,C.rock,.55+t*.3),.85);
    ctx.beginPath();ctx.ellipse(wx-camx,yy,rr*1.5,rr,((hh>>>9)&7)/7*1.2,0,TAU);ctx.fill();
    /* у камня своя верхняя кромка — иначе это пятно, а не камень */
    ctx.fillStyle="rgba(255,250,238,.13)";
    ctx.beginPath();ctx.ellipse(wx-camx-rr*.3,yy-rr*.45,rr*.8,rr*.3,0,0,TAU);ctx.fill();
  }
  /* ── трещины в коре выветривания ──
     Их тем больше, чем ближе к поверхности: сверху камень уже развалился на
     отдельные куски, глубже он ещё цел. Это и читается как «кора» */
  for(let wx=Math.floor((camx-60)/17)*17;wx<camx+W+60;wx+=17){
    const hh=hashi(Math.floor(wx/17),s,0xC7A5);
    const n=1+((hh>>>2)&1);
    for(let i=0;i<n;i++){
      const h2=hashi(Math.floor(wx/17)*7+i,s,0x0F1E);
      const t=((h2>>>4)&15)/15;
      const yy=lerp(y2(wx),y3(wx),t*t)-camy;      /* квадрат: гуще вверху */
      const ln=5+((h2>>>8)&7), ang=1.05+((h2>>>11)&7)/7*.9;
      ctx.strokeStyle="rgba(0,0,0,"+(.30*(1-t)+.06).toFixed(3)+")";
      ctx.lineWidth=1+((h2>>>14)&1)*.6;
      ctx.beginPath();ctx.moveTo(wx-camx,yy);
      ctx.lineTo(wx-camx+Math.cos(ang)*ln,yy+Math.sin(ang)*ln);ctx.stroke();
    }
  }
  /* ── корни ──
     Только там, где есть чему расти. Корень идёт из дёрна вниз, сужается и
     ветвится один раз: две расходящиеся нитки читаются корнем, прямая —
     царапиной */
  if(C.air){
    for(let wx=Math.floor((camx-60)/34)*34;wx<camx+W+60;wx+=34){
      const hh=hashi(Math.floor(wx/34),s,0x0B00);
      if((hh&3)===0)continue;
      const x0=wx-camx+((hh>>>2)&7), yA=y1(wx)-camy-2;
      const dep=10+((hh>>>5)&15);
      ctx.strokeStyle="rgba(28,22,14,.55)";
      ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(x0,yA);
      ctx.quadraticCurveTo(x0+((hh>>>9)&7)-3,yA+dep*.6,x0+((hh>>>12)&15)-7,yA+dep);
      ctx.stroke();
      ctx.lineWidth=.9;
      ctx.beginPath();ctx.moveTo(x0,yA+dep*.45);
      ctx.quadraticCurveTo(x0-4,yA+dep*.7,x0-7-((hh>>>16)&7),yA+dep*.85);
      ctx.stroke();
    }
  }
  /* ── кромка, поймавшая небо ──
     То же правило, что у устья пещеры и у валуна: у силуэта обязана быть
     кромка, иначе он наклейка. Здесь это дневной свет, лежащий на самой земле */
  ctx.beginPath();
  for(let sx=-12;sx<=W+12;sx+=6)ctx.lineTo(sx,y0(camx+sx)-camy+.7);
  ctx.strokeStyle=C.air?"rgba(255,247,226,.40)":"rgba(226,232,240,.34)";
  ctx.lineWidth=1.6;ctx.stroke();
  ctx.restore();
}

/* ── что стоит НА земле ──
   Профиль печётся в тайл, а небо кладётся поверх тайлов — значит всё, что
   торчит выше линии, тайл нарисовать не может: небо его закрасит. Поэтому
   кромка рисуется в кадре, сразу после неба, и это единственное, что здесь
   считается каждый кадр: полсотни штрихов на всю ширину.

   Мелочь, а решает: пучки травы (или щебень на мире без воздуха) на линии
   мгновенно говорят, что это ЗЕМЛЯ, а не граница двух заливок. Плюс полоска
   воздуха у самого горизонта — свет, лежащий на пыли над грунтом. */
function digSurfFringe(p,camx,camy){
  if(camy>60||camy+H<-40)return;
  const C=digSoilCols(p), s=(p&&p.seed)|0;
  ctx.save();
  /* воздух над грунтом: у земли он всегда светлее самого неба */
  {
    const yh=digSurfY(p,camx+W*.5)-camy;
    const hg=ctx.createLinearGradient(0,yh-46,0,yh+2);
    const sky=(p.T&&p.T.sky&&p.T.sky[0])||[90,120,150];
    hg.addColorStop(0,"rgba("+sky.join(",")+",0)");
    hg.addColorStop(1,"rgba("+sky.map(v=>Math.min(255,v+38)).join(",")+",.30)");
    ctx.fillStyle=hg;ctx.fillRect(0,yh-46,W,48);
  }
  for(let wx=Math.floor((camx-30)/13)*13;wx<camx+W+30;wx+=13){
    const hh=hashi(Math.floor(wx/13),s,0x7A5E);
    if((hh&3)===0||((hh>>>17)&7)<2)continue;   /* трава растёт клочьями, а не гребёнкой */
    const x=wx-camx+((hh>>>2)&7)-3, y=digSurfY(p,wx)-camy+.5;
    if(C.air){
      /* пучок: три-четыре травины из одной точки, разной длины и наклона */
      const n=2+((hh>>>5)&3);
      ctx.strokeStyle="rgba(26,34,18,.62)";
      for(let i=0;i<n;i++){
        const h2=hashi(Math.floor(wx/13)*5+i,s,0x3C1D);
        const ln=2.5+((h2>>>2)&7)*1.15, an=-1.57+(((h2>>>6)&15)/15-.5)*1.5;
        ctx.lineWidth=1+((h2>>>10)&1)*.4;
        ctx.beginPath();ctx.moveTo(x+i*.9-1,y);
        ctx.quadraticCurveTo(x+Math.cos(an)*ln*.6,y+Math.sin(an)*ln*.7,
                             x+Math.cos(an)*ln,y+Math.sin(an)*ln);
        ctx.stroke();
      }
    }else{
      /* без воздуха расти нечему: на линии лежит щебень */
      const rr=1.3+((hh>>>5)&3)*.6;
      ctx.fillStyle=digRGB(digSMix(C.turf,[210,210,214],.35),.9);
      ctx.beginPath();ctx.ellipse(x,y-rr*.35,rr*1.4,rr*.8,0,0,TAU);ctx.fill();
      ctx.fillStyle="rgba(0,0,0,.25)";
      ctx.fillRect(x-rr*1.3,y,rr*2.6,1);
    }
  }
  ctx.restore();
}
