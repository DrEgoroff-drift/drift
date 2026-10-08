/* ── M814 ДОСКА: объявления плиты — листы на пробке ──
   Строка доски на плите ↔ лист на стене: сколько объявлений, столько листов (до HALL_BOARD_MAX). Род листа — по
   строке: дело с кнопкой — бланк с отрывными язычками и булавкой, «Вам» (кнопка золотом) — тот же бланк с лентой
   акцента, стенгазета — широкий лист с шапкой и колонками, сводка дня — полоса телетайпа, слух — клочок на гвозде,
   прочее — записка. Порядок плиты (К ВАМ → ЗДЕСЬ → ДАЛЕКО) — порядок чтения доски: лист ложится в самую короткую
   из трёх колонок, первые — слева вверху. Колонка длиннее доски — листы налезают друг на друга, как на настоящей.
   Наведение на строку (или касание) — лист приподнят, выпрямлен и под своим светом, объектив скользит к нему
   (правило M624, тот же HALL_LENS, что у ящиков и приборов). Пока плита доски не открывалась на этой станции,
   на пробке — обезличенные листы (как видна чужая доска издали) */
const HALL_BOARD={mesh:null,key:"",hot:-1,rows:[],st:"",lay:null,lk:""};
const HALL_BOARD_BOX={x0:-4.45,x1:-2.25,y0:.92,y1:2.38};   /* пробка: x, высота, м; плоскость — HALL_B */
const HALL_BOARD_MAX=21;
const HALL_BOARD_COLS=3;
/* люди говорят, а не вешают бумагу: очередь у стойки и голоса зала — не листы */
const HALL_BOARD_SKIP=/^(ОЧЕРЕДЬ|У СТОЙКИ|В ЗАЛЕ|ПРИЁМНИК)/;
/* род листа: ширина, высота (м), бумага */
const HALL_SHEET={
  form:  {w:.24,h:.32,c:[234,228,210]},
  gold:  {w:.25,h:.33,c:[244,236,214]},
  paper: {w:.46,h:.34,c:[226,218,196]},
  strip: {w:.34,h:.085,c:[232,222,170]},
  scrap: {w:.15,h:.12,c:[206,198,180]},
  slip:  {w:.2, h:.15,c:[220,222,214]}
};
function hallBoardZ(){return HALL_B+.068;}   /* над лицом пробки (27f4b: HALL_B+.066) — тень листа ложится между */
function hallBoardHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}

/* плита доски → строки-листы; каждая строка с листом получает data-sheet (по нему наведение находит лист) */
function hallBoardDress(){
  if(typeof $body==="undefined"||!$body)return;
  const rows=[];let lane=0,sec="",first=0;
  for(const x of $body.children){
    if(x.classList.contains("sec")){const t=((x.querySelector("span")||x).textContent||"").trim();
      if(x.classList.contains("lane")){lane=/^К ВАМ/.test(t)?0:/^ДАЛЕКО/.test(t)?2:1;continue;}
      if(!x.classList.contains("note")){sec=t;first=1;}continue;}
    if(!x.classList.contains("row"))continue;
    if(HALL_BOARD_SKIP.test(sec)){first=0;continue;}
    const txt=(x.textContent||"").replace(/\s+/g," ").trim(),btn=x.querySelector("button"),gold=!!x.querySelector("button.gold");
    const kind=/^(НА СТЕНЕ|СТЕНГАЗ)/.test(sec)&&first?"paper":/^СЕГОДНЯ/.test(sec)?"strip":gold?"gold":btn?"form":lane===2?"scrap":"slip";
    first=0;
    if(rows.length>=HALL_BOARD_MAX){delete x.dataset.sheet;continue;}
    x.dataset.sheet=rows.length;rows.push({lane,kind,h:hallBoardHash(sec+"|"+txt)});
  }
  HALL_BOARD.rows=rows;HALL_BOARD.st=(G&&G.sys&&G.sys.key)||"";
  hallBoardWire();
}
function hallBoardWire(){
  if($body.__hallBoard)return;$body.__hallBoard=1;
  const set=e=>{const c=e.target&&e.target.closest?e.target:null,r=c&&c.closest(".row[data-sheet]");HALL_BOARD.hot=r?+r.dataset.sheet:-1;};
  $body.addEventListener("pointerover",set,{passive:true});$body.addEventListener("pointerdown",set,{passive:true});
  $body.addEventListener("pointerleave",e=>{if(e.pointerType!=="touch")HALL_BOARD.hot=-1;},{passive:true});
}
/* строки этой станции; чужие (с прошлой станции) не годятся — тогда обезличенные листы */
function hallBoardRows(){
  const k=(G&&G.sys&&G.sys.key)||"";
  if(HALL_BOARD.st===k&&HALL_BOARD.rows.length)return HALL_BOARD.rows;
  const R=rng(hallBoardHash(k)^0xB0A2D),n=7+((R()*5)|0),out=[];
  for(let i=0;i<n;i++)out.push({lane:1,kind:["form","slip","slip","strip","scrap"][(R()*5)|0],h:(R()*4294967296)>>>0,anon:1});
  return out;
}

