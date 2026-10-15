/* ══════════════ дом на движке (M850b, docs/DESIGN-rooms.md §4) ══════════════
   Тот же дом, что ходит в 29c (комнаты по ступеням HOME_TIERS, светёлка и спальня над кабинетом и жилой
   частью, жильцы, вещи), — сценой рендера интерьеров 27f2 во весь экран под приборами. Логика дома не правится:
   ход, жильцы, оклик, «рассмотреть», лестница — 29c/29e; здесь только как это выглядит.

   ПРАВИЛА ФАЙЛА:
   1. Мерило — человек 1.75 м. Комната — 5 м по полосе, 4 м в глубину, стены 2.8 м; дверь 2.1, стол .76, верстак .88.
   2. Разрез: потолка нет (балки остались), передней стены нет; крыша видна только наверху, стропилами.
      Не построенная ступень — закрытая дверь в торце.
   3. Ключ — лампа комнаты, где стоит хозяин, с тенью; соседние лампы — разлив без тени; окно днём — тёплое
      солнце (вторая тень), ночью — холод. Свет ≤ 12, тени ≤ 2.
   4. Палитра: каждая комната — свой тон штукатурки по кругу (охра, тёплый, серый, сиреневый, олива, зелень
      кабинета, терракота, сталь причала), дерево общее; оранжевое — только вещи людей.
   5. Слова — на вещах: «рассмотреть» — табличка у вещи, выход — тусклая надпись на двери. Старый художник
      drawHomeIn живёт за ROOM3.on (?room=0). */
const HOME3={cn:null,tags:null,mesh:null,rkey:"",cx:null,cy:0,tx:null,t0:0,err:0,frames:0,stat:null,vp:null,sz:null,meas:null,stool:null,anch:{},night:null};
const HOME3_RW=5,HOME3_B=-2.4,HOME3_F=1.7,HOME3_H=2.8,HOME3_UP=3.05,HOME3_MZ=.25;
const HOME3_M=new Float32Array(R3_MAXI*R3_PART*16),HOME3_OT=new Float32Array(R3_MAXI*R3_PART*4);
/* тон стен по комнате (правило 4) и лампа — доля ширины, над чем она висит */
const HOME3_TONE={corner:[146,132,112],hall:[156,140,116],garage:[118,122,122],case:[132,124,140],shop:[128,128,108],
  study:[96,116,96],living:[170,128,100],dock:[108,120,134],bed:[152,124,124],loft:[164,150,116]};
const HOME3_LAMP={corner:.45,hall:.5,garage:.5,case:.5,shop:.32,study:.38,living:.55,dock:.42,bed:.42,loft:.6};
/* окно на задней стене: доля середины, ширина; гараж — ворота, витрина — окно с краю */
const HOME3_WIN={corner:[.52,1.2],hall:[.62,1.0],garage:[.5,0],case:[.84,.9],shop:[.32,1.5],study:[.34,1.3],living:[.3,1.2],dock:[.42,2.2],bed:[.72,1.0],loft:[.46,1.6]};

/* 2D x дома (единицы 29c) → метры полосы: комната i — [5i, 5i+5] */
function home3X(x){const R=hinGroundRooms();if(!R.length)return 0;
  let r=R[R.length-1];for(const v of R)if(x<v.x+v.w){r=v;break;}
  return r.i*HOME3_RW+clamp((x-r.x)/r.w,0,1)*HOME3_RW;}
function home3Up(){return !!(G.hin&&G.hin.up);}
/* зерно хозяина: от дома, не из сохранения (сохранение не трогаем) — один и тот же человек, пока дом стоит */
/* хозяин — лицо игрока: из палитры генератора только тёплая человеческая кожа (R>G); сизую и серо-зелёную шагом зерна пропускаем */
function home3PilotM(){const H=G.home||{};let s=hashi((H.sx|0)+7,(H.sy|0)+3,0x9170)>>>0;
  for(let i=0;i<12;i++){const k=cpGene({seed:s,loy:72,traits:[]}).skin;if(k&&k[0]>k[1])break;s=(Math.imul(s,1103515245)+12345)>>>0;}
  return {seed:s,loy:72,traits:[]};}
/* дома — домашняя куртка среднего тона (DESIGN-rooms §4): чёрный лётный костюм ночью у лампы читался вырезкой */
const HOME3_JAC=[112,98,78];
function home3Str(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0;}
function home3FolkM(f){const base={vega:0x7E6A11,mate:0x3A7E21,trainee:0x51A9C3}[f.who];
  return {seed:base!=null?base:home3Str("crew|"+(f.name||"")),loy:f.who==="vega"?84:66,traits:[]};}

