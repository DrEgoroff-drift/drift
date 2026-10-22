/* ══════════════ шахта: слова на вещах (как 22d в пещере, 21ae на базе) ══════════════
   Строки состояния (#prompt) стояли DOM-полосой внизу кадра. Теперь — табличкой у человека (клеть везёт
   его же): плашка слоя (08bj ovHang), к нему поводок. Что уже несут приборы,
   табличка не повторяет: глубину и породу — место (.locus), скафандр и трюм — шкалы (.vitals). На ней
   остаётся то, что сверх: горизонт, груз клети, ход (клавиши и что они делают), проходка, кусачие.
   Клавиши — колпачками, как на кнопках пэдов («[S] заложить ствол», o.keys в 08bj), остальное — регистром
   предложения (hangCase), как у табличек поверхности.
   Строка #msg (say) — общей табличкой hud.msg (08bj hangMsg) у той же точки: шахта отдаёт её как
   «man»; не встала (узкий экран) — остаётся DOM-строкой, слово не теряется.
   Без слоя (нет видеокарты) — прежние DOM-строки: класс ставит только живой кадр с объективом.
   #prompt под слоем — body.minewords. */
const DIG3_W={on:false};
function dig3WordsOn(){return G.mode==="dig"&&!!G.dig&&DIG3.live&&!!DIG3.lens&&hangOk();}
/* строки таблички из G.prompt: шапку (ГЛУБИНА …, СКАФАНДР …) режем до того, чего нет в приборах */
function dig3WordsLines(pr,msg){
  const L=String(pr||"").split("\n"),out=[];
  let i=0;
  /* горизонт — пока о нём не говорит сообщение («ГОРИЗОНТ 1 · 12 м» при прибытии клети) */
  if(/^ГЛУБИНА /.test(L[0]||"")){const h=/ГОРИЗОНТ \d+/.exec(L[0]);if(h&&String(msg||"").toUpperCase().indexOf(h[0])<0)out.push(h[0]);i=1;}
  if(/^СКАФАНДР /.test(L[i]||"")){const c=/КЛЕТЬ (\d+)\/\d+/.exec(L[i]);if(c&&+c[1]>0)out.push(c[0]);i++;}
  for(const s of L.slice(i))for(const q of s.split(" · "))if(q)out.push(q);
  return out.map(dig3KeyLine);
}
/* клавиша: код раскладки (латиница, цифры), стрелка, ПРОБЕЛ; на телефоне — имя пэда (ВВЕРХ, ВНИЗ) */
function dig3IsKey(t){return /^[A-Za-z0-9]+$|^[←→↑↓◀▶]$|^(ПРОБЕЛ|ВВЕРХ|ВНИЗ)$/.test(t);}
/* «S — ЗАЛОЖИТЬ СТВОЛ» → «[S] заложить ствол»; «ОГОНЬ (F) — …» → «[F] …»; не ход — регистр предложения */
function dig3KeyLine(s){
  const m=/^(.+?) — (.+)$/.exec(s);
  if(m){
    const p=/\(([^)]+)\)$/.exec(m[1]),K=p?[p[1]]:m[1].split(" ");
    if(K.every(dig3IsKey))return K.map(t=>"["+(t.length>2&&/^[А-ЯЁ]+$/.test(t)?t[0]+t.slice(1).toLowerCase():t)+"]").join("")+" "+m[2].toLowerCase();
  }
  /* «12 м» — единица строчной: hangCase молчит над строкой, где строчная уже есть; «ДО ГОРИЗОНТА 1: 12 м» —
     через точку, как фишки и строка места (двоеточие после цифры моноширинной мерки встаёт с разрядкой) */
  return hangCase(s.replace(/(\d): (?=\d)/g,"$1 · ").replace(/(\d) м(?![А-Яа-яЁё])/g,"$1 М"));
}
const DIG3_OLD_HSURF=hangSurface;
hangSurface=function(){
  DIG3_OLD_HSURF();
  if(!dig3WordsOn()||!hangIn())return;
  /* точка (м) → пиксели окна объективом кадра шахты (как cave3Pj у пещеры) */
  const M=DIG3,m=M.lens.vp,P=v=>{const cw=m[3]*v[0]+m[7]*v[1]+m[11]*v[2]+m[15];if(!(cw>0))return null;
    return [((m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12])/cw*.5+.5)*W,(.5-(m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13])/cw*.5)*H];};
  const head=[M.mx,M.my+1.9,DIG3_Z],a=P(head),b=P([M.mx,M.my+.9,DIG3_Z]);
  if(!a||!b)return;
  const r=Math.max(8,Math.abs(a[1]-b[1]));
  /* сам человек: таблички не садятся ему на шлем */
  {const n=ovNd(),p=P([M.mx-.5,M.my+2.1,DIG3_Z]),q=P([M.mx+.5,M.my-.1,DIG3_Z]);
    if(p&&q)hangBlock(Math.min(p[0],q[0])*n,Math.min(p[1],q[1])*n,Math.max(p[0],q[0])*n,Math.max(p[1],q[1])*n);}
  hangAt("man",a[0],a[1],r);   /* сюда же сообщение (hud.msg) */
  const ln=dig3WordsLines(G.prompt,G.msgT>0?G.msg:"");
  if(ln.length)ovHang("mine.act",ln,a[0],a[1],{r,keys:true});
};
const DIG3_OLD_HUD=hud;
hud=function(){
  DIG3_OLD_HUD.apply(this,arguments);
  if(typeof document==="undefined"||!document.body||!document.body.classList)return;
  const on=dig3WordsOn();
  if(on!==DIG3_W.on){DIG3_W.on=on;document.body.classList.toggle("minewords",on);}
};