/* раскладка: лист — в самую короткую колонку; колонка выше пробки — шаг сжат, листы налезают сверху вниз */
function hallBoardLayout(rows){
  const B=HALL_BOARD_BOX,m=.07,cw=(B.x1-B.x0-2*m)/HALL_BOARD_COLS,top=B.y1-m,av=B.y1-B.y0-2*m,gap=.035;
  const cols=[...Array(HALL_BOARD_COLS)].map(()=>({h:0,s:[]}));
  rows.forEach((r,i)=>{const S=HALL_SHEET[r.kind]||HALL_SHEET.slip;let ci=0;
    for(let c=1;c<cols.length;c++)if(cols[c].h<cols[ci].h-.02)ci=c;
    cols[ci].s.push({i,r,S});cols[ci].h+=S.h+gap;});
  const out=[];
  cols.forEach((C,ci)=>{const need=C.h-gap,k=need>av&&C.s.length>1?(av-C.s[C.s.length-1].S.h)/(need-C.s[C.s.length-1].S.h):1;
    let y=top;
    for(const s of C.s){const R=rng(s.r.h^0x5EE7),j=(R()-.5),w=Math.min(s.S.w,cw-.02);
      const x=B.x0+m+cw*(ci+.5)+j*(cw-w)*.7,cy=y-s.S.h/2;
      out[s.i]={i:s.i,kind:s.r.kind,anon:!!s.r.anon,w,h:s.S.h,col:s.S.c,c:[x,cy,hallBoardZ()],rot:(R()-.5)*(s.r.kind==="scrap"?.2:.08),hs:s.r.h};
      y-=(s.S.h+gap)*k;}});
  return out;
}
function hallBoardLay(){const rows=hallBoardRows(),lk=rows.map(r=>r.kind[0]+r.h.toString(36)).join(",");
  if(HALL_BOARD.lk!==lk){HALL_BOARD.lay=hallBoardLayout(rows);HALL_BOARD.lk=lk;}return HALL_BOARD.lay;}
function hallBoardSheet(i){const L=hallBoardLay();return L&&L[i]||null;}