/* ── сетка дома ── */
function home3Mesh(up){
  const K=r3Kit(),P=R3P,R=hinGroundRooms(),U=up?hinUpRooms():[],B=HOME3_B,F=HOME3_F,H=HOME3_H,RW=HOME3_RW;
  const X1=R.length*RW,A={};HOME3.anch=A;
  const Mwd=K.mt([96,68,46],.3,7,P.wood),Mbm=K.mt([66,50,38],.25,6,P.wood),Mfr=K.mt([84,62,44],.35,8,P.wood);
  const Mfl=K.mt([124,90,60],.03,3,P.wood),Mcc=K.mt([104,102,98],.2,5,P.floor),Mst=K.mt([70,74,80],.55,10,P.brushed);
  const Mdk=K.mt([34,30,28],.3,5,0),Mslab=K.mt([44,40,36],.2,4,P.floor);
  K.part=0;
  /* дом снаружи — тело со стенда: ноги, полозья, плита с поясом, крыльцо; двор — кочки кулисы, забор, мачта, фонарь (29rba) */
  home3Under(K,X1);home3Yard(K,X1,hashi((G.home&&G.home.sx)|0,(G.home&&G.home.sy)|0,0x77));
  /* двор за домом: над стенами и по бокам — тот же вид, что в окнах (небо планеты, поле, мачта), а не чернота */
  K.quad([-40,HOME3_GY-.02,B-8],[X1+40,HOME3_GY-.02,B-8],[X1+40,30,B-8],[-40,30,B-8],K.mt([3,3,3],.2,70,P.window,0,true),[0,0,1]);
  /* полоса стены с дырами, обрезанными по полосе (иначе соседние квады встают в одну плоскость) */
  const band=(x0,x1,y0,y1,z,holes,M)=>hallWall(K,x0,x1,y0,y1,z,holes.filter(h=>h[2]<y1&&h[3]>y0).map(h=>[h[0],h[1],Math.max(h[2],y0),Math.min(h[3],y1)]),M);
  /* окно узора window: проём, рама, подоконник, переплёт */
  const win=(x0,x1,y0,y1,z,n)=>{const fw=.014;
    K.quad([x0,y0,z+.01],[x1,y0,z+.01],[x1,y1,z+.01],[x0,y1,z+.01],K.mt([3,3,3],.2,70,P.window,0,true),[0,0,1]);
    K.box([(x0+x1)/2,y0-.03,z+.1],[(x1-x0)/2+.08,.03,.11],Mfr,.01);
    K.box([(x0+x1)/2,y1+.04,z+.05],[(x1-x0)/2+.06,.04,.06],Mfr,.008);
    for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n;K.box([x,(y0+y1)/2,z+.05],[fw*(i%n?1:2.2),(y1-y0)/2,.05],Mfr,.004);}
    K.box([(x0+x1)/2,y0+(y1-y0)*.58,z+.04],[(x1-x0)/2,fw*.8,.04],Mfr,.003);};
  /* перегородка в плоскости x с дверным проёмом под линией хода (z −.45….85) */
  const part=(x,y0,M,hh)=>{const h=hh||H;
    K.box([x,y0+h/2,(B-.45)/2],[.07,h/2,(-.45-B)/2],M,.01);
    K.box([x,y0+h/2,(.85+F)/2],[.07,h/2,(F-.85)/2],M,.01);
    if(h>2.15)K.box([x,y0+(2.1+h)/2,.2],[.07,(h-2.1)/2,.65],M,.01);
    for(const z of [-.45,.85])K.box([x,y0+1.05,z],[.09,1.05,.04],Mfr,.01);
    K.box([x,y0+2.13,.2],[.09,.04,.69],Mfr,.01);};
  /* торцевая стена с дверью: s=+1 — левый торец (смотрит в +x), −1 — правый; закрытая дверь — полотно с доской */
  const endWall=(x,s,y0,M,door,hh)=>{const h=hh||H,o=x-s*.1;home3Skin(K,x,s,y0,h,door);
    if(!door){K.box([o,y0+h/2,(B+F)/2],[.1,h/2,(F-B)/2],M,.01);return;}
    K.box([o,y0+h/2,(B-.3)/2],[.1,h/2,(-.3-B)/2],M,.01);
    K.box([o,y0+h/2,(.8+F)/2],[.1,h/2,(F-.8)/2],M,.01);
    K.box([o,y0+(2.1+h)/2,.25],[.1,(h-2.1)/2,.55],M,.01);
    for(const z of [-.3,.8])K.box([x,y0+1.05,z],[.03,1.07,.05],Mfr,.01);
    K.box([x,y0+2.14,.25],[.03,.05,.6],Mfr,.01);
    const Md=K.mt(door==="out"?[98,74,52]:[70,62,56],.3,7,P.wood);
    K.box([o,y0+1.05,.25],[.04,1.05,.52],Md,.012);
    for(let k=0;k<4;k++)K.box([o+s*.045,y0+.25+k*.52,.25],[.006,.012,.48],Mdk,0);
    K.ell([o+s*.06,y0+1.0,.25+.38],[.025,.025,.025],K.mt([180,160,120],.8,13,P.brushed),5,8);
    if(door==="shut"){K.box([o+s*.05,y0+1.25,.25],[.012,.05,.46],K.mt([120,100,80],.3,6,P.wood),.004);
      K.box([o+s*.065,y0+1.25,.25],[.004,.06,.06],Mst,.002);}};
  /* балки разреза: потолка нет, балки остались — лампа висит на средней */
  const joists=(x0,lx,y0)=>{for(const x of [x0+.7,lx,x0+RW-.7])K.box([x,y0+H-.09,(B+F)/2],[.06,.09,(F-B)/2],Mbm,.01);
    K.box([x0+RW/2,y0+H-.03,B+.08],[RW/2,.05,.08],Mbm,.008);};
  const at=(r,f)=>r.i*RW+f*RW;
  /* ── первый этаж ── */
  R.forEach((r,ri)=>{const x0=ri*RW,x1=x0+RW,k=r.key,tone=HOME3_TONE[k]||[150,136,116];
    const Mw=K.mt(tone,.12,4,0),Mw2=K.mt(mixc(tone,[60,44,32],.55),.3,7,P.wood);
    const hard=k==="garage"||k==="shop"||k==="dock";
    K.quad([x0,0,B],[x1,0,B],[x1,0,F],[x0,0,F],hard?Mcc:Mfl,[0,1,0]);
    const W=HOME3_WIN[k]||[.5,1.2],wx=x0+W[0]*RW,holes=[];
    if(k==="garage")holes.push([x0+1.1,x0+3.9,0,2.3]);else holes.push([wx-W[1]/2,wx+W[1]/2,1.05,2.15]);
    band(x0,x1,0,.95,B,holes,Mw2);band(x0,x1,.95,H,B,holes,Mw);
    K.box([(x0+x1)/2,.95,B+.02],[RW/2,.02,.025],Mfr,.006);
    K.box([(x0+x1)/2,.05,B+.015],[RW/2,.05,.015],Mfr,.006);
    if(k==="garage"){   /* ворота: ламели, ряд стёкол поверху — тот же двор */
      K.quad([x0+1.1,1.85,B+.012],[x0+3.9,1.85,B+.012],[x0+3.9,2.15,B+.012],[x0+1.1,2.15,B+.012],K.mt([3,3,3],.2,70,P.window,0,true),[0,0,1]);
      for(let j=0;j<8;j++)K.box([x0+2.5,.12+j*.22,B+.04],[1.4,.1,.03],K.mt([150,146,136],.4,8,P.brushed),.02);
      for(let j=0;j<4;j++)K.box([x0+1.1+.35+j*.7,2.0,B+.04],[.03,.15,.03],Mst,.005);
      K.box([x0+2.5,2.3,B+.08],[1.5,.06,.08],Mfr,.01);for(const sx of [-1,1])K.box([x0+2.5+sx*1.45,1.15,B+.06],[.05,1.15,.06],Mfr,.01);}
    else win(wx-W[1]/2,wx+W[1]/2,1.05,2.15,B,2);
    const lx=x0+(HOME3_LAMP[k]||.5)*RW;joists(x0,lx,0);
    hallShade(K,lx,H-.72,-.9,[255,206,150],H-.18);
    if(ri<R.length-1)part(x1,0,Mw);
    home3Stuff(K,k,x0,0,A,r);});
  endWall(0,1,0,K.mt(HOME3_TONE[R[0].key],.12,4,0),"out");
  endWall(X1,-1,0,K.mt(HOME3_TONE[R[R.length-1].key],.12,4,0),R.length<HOME_TIERS.length?"shut":null);
  A.out=[.12,2.0,.25];if(R.length<HOME_TIERS.length)A.shut=[X1-.14,2.0,.25];
  /* свод над первым этажом — там, где над ним нет второго; торцы — сечение арки */
  {const ux=U.length?(()=>{const b=hinGroundRooms(),xs=U.map(u=>{const g=b.find(q=>q.x===u.x);return g?g.i*RW:0;});return [Math.min(...xs),Math.max(...xs)+RW];})():null;
    if(!ux)home3Vault(K,-.2,X1+.2,H,[[0,1],[X1,-1]]);
    else{if(ux[0]>0)home3Vault(K,-.2,ux[0],H,[[0,1]]);if(ux[1]<X1)home3Vault(K,ux[1],X1+.2,H,[[X1,-1]]);}}
  /* ── второй этаж: светёлка над кабинетом, спальня над жилой частью; крыша — стропилами ── */
  if(U.length){const y0=HOME3_UP,base=hinGroundRooms(),xs=U.map(u=>{const b=base.find(g=>g.x===u.x);return b?b.i*RW:0;});
    const ux0=Math.min(...xs),ux1=Math.max(...xs)+RW;
    K.box([(ux0+ux1)/2,y0-.13,(B+F)/2],[(ux1-ux0)/2+.1,.13,(F-B)/2+.02],Mslab,.01);
    U.forEach((u,j)=>{const x0=xs[j],x1=x0+RW,k=u.key,tone=HOME3_TONE[k];
      const Mw=K.mt(tone,.12,4,0),kh=2.0;
      /* пол: в спальне — проём над маршем (.8–.98 ширины, у задней стены) */
      if(k==="bed"){const hx0=x0+.78*RW,hx1=x0+.98*RW,hz=B+.95;
        K.quad([x0,y0,B],[hx0,y0,B],[hx0,y0,F],[x0,y0,F],Mfl,[0,1,0]);
        K.quad([hx0,y0,hz],[hx1,y0,hz],[hx1,y0,F],[hx0,y0,F],Mfl,[0,1,0]);
        K.quad([hx1,y0,B],[x1,y0,B],[x1,y0,F],[hx1,y0,F],Mfl,[0,1,0]);
        const Mr=K.mt([80,60,42],.4,8,P.wood);
        K.tube([[hx0,y0+.95,hz],[hx1,y0+.95,hz]],.025,Mr,6);K.tube([[hx0,y0+.95,B+.05],[hx0,y0+.95,hz]],.025,Mr,6);
        for(const p of [[hx0,hz],[hx1,hz],[hx0,B+.08]])K.tube([[p[0],y0,p[1]],[p[0],y0+.95,p[1]]],.022,Mr,6);}
      else K.quad([x0,y0,B],[x1,y0,B],[x1,y0,F],[x0,y0,F],Mfl,[0,1,0]);
      const W=HOME3_WIN[k],wx=x0+W[0]*RW,holes=[[wx-W[1]/2,wx+W[1]/2,y0+.7,y0+1.72]];
      band(x0,x1,y0,y0+kh,B,holes,Mw);win(wx-W[1]/2,wx+W[1]/2,y0+.7,y0+1.72,B,2);
      K.box([(x0+x1)/2,y0+.05,B+.015],[RW/2,.05,.015],Mfr,.006);
      if(j<U.length-1)part(x1,y0,Mw,kh);
      home3Stuff(K,k,x0,y0,A,u);});
    home3Vault(K,ux0-.2,ux1+.2,y0+2.0,[[ux0,1],[ux1,-1]]);
    endWall(ux0,1,y0,K.mt(HOME3_TONE[U[0].key],.12,4,0),null,2.0);
    endWall(ux1,-1,y0,K.mt(HOME3_TONE[U[U.length-1].key],.12,4,0),null,2.0);}
  return K.pack();
}
/* вещи комнаты: места — доли HIN_THINGS (29c), высота и глубина — здесь; A — точки табличек «рассмотреть» */
function home3Stuff(K,k,x0,y0,A,r){
  const P=R3P,B=HOME3_B,H=HOME3_H,at=f=>x0+f*HOME3_RW,y=v=>y0+v;
  const wood=c=>K.mt(c,.3,7,P.wood),cloth=c=>K.mt(c,.12,4,P.cloth),Mst=K.mt([70,74,80],.55,10,P.brushed);
  const mark=(i,p)=>{const T=(HIN_THINGS[k]||[])[i];if(T)A[k+"|"+T.ru]=p;};
  if(k==="corner"){
    const x=at(.3);K.box([x,y(.1),B+.6],[.95,.1,.48],cloth([128,118,100]),.04);
    K.box([x+.2,y(.22),B+.62],[.62,.035,.47],cloth([96,74,64]),.03);
    K.ell([x-.68,y(.27),B+.6],[.24,.07,.17],cloth([206,196,176]),5,10);
    K.quad([x-1.1,y(.004),B+1.15],[x+1.1,y(.004),B+1.15],[x+1.1,y(.004),B+2.0],[x-1.1,y(.004),B+2.0],cloth([112,72,58]),[0,1,0]);
    mark(0,[x,y(.6),B+.6]);
    const c=at(.72);K.box([c,y(.22),B+.42],[.28,.22,.24],wood([128,96,62]),.015);
    K.box([c,y(.22),B+.66],[.24,.004,.18],wood([98,72,48]),0);
    K.push([c+.06,y(.44),B+.42]);K.lathe([[0,.036],[.1,.042],[.105,.037]],14,K.mt([212,104,64],.5,10,0));K.lathe([[.09,.03],[.092,0]],14,K.mt([60,40,30],.6,12,0));K.pop();
    K.tube([[c+.105,y(.52),B+.42],[c+.135,y(.5),B+.42],[c+.13,y(.47),B+.42],[c+.104,y(.46),B+.42]],.008,K.mt([212,104,64],.5,10,0),5);
    mark(1,[c,y(.75),B+.42]);}
  else if(k==="hall"){
    const x=at(.35);K.box([x,y(1.68),B+.05],[.6,.035,.03],wood([110,80,54]),.008);
    for(let j=0;j<4;j++)K.box([x-.45+j*.3,y(1.64),B+.1],[.012,.012,.05],Mst,.003);
    K.box([x-.45,y(1.32),B+.14],[.21,.3,.07],cloth([74,86,102]),.06);
    K.box([x-.45,y(1.6),B+.13],[.08,.05,.05],cloth([70,80,96]),.02);
    K.tube([[x-.15,y(1.64),B+.12],[x-.13,y(1.35),B+.15],[x-.1,y(1.02),B+.16]],.032,cloth([184,50,58]),6);
    K.tube([[x-.12,y(1.64),B+.12],[x-.06,y(1.4),B+.16],[x-.04,y(1.18),B+.17]],.028,cloth([184,50,58]),6);
    K.box([x+.3,y(1.98),B+.17],[.5,.02,.16],wood([110,80,54]),.006);
    K.ell([x+.3,y(2.16),B+.2],[.16,.16,.16],K.mt([206,206,198],.6,12,0),8,12);
    K.ell([x+.3,y(2.17),B+.33],[.11,.08,.05],K.mt([30,34,40],.9,14,P.glass),6,10);
    K.box([x,y(.45),B+.3],[.6,.03,.2],wood([110,80,54]),.01);for(const s of [-1,1])K.box([x+s*.52,y(.22),B+.3],[.03,.22,.17],wood([90,66,44]),.006);
    mark(0,[x-.3,y(1.75),B+.15]);
    const b=at(.75);K.quad([b-.45,y(.004),B+.25],[b+.45,y(.004),B+.25],[b+.45,y(.004),B+.95],[b-.45,y(.004),B+.95],cloth([86,80,62]),[0,1,0]);
    [[-.28,[72,56,42]],[-.12,[72,56,42]],[.12,[96,74,50]],[.28,[96,74,50]]].forEach(([dx,c],j)=>{const bx=b+dx;
      K.box([bx,y(.11),B+.6+(j%2)*.06],[.055,.11,.07],K.mt(c,.35,8,P.leather),.03);K.box([bx,y(.05),B+.68+(j%2)*.06],[.055,.05,.13],K.mt(c,.35,8,P.leather),.03);
      K.box([bx,y(.02),B+.66+(j%2)*.06],[.058,.02,.14],K.mt(mixc(c,[120,96,60],.5),.1,3,0),.01);});
    mark(1,[b,y(.4),B+.6]);}
  else if(k==="garage"){
    const x=at(.3),Mc=K.mt([92,104,96],.12,4,P.cloth);
    for(const s of [-1,1])K.box([x+s*.8,y(.12),B+1.2],[.12,.12,.4],wood([110,84,58]),.01);
    K.ell([x,y(.72),B+1.2],[1.35,.5,.78],Mc,10,18);
    K.ell([x+.25,y(1.08),B+1.12],[.55,.3,.45],Mc,8,14);
    K.ell([x-1.2,y(.62),B+1.2],[.25,.3,.5],Mc,6,10);
    K.tube([[x-1.1,y(.5),B+.45],[x,y(.42),B+.44],[x+1.1,y(.5),B+.45]],.012,K.mt([150,120,70],.2,4,0),5);
    mark(0,[x,y(1.45),B+1.2]);
    const s=at(.78),Mu=K.mt([150,92,48],.45,9,P.brushed);
    for(const dx of [-.62,.62])for(const dz of [.1,.6])K.box([s+dx,y(1.0),B+dz],[.025,1.0,.025],Mu,.004);
    for(const h of [.3,.8,1.3,1.8])K.box([s,y(h),B+.35],[.64,.015,.27],Mst,.004);
    const R0=rng(hashi(7,3,0x6A2));
    for(const h of [.3,.8,1.3,1.8]){let px=s-.55;while(px<s+.5){const w=.08+R0()*.14,hh=.06+R0()*.18;
      if(R0()<.55)K.box([px+w,y(h+.015+hh),B+.32],[w*.92,hh,.17],K.mt(mixc([96,84,64],[[120,60,40],[70,90,110],[150,140,110]][Math.floor(R0()*3)],R0()*.6),.2,5,0),.01);
      else{K.push([px+w,y(h+.015),B+.3]);K.lathe([[0,w*.7],[hh*1.6,w*.7],[hh*1.6+.01,w*.5]],10,K.mt([140,142,146],.7,12,P.brushed));K.pop();}
      px+=w*2+.03;}}
    mark(1,[s,y(2.1),B+.35]);}
  else if(k==="case"){
    const x=at(.5),Mg=K.mt([60,70,76],.95,15,P.glass,0,true),Mk=wood([62,44,32]);
    K.box([x,y(.4),B+.4],[.85,.4,.32],Mk,.02);K.box([x,y(1.98),B+.4],[.87,.05,.34],Mk,.015);
    K.box([x,y(1.92),B+.5],[.75,.01,.04],K.mt([255,214,160],.2,4,0,1.6,true),0);
    for(const s of [-1,1])K.box([x+s*.84,y(1.37),B+.4],[.025,.57,.31],Mk,.006);
    for(const s of [-1,0,1])K.box([x+s*.81,y(1.37),B+.71],[.012,.56,.012],Mk,.003);
    K.box([x,y(.82),B+.71],[.82,.012,.012],Mk,.003);
    K.tube([[x-.7,y(1.85),B+.715],[x-.35,y(1.0),B+.715]],.004,K.mt([220,230,240],.9,15,P.glass,.25,true),3);
    K.box([x,y(1.36),B+.4],[.8,.008,.28],K.mt([90,96,100],.9,14,P.glass,0,true),0);
    K.box([x,y(.82),B+.4],[.8,.02,.28],K.mt([120,30,36],.1,3,P.cloth),0);
    const R0=rng(hashi(11,5,0xCA5E));
    for(let j=0;j<5;j++){const ox=x-.6+j*.3,sh=j%2?1.38:.84;
      if(j===0){K.push([ox,y(sh),B+.4]);K.lathe([[0,.06],[.04,.03],[.14,.025],[.2,.07],[.24,.06]],14,K.mt([214,170,80],.9,14,P.brushed));K.pop();}
      else if(j===1){K.ell([ox,y(sh+.09),B+.4],[.07,.09,.07],K.mt([60,140,170],.6,12,P.glass,.25),8,12);}
      else if(j===2){K.box([ox,y(sh+.06),B+.38],[.12,.04,.05],K.mt([100,104,110],.7,12,P.brushed),.01);K.tube([[ox-.12,y(sh+.06),B+.38],[ox-.2,y(sh+.07),B+.38]],.012,Mst,6);}
      else if(j===3){K.box([ox,y(sh+.09),B+.4],[.08,.09,.025],K.mt([140,52,40],.3,6,P.leather),.01);}
      else{K.ell([ox,y(sh+.06),B+.4],[.05+R0()*.03,.06,.05],K.mt([170,160,150],.3,6,0),6,8);}}
    mark(0,[x,y(2.15),B+.4]);}
  else if(k==="shop"){
    const x=at(.32),Mt=wood([132,96,62]);
    K.box([x,y(.88),B+.42],[.95,.045,.34],Mt,.012);
    for(const dx of [-.88,.88])for(const dz of [.14,.7])K.box([x+dx,y(.43),B+dz],[.035,.43,.035],Mst,.006);
    K.box([x,y(.18),B+.42],[.9,.015,.3],Mt,.004);
    K.box([x+.7,y(.98),B+.6],[.1,.06,.08],K.mt([60,84,110],.5,9,P.brushed),.01);K.box([x+.7,y(1.05),B+.6],[.12,.02,.03],Mst,.005);
    K.box([x-.2,y(.98),B+.42],[.18,.05,.12],K.mt([110,116,120],.7,12,P.brushed),.01);
    K.tube([[x-.5,y(.94),B+.5],[x-.32,y(.94),B+.62]],.012,K.mt([200,90,50],.4,8,0),6);
    K.tube([[x+.2,y(.94),B+.3],[x+.45,y(.94),B+.36]],.008,Mst,5);
    mark(0,[x,y(1.1),B+.42]);
    const m=at(.74),Mm=K.mt([96,104,108],.6,11,P.brushed);
    K.box([m,y(.42),B+.55],[.72,.42,.3],Mm,.02);K.box([m,y(.92),B+.55],[.72,.06,.14],Mst,.01);
    K.box([m-.55,y(1.13),B+.55],[.17,.17,.17],Mm,.02);
    K.push([m-.36,y(1.13),B+.55],0,0,Math.PI/2);K.lathe([[-.02,.09],[.06,.09],[.07,.05],[.12,.03]],14,Mst);K.pop();
    K.box([m+.5,y(1.06),B+.55],[.1,.09,.1],Mm,.015);
    K.ell([m+.5,y(1.12),B+.55],[.2,.14,.16],K.mt([124,110,88],.12,4,P.cloth),8,12);
    mark(1,[m,y(1.4),B+.55]);}
  else if(k==="study"){
    const x=at(.34),Mt=wood([82,54,38]);
    K.box([x,y(.76),B+.45],[.78,.03,.38],Mt,.01);K.box([x-.56,y(.37),B+.45],[.22,.37,.35],Mt,.012);
    for(let j=0;j<3;j++)K.box([x-.56,y(.18+j*.22),B+.81],[.18,.08,.01],wood([96,64,44]),.006);
    for(const dz of [.12,.78])K.box([x+.72,y(.37),B+dz],[.03,.37,.03],Mt,.006);
    [[-.2,.1,.08],[.08,-.06,-.12],[.3,.12,.3]].forEach(([dx,dz,a])=>{K.push([x+dx,y(.795),B+.45+dz],a);K.box([0,0,0],[.15,.003,.21],K.mt([218,210,190],.1,3,P.cloth),0);K.pop();});
    K.push([x+.55,y(.79),B+.3]);K.lathe([[0,.07],[.02,.065],[.03,.015]],12,K.mt([40,60,48],.6,11,P.brushed));
    K.tube([[0,.03,0],[0,.35,.04],[.0,.42,.14]],.01,K.mt([40,60,48],.6,11,P.brushed),5);
    K.push([0,.4,.16],0,.6);K.lathe([[-.01,.02],[.04,.07],[.08,.1]],14,K.mt([40,96,64],.5,10,0));K.lathe([[.0,.015],[.075,.09]],14,K.mt([255,226,170],.2,4,0,1.4,true));K.pop();K.pop();
    K.push([x+.1,0,B+1.2],Math.PI);
    K.box([0,y(.45),0],[.22,.025,.22],Mt,.01);for(const sx of [-.18,.18])for(const sz of [-.18,.18])K.box([sx,y(.22),sz],[.022,.22,.022],Mt,.004);
    K.box([0,y(.75),.2],[.22,.28,.02],Mt,.006);K.pop();
    mark(0,[x,y(1.0),B+.45]);
    const m=at(.76);K.box([m,y(1.55),B+.03],[.78,.52,.012],K.mt([196,176,134],.1,4,P.cloth),.004);
    K.box([m,y(1.55),B+.02],[.82,.56,.008],wood([70,50,36]),.003);
    const R0=rng(hashi(5,9,0x3A9)),pins=[];
    for(let j=0;j<9;j++){const p=[m-.65+R0()*1.3,y(1.13+R0()*.84),B+.05];pins.push(p);K.ell(p,[.014,.014,.014],K.mt(j%3?[200,60,50]:[230,190,90],.4,8,0,.5),4,6);}
    for(let j=0;j<5;j++){const a=pins[j],b=pins[(j*3+2)%9];K.tube([[a[0],a[1],a[2]-.005],[b[0],b[1],b[2]-.005]],.0025,K.mt([170,40,40],.2,4,0),3);}
    mark(1,[m,y(2.12),B+.05]);}
  else if(k==="living"){
    const x=at(.3),Mt=wood([110,76,50]);
    K.box([x,y(.2),B+1.05],[.52,.1,1.02],Mt,.02);K.box([x,y(.52),B+.06],[.55,.5,.04],Mt,.02);
    for(const sx of [-.48,.48])for(const z of [.12,2.0])K.box([x+sx,y(.1),B+z],[.04,.1,.04],Mt,.006);
    K.box([x,y(.37),B+1.04],[.48,.08,.97],cloth([214,206,190]),.05);
    K.box([x,y(.47),B+1.34],[.5,.04,.66],cloth([164,74,56]),.04);
    K.box([x,y(.43),B+1.98],[.5,.05,.06],cloth([150,66,50]),.03);
    K.ell([x,y(.5),B+.32],[.36,.08,.16],cloth([226,220,206]),6,12);
    mark(0,[x,y(.9),B+1.05]);
    const t=at(.66),tz=B+1.75;
    K.push([t,0,tz]);K.lathe([[y(0),.28],[y(.04),.25],[y(.06),.05],[y(.7),.05],[y(.72),.5],[y(.76),.52],[y(.77),0]],22,Mt);K.pop();
    [[-.75,.0,Math.PI/2],[.72,.15,-Math.PI/2]].forEach(([dx,dz,a])=>{K.push([t+dx,0,tz+dz],a);
      K.box([0,y(.45),0],[.2,.025,.2],Mt,.01);for(const sx of [-.16,.16])for(const sz of [-.16,.16])K.box([sx,y(.22),sz],[.02,.22,.02],Mt,.004);
      K.box([0,y(.74),-.18],[.2,.27,.02],Mt,.006);K.pop();});
    K.push([t-.1,y(.77),tz]);K.lathe([[0,.06],[.06,.09],[.13,.08],[.16,.03],[.17,.0]],14,K.mt([196,92,56],.5,10,0));K.pop();
    K.tube([[t-.01,y(.85),tz],[t+.06,y(.92),tz]],.012,K.mt([196,92,56],.5,10,0),5);
    for(const [dx,dz] of [[.22,.1],[-.25,-.18]]){K.push([t+dx,y(.77),tz+dz]);K.lathe([[0,.03],[.06,.035],[.065,.032]],10,K.mt([226,218,200],.5,10,0));K.pop();}
    mark(1,[t,y(1.0),tz]);
    /* лестница наверх (hinStairX — .88 ширины): марш вдоль задней стены, вверх вправо, до перекрытия */
    if(hinHasUp()){const s0=at(.6),s1=at(.98),n=13,rise=(HOME3_UP)/n,run=(s1-s0)/n,zc=B+.47,Mtr=wood([118,86,58]);
      for(let j=0;j<n;j++)K.box([s0+run*(j+.5),y(rise*(j+1)-.025),zc],[run/2+.03,.025,.42],Mtr,.006);
      const L=Math.hypot(s1-s0,HOME3_UP),ang=Math.atan2(HOME3_UP,s1-s0);
      for(const z of [B+.04,B+.9]){K.push([(s0+s1)/2,y(HOME3_UP/2-.08),z],0,0,ang);K.box([0,0,0],[L/2,.14,.035],wood([90,64,44]),.01);K.pop();}
      K.tube([[s0+.1,y(.95),B+.92],[s1-.05,y(HOME3_UP+.9),B+.92]],.025,K.mt([80,60,42],.4,8,P.wood),6);
      K.tube([[s0+.1,0,B+.92],[s0+.1,y(.95),B+.92]],.025,K.mt([80,60,42],.4,8,P.wood),6);
      A.stair=[at(.88),y(1.9),B+.5];}}
  else if(k==="dock"){
    const x=at(.4),Mc=K.mt([60,66,74],.55,10,P.brushed);
    K.box([x,y(.45),B+.45],[.6,.45,.3],Mc,.02);
    K.push([x,y(.95),B+.6],0,-.42);K.box([0,0,0],[.56,.02,.22],K.mt([40,44,50],.5,9,P.brushed),.008);
    K.quad([-.42,.022,-.15],[.42,.022,-.15],[.42,.022,.12],[-.42,.022,.12],K.mt([40,80,90],.2,40,P.screen,.6,true),[0,1,0]);K.pop();
    K.push([x+.45,y(.9)+.02,B+.35]);K.lathe([[0,.06],[.1,.05],[.11,.04]],10,Mc);K.ell([0,.2,0],[.06,.09,.06],K.mt([255,70,50],.3,6,0,1.6,true),6,10);K.pop();
    for(let j=0;j<6;j++)K.box([x-.4+j*.13,y(.94),B+.78],[.03,.008,.03],K.mt(j%2?[255,170,90]:[120,200,180],.3,6,0,.7,true),.003);
    mark(0,[x,y(1.25),B+.5]);
    const c=at(.8),Mh=K.mt([206,168,58],.4,8,P.hazard);
    K.quad([c-.9,y(.004),B+1.3],[c+.9,y(.004),B+1.3],[c+.9,y(.004),B+1.42],[c-.9,y(.004),B+1.42],K.mt([200,170,60],.2,5,0),[0,1,0]);
    for(const s of [-1,1]){K.box([c+s*.55,y(1.2),B+.2],[.14,.4,.2],Mst,.02);
      K.push([c+s*.55,y(1.2),B+.4],0,.5);K.box([0,0,.35],[.1,.1,.38],Mh,.02);K.pop();
      K.push([c+s*.55,y(1.0),B+1.0]);K.box([-s*.06,0,0],[.06,.16,.12],Mh,.015);K.pop();}
    mark(1,[c,y(1.75),B+.4]);}
  else if(k==="bed"){
    const x=at(.3),Mt=wood([104,74,52]);
    K.box([x,y(.18),B+1.05],[.8,.12,1.0],Mt,.02);K.box([x,y(.5),B+.05],[.82,.45,.04],Mt,.02);
    K.box([x,y(.36),B+1.04],[.76,.07,.96],cloth([220,214,200]),.05);
    K.box([x,y(.45),B+1.3],[.78,.045,.7],cloth([108,118,150]),.04);
    for(const sx of [-.36,.36])K.ell([x+sx,y(.48),B+.3],[.3,.08,.15],cloth([232,226,212]),6,12);
    mark(0,[x,y(.9),B+1.05]);
    const l=at(.52);K.box([l,y(.28),B+.3],[.2,.28,.2],Mt,.012);
    K.push([l,y(.56),B+.3]);K.lathe([[0,.06],[.02,.05],[.03,.012],[.22,.012]],10,K.mt([180,160,120],.7,12,P.brushed));
    K.lathe([[.2,.12],[.34,.07],[.35,0]],14,K.mt([236,214,170],.2,4,P.cloth,.9));K.pop();
    mark(1,[l,y(1.05),B+.3]);mark(2,[at(.72),y(1.9),B+.1]);
    const c=at(.86);K.push([c,0,B+1.2],-.5);
    K.box([0,y(.45),0],[.2,.025,.2],Mt,.01);for(const sx of [-.16,.16])for(const sz of [-.16,.16])K.box([sx,y(.22),sz],[.02,.22,.02],Mt,.004);
    K.box([0,y(.74),-.18],[.2,.27,.02],Mt,.006);K.box([0,y(.82),-.15],[.23,.24,.06],cloth([88,72,58]),.05);K.pop();
    mark(3,[c,y(1.25),B+1.2]);}
  else if(k==="loft"){
    const w=at(.46),Mt=wood([120,92,62]);
    K.box([w,y(.42),B+.3],[.8,.06,.3],Mt,.012);K.box([w,y(.2),B+.3],[.78,.2,.28],wood([100,76,52]),.012);
    K.box([w-.2,y(.52),B+.3],[.5,.05,.25],cloth([150,120,80]),.04);
    mark(0,[w,y(1.0),B+.3]);
    const p=at(.58);[[-.2,.0,.13],[.05,.1,.1],[.26,-.04,.16]].forEach(([dx,dz,r])=>{K.push([p+dx,y(0),B+.85+dz]);
      K.lathe([[0,r*.7],[r*1.6,r],[r*1.7,r*1.05]],12,K.mt([176,98,64],.3,6,0));K.pop();
      K.ell([p+dx,y(r*1.7+r*.6),B+.85+dz],[r*1.1,r*.9,r*1.1],K.mt([70,120,64],.2,4,P.plant),6,10);});
    mark(1,[p,y(.85),B+.9]);
    const t=at(.78);K.box([t,y(.42),B+1.0],[.45,.03,.3],Mt,.01);for(const sx of [-.4,.4])for(const sz of [-.25,.25])K.box([t+sx,y(.2),B+1.0+sz],[.025,.2,.025],Mt,.004);
    K.push([t+.15,y(.45),B+.95]);K.lathe([[0,.035],[.09,.04],[.095,.036]],12,K.mt([212,104,64],.5,10,0));K.pop();
    [[[150,60,52],.0],[[60,84,110],.05],[[180,160,110],.09]].forEach(([c,h])=>K.box([t-.2,y(.47+h),B+1.0],[.13,.022,.09],K.mt(c,.2,5,P.leather),.008));
    mark(2,[t,y(.9),B+1.0]);}
}
/* табурет под сидящих жильцов: свой экземпляр под человеком */
function home3StoolMesh(){if(HOME3.stool)return HOME3.stool;const K=r3Kit(),Mt=K.mt([110,80,54],.3,7,R3P.wood);
  K.push([0,0,0]);K.lathe([[.74,0],[.74,.19],[.78,.19],[.79,0]],16,Mt);K.pop();
  for(let a=0;a<3;a++){const t=a/3*TAU+.5;K.tube([[Math.cos(t)*.16,0,Math.sin(t)*.16],[Math.cos(t)*.12,.74,Math.sin(t)*.12]],.02,Mt,5);}
  HOME3.stool=K.pack();return HOME3.stool;}

/* ── люди: поза по делу 29c — сидит (табурет), работает, стоит, идёт (кадры шага по фазе) ── */
function home3Pose(kind,walk){if(kind==="walk")return "walk"+(Math.floor(((walk||0)*4)%4+4)%4);
  return kind==="sit"?"stool0":kind==="work"?"bar":"stand";}
function home3Man(M,OT,ii,m,mesh,x,y0,z,yaw,t,look,dim,mark){
  const ph=(m.seed%1000)*.0063,br=1+.006*Math.sin(t*1.6+ph),A=r3Xf([x,y0,z],yaw);
  const Bm=r3Mul(A,[1,0,0,0, 0,br,0,0, 0,0,1,0, 0,0,0,1]),at=mesh.at;
  let hy=.2*Math.sin(t*.19+ph*3)*Math.max(0,Math.sin(t*.08+ph));
  if(look){const a=Math.atan2(look[0]-x,look[2]-z)-yaw,w=Math.atan2(Math.sin(a),Math.cos(a));hy=clamp(w,-.5,.5)+.03*Math.sin(t*.23+ph);}
  M.set(Bm,(ii*R3_PART)*16);
  const Mh=r3Pivot(Bm,at.neck,hy,.04*Math.sin(t*.17+ph),0);M.set(Mh,(ii*R3_PART+1)*16);
  cpRig(M,ii*R3_PART,Mh,mesh,cpFace(m,null));
  for(let k=0;k<2;k++)M.set(Bm,(ii*R3_PART+2+k)*16);
  for(let p=0;p<R3_PART;p++)OT[(ii*R3_PART+p)*4+1]=dim||0;
  if(mark)OT.set([x,z,.3,mark],(ii*R3_PART+R3_PART-1)*4);
}
/* сцена: хозяин, жильцы его этажа, свет по комнатам */
function home3Scene(cam,t){
  const S0=G.hin,M=HOME3_M,OT=HOME3_OT,I=r3Xf([0,0,0]),up=home3Up(),y0=up?HOME3_UP:0,B=HOME3_B,H=HOME3_H,RW=HOME3_RW;
  for(let i=0;i<R3_MAXI*R3_PART;i++)M.set(I,i*16);OT.fill(0);
  const draws=[[HOME3.mesh,0,1]];let ii=1;
  const mx=home3X(S0.x),walking=!!(keys.left||keys.right),pm=Object.assign(home3PilotM(),{jac:HOME3_JAC});
  const lookP=S0.look?home3LookAt(S0.look):null;
  /* хозяин: идёт — профилем, чуть к объективу; стоит — на три четверти к объективу или к вещи */
  const yaw=walking?S0.face*1.3:(lookP?Math.atan2(lookP[0]-mx,lookP[2]-HOME3_MZ)*.6+Math.atan2(cam.eye[0]-mx,cam.eye[2]-HOME3_MZ)*.4:S0.face*.9);
  const mesh=cpMesh(pm,walking?home3Pose("walk",S0.walk):"stand",1);
  home3Man(M,OT,ii,pm,mesh,mx,y0,HOME3_MZ,yaw,t,lookP||cam.eye,0,1.1);draws.push([mesh,ii,1]);ii++;
  HOME3.man=[mx,y0,HOME3_MZ];
  for(const f of S0.folk||[]){if((f.up|0)!==(up?1:0)||ii>=R3_MAXI-1)continue;
    const m=home3FolkM(f),fx=home3X(f.x),fz=-.45-(f.z||0)*1.0,pose=home3Pose(f.pose,f.walk),fm=cpMesh(m,pose,1);
    const talk=S0.look&&S0.look.ru===f.name,near=Math.abs(fx-mx)<1.6;
    const fyaw=f.pose==="walk"?f.face*1.3:Math.atan2(mx-fx,HOME3_MZ-fz)*(near||talk?.85:.35)+(near||talk?0:f.face*.6);
    if(f.pose==="sit"){OT.fill(0,ii*R3_PART*4,(ii+1)*R3_PART*4);M.set(r3Xf([fx,y0,fz-.06],fyaw),ii*R3_PART*16);draws.push([home3StoolMesh(),ii,1]);ii++;}
    home3Man(M,OT,ii,m,fm,fx,y0,fz,fyaw,t,near||talk?[mx,y0+1.6,HOME3_MZ]:null,0,.9);draws.push([fm,ii,1]);f.ii=ii;ii++;}
  /* свет: ключ — лампа комнаты хозяина (тень); окно — солнце днём (вторая тень) или холод ночью; соседи — разлив */
  const nk=home3Night(),day=1-nk,warm=r3Lin([255,200,140]),lights=[],bulbs=[];
  const rooms=up?home3UpRooms():hinGroundRooms().map(r=>({key:r.key,x0:r.i*RW}));
  const cur=Math.max(0,rooms.findIndex(r=>mx>=r.x0&&mx<r.x0+RW));
  rooms.forEach((r,j)=>{const d=Math.abs(j-cur);if(d>2)return;const lx=r.x0+(HOME3_LAMP[r.key]||.5)*RW,key=d===0;
    const ly=r.key==="bed"?y0+.75:y0+H-.72,lz=r.key==="bed"?B+.3:-.9;
    lights.push({p:[lx,ly,lz],range:(key?6.5:4.5)*(1+.3*nk),c:r3Sc(warm,(key?6.2:d===1?1.2:.6)*(1+.8*nk)),spot:r.key==="bed"?0:1,d:[0,-1,-.15],
      cosO:Math.cos(1.02+.1*nk),cosI:Math.cos(.22),shadow:key?1:0,vol:key?.08:.03,key:key?1:0});
    if(d<=1)bulbs.push([lx,ly-.05,lz,key?.9:.4]);
    const W=HOME3_WIN[r.key]||[.5,1.2],wx=r.x0+W[0]*RW,wy=y0+(up?1.6:2.0);
    if(d===0)lights.push({p:[wx,wy,B+.15],range:9,c:r3Sc(r3Lin(mixc([255,226,180],[96,124,180],nk)),2.6*day+.5*nk),spot:1,
      d:day>.5?[-.3,-.85,.42]:[0,-.5,.86],cosO:Math.cos(.85),cosI:Math.cos(.15),shadow:day>.5?1:0,vol:0});
    else if(d===1)lights.push({p:[wx,wy-.2,B+.3],range:3.0,c:r3Sc(r3Lin(mixc([255,230,190],[90,116,170],nk)),.8*day+.12*nk),vol:0});});
  /* солнце двора днём, луна ночью: сверху-спереди-слева, без тени — двор и кулиса в свете мира (стенд: ключ — звезда) */
  if(!up)lights.splice(Math.min(lights.length,3),0,{p:[mx-7,14,HOME3_F+9],range:40,c:r3Sc(r3Lin(mixc([255,236,200],[120,132,190],nk)),300*day+120*nk),spot:1,
    d:K3n([5,-12.5,-9]),cosO:Math.cos(.7),cosI:Math.cos(.45),vol:0});
  if(HOME3.lantern&&!up)lights.splice(Math.min(lights.length,4),0,{p:HOME3.lantern,range:9,c:r3Sc(warm,.3*day+9*nk),vol:.06*nk});
  lights.push({p:[mx+.7,y0+1.9,HOME3_F+1.2],range:8,c:r3Sc(r3Lin(mixc([236,214,190],[230,176,130],nk)),1.6*day+6.0*nk),spot:1,d:[-.12,-.05,-.99],cosO:Math.cos(.95),cosI:Math.cos(.35),vol:0});
  const sky=r3Lin(mixc([146,136,122],[62,56,60],nk)),gnd=r3Lin(mixc([128,100,72],[56,46,40],nk)),fog=r3Lin(mixc([150,164,180],[34,40,74],nk));
  const W0=rooms[cur]?(HOME3_WIN[rooms[cur].key]||[.5,1.2]):[.5,1.2],wx0=(rooms[cur]?rooms[cur].x0:0)+W0[0]*RW;
  return {draws,vp:cam.vp,cam:cam.eye,t,lights:lights.slice(0,R3_MAXL),bulbs,
    sky:[...sky,1.5-.85*nk],gnd:[...gnd,.016-.002*nk],fog:[...r3Sc(fog,.7-.1*nk),.03],acc:[...r3Lin([255,170,90]),1],
    win:[wx0-W0[1]/2,y0+1.05,wx0+W0[1]/2,y0+2.15],win2:[B,7,7+Math.min(.999,nk),.85],sgn:[0,0,0,0],sgn2:[B,0,0,0],
    flm:[0,0,1,0],flm2:[B,0,0,0],tsg:null,tfl:null,M,ot:OT};
}
function home3UpRooms(){const base=hinGroundRooms();return hinUpRooms().map(u=>{const b=base.find(g=>g.x===u.x);return {key:u.key,x0:b?b.i*HOME3_RW:0};});}
function home3Night(){return HOME3.night!=null?HOME3.night:room3Night();}
/* куда смотреть на вещь «рассмотреть»: точка таблички по имени, иначе — у стены над x вещи */
function home3LookAt(L){if(!L)return null;const r=L.room;
  if(r){const p=HOME3.anch[r.key+"|"+L.ru];if(p)return p;}
  const f=(G.hin.folk||[]).find(v=>v.name===L.ru);if(f)return [home3X(f.x),(home3Up()?HOME3_UP:0)+1.6,-.45-(f.z||0)];
  return [home3X(L.x),(home3Up()?HOME3_UP:0)+1.2,HOME3_B+.5];}