/* лист: тело, строки текста, род — свои знаки; z — от лица пробки, в своих осях */
function hallBoardSheetMesh(K,s,acc,hot){
  const P=R3P,w=s.w/2,h=s.h/2,R=rng((s.hs^0x77)>>>0),ink=K.mt([58,54,50],.05,2,0),
    paper=K.mt(hot?mixc(s.col,[255,252,240],.35):s.col,.08,3,0,hot?.06:0);
  /* лист приколот сверху и отходит от пробки низом (наклон по x): свет доски сверху ложится на него иначе,
     чем на пробку, а под ним — тень, сдвинутая вниз тем больше, чем дальше отошёл низ */
  const tilt=hot?-.16:-(.03+.06*R()),lift=hot?.02:0;
  K.push([s.c[0],s.c[1],s.c[2]-.001],0,0,hot?0:s.rot);
  K.box([.004,-.006-(hot?.02:0),0],[w+.003,h+.002,.0004],K.mt([62,46,32],.05,2,0,0,true),0);   /* тень на пробке */
  K.pop();
  K.push([s.c[0],s.c[1]+h,s.c[2]+lift],0,tilt,hot?0:s.rot);K.push([0,-h,0]);
  K.box([0,0,.001],[w,h,.0009],paper,.0006);
  const line=(x0,x1,y,t,M)=>K.box([(x0+x1)/2,y,.0024],[(x1-x0)/2,t||.0032,.0004],M||ink,0);
  const lines=(x0,x1,y0,y1,n)=>{for(let k=0;k<n;k++){const y=y0-(y0-y1)*k/Math.max(1,n-1);line(x0,x0+(x1-x0)*(k===n-1?.45+R()*.3:.75+R()*.25),y);}};
  const pin=(x,y,c)=>{K.ell([x,y,.008],[.009,.009,.007],K.mt(c,.6,10,0),3,7);};
  if(s.kind==="form"||s.kind==="gold"){
    if(s.kind==="gold")K.box([0,h-.025,.0018],[w,.025,.0005],K.mt(acc,.3,6,0,.12),0);   /* лента «Вам» — акцент плиты */
    line(-w+.025,w*.4,h-.07,.006);lines(-w+.025,w-.025,h-.105,-h+.095,5);
    const n=6,tw=(2*w-.02)/n;for(let k=0;k<n;k++){const x=-w+.01+tw*(k+.5);   /* отрывные язычки: «возьмите» */
      K.box([x,-h+.035,.0022],[tw/2-.0035,.03,.0005],K.mt(mixc(s.col,[255,255,255],.25),.08,3,0),0);
      K.box([x,-h+.035,.003],[.0014,.02,.0003],ink,0);}
    pin(0,h-.012,s.kind==="gold"?acc:[190,40,32]);
  }else if(s.kind==="paper"){
    K.box([0,h-.035,.0018],[w-.012,.026,.0005],K.mt([150,40,32],.15,4,0),0);   /* шапка стенгазеты */
    K.box([-w*.42,h*.05,.0018],[w*.4,h*.32,.0005],K.mt([150,146,136],.1,3,0),0);   /* снимок */
    lines(-w+.02,-.01,-h*.4,-h+.03,3);lines(.02,w-.02,h-.09,-h+.03,8);
    pin(-w+.02,h-.012,[60,90,170]);pin(w-.02,h-.012,[60,90,170]);
  }else if(s.kind==="strip"){
    lines(-w+.015,w-.015,h-.022,-h+.022,2);pin(-w+.014,0,[40,40,44]);
  }else if(s.kind==="scrap"){
    lines(-w+.015,w-.02,h-.03,-h+.025,3);
    K.ell([0,h-.014,.006],[.004,.004,.006],K.mt([150,150,156],.8,12,P.brushed),3,6);   /* гвоздь */
  }else{
    line(-w+.02,w*.3,h-.03,.005);lines(-w+.02,w-.02,h-.058,-h+.025,3);pin(0,h-.012,[214,170,40]);
  }
  K.pop();K.pop();
}
/* следы снятых объявлений: уголки бумаги под булавками и выцветшие пятна — пробка прожита, но это не листы
   (в цвет пробки, без строк, не считаются) */
function hallBoardTrace(K,seed){
  const B=HALL_BOARD_BOX,R=rng(seed^0x7ACE),z=hallBoardZ()-.0015,fade=K.mt([140,109,75],.06,2,0,0,true);
  for(let i=0;i<5;i++){const x=B.x0+.1+R()*(B.x1-B.x0-.2),y=B.y0+.1+R()*(B.y1-B.y0-.2),w=.04+R()*.06,h=.04+R()*.08;
    K.push([x,y,z],0,0,(R()-.5)*.3);K.box([0,0,0],[w,h,.0004],fade,0);K.pop();}
  for(let i=0;i<5;i++){const x=B.x0+.08+R()*(B.x1-B.x0-.16),y=B.y0+.15+R()*(B.y1-B.y0-.2);
    K.push([x,y,z+.001],0,0,R()*TAU);K.tri([0,0,0],[.022,0,0],[0,.016,0],K.mt([214,206,186],.06,2,0,0,true),[0,0,1]);K.pop();}
}
function hallBoardMesh(lay,acc,seed){
  const K=r3Kit();K.flags=2;   /* листы — тела под резкостью поста: строки бланков не мылятся */
  hallBoardTrace(K,seed||0);
  for(const s of lay)if(s)hallBoardSheetMesh(K,s,acc,s.i===HALL_BOARD.hot&&!s.anon);
  return K.pack();
}
function hallBoardUp(L){
  hallBoardLay();const key=L.st+"|"+HALL_BOARD.lk+"|"+HALL_BOARD.hot;
  if(!HALL_BOARD.mesh||HALL_BOARD.key!==key){r3Drop(HALL_BOARD.mesh);HALL_BOARD.mesh=hallBoardMesh(HALL_BOARD.lay,L.acc,L.seed);HALL_BOARD.key=key;}
  return HALL_BOARD.mesh;
}
/* горящий лист: малый тёплый свет спереди-сверху, без тени — бумага светлеет, соседи нет */
function hallBoardLight(){
  const s=HALL_BOARD.hot>=0?hallBoardSheet(HALL_BOARD.hot):null;if(!s||s.anon)return null;
  return {p:[s.c[0]+.05,s.c[1]+.3,s.c[2]+.5],range:1.2,c:r3Sc(r3Lin([255,236,206]),1.4),vol:0,board:s.i};
}
function hallBoardDrop(){r3Drop(HALL_BOARD.mesh);HALL_BOARD.mesh=null;HALL_BOARD.key="";HALL_BOARD.hot=-1;}