/* ── холст, камера, кадр ── */
function home3Canvas(){
  let cn=HOME3.cn;
  if(!cn||!cn.isConnected){cn=document.getElementById("home3d")||document.createElement("canvas");cn.id="home3d";cn.setAttribute("aria-hidden","true");
    cn.style.cssText="position:fixed;left:0;top:0;pointer-events:none";(GPU.cv||document.body.firstChild).after(cn);HOME3.cn=cn;}
  let tg=HOME3.tags;
  if(!tg||!tg.isConnected){tg=document.getElementById("home3Tags")||document.createElement("div");tg.id="home3Tags";tg.setAttribute("aria-hidden","true");cn.after(tg);HOME3.tags=tg;}
  cn.style.display="";tg.style.display="";return cn;
}
function home3Size(cn){
  const cw=innerWidth,ch=innerHeight,dpr=hallDpr(cw,ch,window.devicePixelRatio);
  const pw=Math.max(2,Math.round(cw*dpr)),ph=Math.max(2,Math.round(ch*dpr));
  if(cn.width!==pw||cn.height!==ph){cn.width=pw;cn.height=ph;}
  cn.__dpr=pw/cw;cn.style.width=cw+"px";cn.style.height=ch+"px";
  return {cw,ch,wide:cw>=ch,rw:cw};
}
/* станция камеры: за хозяином вдоль полосы, на три четверти справа сверху — пол и дальняя стена читаются разом;
   на телефоне — дальше и выше, кадр выше, чем широк. Цель — вещь «рассмотреть» или собеседник (наезд 600 мс — ease) */
function home3Cam(sz,t){
  const S0=G.hin,R=hinGroundRooms(),X1=R.length*HOME3_RW,tw=wallMs(),dt=HOME3.t0?Math.min(.1,(tw-HOME3.t0)/1000):1;HOME3.t0=tw;
  const lp=S0.look?home3LookAt(S0.look):null,want=lp?(lp[0]+home3X(S0.x))/2:home3X(S0.x);
  const lo=Math.min(2.1,X1/2),hi=Math.max(X1-2.1,X1/2),cx=clamp(want,lo,hi),yy=home3Up()?HOME3_UP:0;
  const k=1-Math.exp(-dt*(lp?4.2:2.6));
  if(HOME3.cx==null||dt>=1){HOME3.cx=cx;HOME3.cy=yy;}else{HOME3.cx+=(cx-HOME3.cx)*k;HOME3.cy+=(yy-HOME3.cy)*(1-Math.exp(-dt*3));}
  const x=HOME3.cx,y=HOME3.cy,ph=!sz.wide,zoom=lp?.88:1;
  const c=ph?{eye:[x+.7,y+4.6,10.2*zoom],tgt:[x,y+.8,-.9],fy:.92}:{eye:[x+1.2,y+2.55,7.6*zoom],tgt:[x-.1,y+1.38,-1.0],fy:.8};
  const e=[c.eye[0]+.02*Math.sin(t*.31),c.eye[1]+.012*Math.sin(t*.23),c.eye[2]];
  const P=r3Persp(c.fy,sz.cw/Math.max(1,sz.ch),.1,90);
  return {eye:e,tgt:c.tgt,fy:c.fy,vp:r3Mul(P,r3Look(e,c.tgt,[0,1,0]))};
}
function home3Ok(){return ROOM3.on&&typeof document!=="undefined"&&!!(GPU&&GPU.dev&&GPU.ok)&&!HOME3.err;}
function home3Frame(){
  const cn=home3Canvas(),sz=home3Size(cn),R=rpgGet(cn);if(!R)return false;
  R.dpr=cn.__dpr;
  const up=home3Up(),rk="home|"+(G.home?G.home.tier:0)+"|"+(up?1:0)+"|"+(hinHasUp()?1:0);
  if(!HOME3.mesh||HOME3.rkey!==rk){r3Drop(HOME3.mesh);HOME3.mesh=home3Mesh(up);HOME3.rkey=rk;}
  const t=wallMs()/1000,cam=home3Cam(sz,t),S=home3Scene(cam,t);
  const lab=rpgBake(R,"r3lab","home3|"+cn.width+"x"+cn.height,cn.width,cn.height,()=>{});
  const U=new Float32Array(60);
  S.bulbs.slice(0,6).forEach((b,i)=>{const q=r3Proj(cam.vp,b,sz.cw,sz.ch),q2=r3Proj(cam.vp,[b[0]+.05,b[1],b[2]],sz.cw,sz.ch);
    if(q&&q2&&q[2]>0)U.set([q[0],q[1]+2,Math.max(2,Math.abs(q2[0]-q[0])),b[3]],i*4);});
  U.set([...r3Lin([255,200,140]),1.0],24);
  U[43]=t;U[44]=1;U[47]=1;
  const oq=r3Proj(cam.vp,cam.tgt,sz.cw,sz.ch);U.set([oq?oq[0]/sz.cw:.5,oq?oq[1]/sz.ch:.5,HALL_CA,1],48);
  U.set([1,sz.ch/sz.cw,HALL_SHARP,1],52);
  HOME3.frames++;HOME3.stat=hallLimits(S);HOME3.vp=cam.vp;HOME3.sz=sz;
  const m=HOME3.man;HOME3.meas={man:m?+hallManK(cam,m[0],m[2],sz.ch).toFixed(3):0,night:+home3Night().toFixed(2),up:up?1:0};
  room3TagsDraw(home3Tags(),cam,{cw:sz.cw,ch:sz.ch,wide:sz.wide,xr:sz.cw-12,yr:sz.ch-(sz.wide?150:230)},HOME3.tags,false);
  return r3Frame(cn,S,(pl,Sv,Vv,Bv)=>rpgField(R,pl,"r3post",R3_POST_WGSL,U,[Sv,lab,Vv,Bv]));
}
/* слова на вещах: «рассмотреть» — табличка у вещи; выход и закрытая ступень — тусклые надписи на дверях; имя
   комнаты — надпись в углу её стены */
function home3Tags(){const S0=G.hin,out=[],up=home3Up(),y0=up?HOME3_UP:0,A=HOME3.anch;
  if(S0.look&&S0.lookT>0){const p=home3LookAt(S0.look);if(p)out.push({p:[p[0],p[1]+.15,p[2]],t:S0.look.ru.toUpperCase(),s:S0.look.say,c:""});}
  if(!up){if(A.out)out.push({p:A.out,t:"ВЫХОД ВО ДВОР",s:"",c:"sg"});
    const R=hinGroundRooms();if(A.shut&&R.length<HOME_TIERS.length)out.push({p:A.shut,t:"ЗАКРЫТО",s:HOME_TIERS[R.length].ru,c:"sg"});}
  const r=hinRoomAt(S0.x);if(r){const x0=Math.floor(home3X(S0.x)/HOME3_RW)*HOME3_RW;out.push({p:[x0+.25,y0+(up?1.95:2.62),HOME3_B+.02],t:r.ru.toUpperCase(),s:"",c:"sg"});}
  return out;}
function home3Hide(){
  if(HOME3.cn&&HOME3.cn.style.display!=="none"){HOME3.cn.style.display="none";r3Free(HOME3.cn);}
  if(HOME3.tags&&HOME3.tags.style.display!=="none"){HOME3.tags.style.display="none";HOME3.tags.textContent="";HOME3.tags.__key="";}
  if(HOME3.mesh){r3Drop(HOME3.mesh);HOME3.mesh=null;HOME3.rkey="";}
  HOME3.cx=null;HOME3.t0=0;
}
home3Frame=hallCostWrap(home3Frame);
function home3Cost(sec){return HOME3.cn&&HOME3.cn.style.display!=="none"?hallCost(sec,()=>home3Frame(),HOME3.cn):Promise.resolve(null);}

/* ── шов с домом (29d) и кадром (28): под ROOM3.on 2D дом не рисуется; кадр упал — назад к 2D, с именем сбоя ── */
{const f0=drawHomeIn;drawHomeIn=function(){
  if(!home3Ok()||!G.hin||!hinRooms().length)return f0();
  try{home3Frame();}catch(e){HOME3.err++;console.error("дом: кадр упал",e);home3Hide();return f0();}};}
{const f0=drawWorldIn;drawWorldIn=function(){f0();if(HOME3.cn&&!(G.mode==="homein"&&G.hin&&home3Ok()))home3Hide();};}
