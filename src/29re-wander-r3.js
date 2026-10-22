/* ══════════════ «Сорока» на движке (M851, docs/DESIGN-rooms.md §4) ══════════════
   Коридор внутри хребта парусника — сценой рендера интерьеров 27f2 во весь экран под приборами. Логика не
   правится: шаг по коридору, покупка, прилавок сырья, отплытие — 24c-mode-wanderer и пульт 26d; здесь только
   как это выглядит.

   ПРАВИЛА ФАЙЛА:
   1. Мерило — человек 1.75 м. Коридор 3 м шириной, потолок 2.6 — низкий, долгий; витрины по стенам вперемежку
      (чёт — левая), в конце стойка хранителя, за ней тёмно-красный занавес. Курсор — это где вы стоите:
      объектив идёт по коридору к витрине курсора и плывёт, а не прыгает.
   2. Свет — две температуры, по одному источнику: холод — край планеты в щели над занавесом, он кладёт полосы
      по палубе к вам; тепло — зелёная лампа хранителя над гроссбухом. Паруса — золото сверху, слабо. Лампочки
      витрин ровные и светят только ближним (движение, а не мигание).
   3. Купленная вещь оставляет пустую витрину с меловой биркой: дыра и есть память. Цена — мелом, словом у
      витрины (табличка DOM, как в других комнатах), не на холсте.
   4. Хранитель — тело генератора (27f3) с живым лицом, руки на стойке, смотрит на вас; свой небольшой ключ на
      лице. Последний час — вспышка спички у его руки, один раз.
   5. 2D-«Сороки» нет (22.10, автор: «2D не должно быть»): художник 24c-mode-wanderer-draw удалён. Без видеокарты
      кадра нет — плашка «нет WebGPU» (08b2); сбой кадра называет страж (28-loop). */
const WAN3={cn:null,tags:null,mesh:null,mkey:"",err:0,frames:0,S:null,vp:null,sz:null,meas:null,cam:null,t:0};
/* «Сорока» говорит у хранителя: строка say() встаёт табличкой у якоря «keeper» (08bj HANG_MSG_AT), его кладёт wan3Frame */
HANG_MSG_AT.wanderer="keeper";
const WAN3_L=-1.5,WAN3_R=1.5,WAN3_H=2.6,WAN3_F=3.4,WAN3_B=-10.6;
const WAN3_CZ=-9.3,WAN3_KZ=-9.95;   /* стойка и где стоит хранитель */
const WAN3_WIN=[-1.25,1.25,2.14,2.44];   /* щель над занавесом: x0, x1, y0, y1 */
const WAN3_LAMP=[-.42,1.72,WAN3_CZ];      /* зелёная лампа над гроссбухом */
const WAN3_M=new Float32Array(R3_MAXI*R3_PART*16),WAN3_OT=new Float32Array(R3_MAXI*R3_PART*4);
/* висящее на леере: x, z крюка и часть сетки (качается своей матрицей) */
const WAN3_HANG=[[.62,-1.9,1],[-.66,-4.4,2],[.6,-6.9,3]];   /* у стен и выше глаз: середина коридора — вид на стойку */
const WAN3_BRASS=[201,162,74];

/* витрина i: стена (чёт — левая, side −1), глубина z середины. Шкаф развёрнут к идущему на 35°: прямо
   вдоль стены его видно только ребром, и вещи на сукне не читаются. A — местные оси шкафа (+z — лицом
   в коридор), pt(p) — местная точка в мир */
const WAN3_TURN=.61;
function wan3Case(i){const side=i%2===0?-1:1,z=.6-i*1.25,x=side*(WAN3_R-.36),yaw=-side*(Math.PI/2-WAN3_TURN);
  const A=r3Xf([x,0,z],yaw);return {side,z,x,yaw,A,pt:p=>r3Pt(A,p)};}

/* ── вещь на сукне: одно тело, латунь и бумага; местные оси — +z к коридору ── */
function wan3Item(K,lot){
  const P=R3P,Mb=K.mt(WAN3_BRASS,.75,12,P.brushed),Md=K.mt([106,82,33],.6,10,P.brushed),Mk=K.mt([43,47,54],.4,8,0);
  const Mpa=K.mt([217,207,174],.08,3,0),Mle=K.mt([58,49,40],.3,6,P.leather);
  const id=lot.cat?lot.cat.id:lot.id,fam=lot.fam;
  if(fam==="paper"){   /* сложенная карта: три панели гармошкой, красная линия маршрута */
    for(let k=0;k<3;k++){K.push([-.1+k*.1,.005+k*.004,0],0,0,(k%2?-1:1)*.06);K.box([0,0,0],[.05,.004,.14],Mpa,.002);K.pop();}
    K.box([0,.02,0],[.12,.0015,.004],K.mt([150,48,36],.2,3,0),0);return;}
  if(fam==="wild"){    /* свёрток под сукном, бирка на бечёвке */
    K.ell([0,.1,0],[.16,.1,.12],K.mt([58,49,40],.1,3,P.cloth),6,12);
    K.box([.15,.06,.08],[.045,.03,.003],Mpa,.002);return;}
  switch(id){
    case "bell":{   /* судовой колокол на скобе: раструб с губой, талия, плечо, корона-ушко; язык виден снизу */
      const Ms=K.mt([92,64,40],.3,7,P.wood);K.box([0,.006,0],[.15,.006,.07],Ms,.003);
      for(const sx of [-1,1])K.box([sx*.135,.14,0],[.012,.14,.012],Ms,.004);K.box([0,.285,0],[.15,.012,.014],Ms,.004);
      K.push([0,.03,0]);
      K.lathe([[0,.105],[.008,.112],[.02,.104],[.06,.074],[.13,.066],[.17,.058],[.19,.042],[.2,.022],[.205,0]],20,Mb);
      K.lathe([[.012,.113],[.02,.105]],20,Md);K.tube([[0,.205,0],[0,.24,0]],.01,Md,6);
      K.tube([[0,.13,0],[0,.04,0]],.004,Md,4);K.ell([0,.035,0],[.016,.016,.016],Md,4,8);K.pop();break;}
    case "sextant":{const ps=[];for(let a=0;a<=12;a++){const t=Math.PI*(1.1+.8*a/12);ps.push([Math.cos(t)*.17,.2+Math.sin(t)*.17,0]);}
      K.tube(ps,.012,Mb,6);K.tube([[0,.2,0],[-.12,.06,0]],.008,Md,5);K.tube([[0,.2,0],[.13,.08,0]],.008,Md,5);
      K.ell([0,.2,0],[.022,.022,.015],Mk,4,8);K.box([0,.02,0],[.1,.02,.06],Mk,.006);break;}
    case "gyro":{const c=[0,.15,0],r=.12;for(let k=0;k<3;k++){const ps=[];for(let a=0;a<=24;a++){const t=a/24*TAU;
        ps.push(k===0?[c[0]+Math.cos(t)*r,c[1],c[2]+Math.sin(t)*r]:k===1?[c[0]+Math.cos(t)*r,c[1]+Math.sin(t)*r,c[2]]:[c[0],c[1]+Math.sin(t)*r*.95,c[2]+Math.cos(t)*r*.95]);}
        K.tube(ps,.007,Mb,5);}
      K.ell(c,[.035,.035,.035],Mk,5,10);K.lathe([[0,.06],[.02,.04],[.03,.01]],12,Md);break;}
    case "valve":{K.tube([[0,0,0],[0,.13,0]],.018,Md,8);const ps=[];for(let a=0;a<=20;a++){const t=a/20*TAU;ps.push([Math.cos(t)*.1,.2+Math.sin(t)*.1,0]);}
      K.tube(ps,.014,Mb,6);for(let k=0;k<3;k++){const t=k/3*TAU+.3;K.tube([[0,.2,0],[Math.cos(t)*.1,.2+Math.sin(t)*.1,0]],.007,Mb,5);}
      K.ell([0,.2,0],[.02,.02,.02],Mk,4,8);break;}
    case "trumpet":K.push([0,.07,0],.3,0,Math.PI/2);K.lathe([[-.2,.018],[.0,.024],[.1,.04],[.16,.07],[.2,.11],[.205,.105]],16,Mb);K.pop();break;
    case "key":{K.push([0,.012,0],.5);const ps=[];for(let a=0;a<=16;a++){const t=a/16*TAU;ps.push([-.13+Math.cos(t)*.05,0,Math.sin(t)*.05]);}
      K.tube(ps,.01,Mb,5);K.box([.04,0,0],[.12,.008,.012],Mb,.003);K.box([.14,0,.03],[.012,.008,.03],Mb,.002);K.box([.1,0,.025],[.01,.008,.025],Mb,.002);K.pop();break;}
    case "pencil":K.push([0,.012,0],.6);K.box([0,0,0],[.15,.011,.011],K.mt([217,164,58],.2,5,0),.004);
      K.push([.15,0,0],0,0,-Math.PI/2);K.lathe([[0,.011],[.04,0]],8,K.mt([214,190,150],.1,3,0));K.pop();K.pop();break;
    case "needle":K.push([0,.006,0],.9);K.tube([[-.16,0,0],[.16,0,0]],.003,K.mt([216,220,226],.8,14,P.brushed),5);
      K.tube([[-.15,0,0],[-.2,0,.05],[-.12,0,.1]],.002,K.mt([200,60,50],.1,3,0),4);K.pop();break;
    case "blanket":K.box([0,.04,0],[.17,.04,.11],K.mt([184,188,194],.08,3,P.cloth),.02);K.box([0,.083,0],[.17,.004,.03],K.mt([150,60,48],.08,3,P.cloth),0);break;
    case "notebook":K.box([0,.02,0],[.09,.02,.12],Mle,.008);K.box([.085,.02,0],[.006,.017,.115],Mpa,0);break;
    case "sign":K.push([0,.1,0],0,-.25);K.box([0,0,0],[.16,.08,.008],K.mt([58,49,40],.2,5,P.wood),.004);K.box([0,0,.009],[.12,.012,.001],K.mt([232,220,190],.1,3,0,.15),0);K.pop();break;
    case "hand":{const Mh=K.mt([184,188,194],.6,10,P.brushed);K.box([0,.06,0],[.025,.06,.025],K.mt([138,146,153],.6,10,P.brushed),.006);K.box([0,.14,0],[.07,.03,.04],Mh,.01);
      for(let k=-1;k<=1;k++)K.tube([[k*.045,.16,0],[k*.055,.25,.02]],.01,Mh,5);break;}
    case "pricelist":K.push([0,.13,0],0,-.2);K.box([0,0,0],[.09,.13,.003],Mpa,0);
      for(let k=0;k<6;k++)K.box([-.02+(k%2)*.012,.08-k*.035,.004],[.05+(k%2)*.01,.003,.001],K.mt([90,70,40],.1,3,0),0);K.pop();break;
    case "shelfwide":K.box([0,.08,0],[.2,.012,.06],K.mt([106,82,52],.3,7,P.wood),.004);
      for(const s of [-1,1])K.box([s*.15,.035,-.03],[.012,.035,.03],Mk,.003);break;
    default:{   /* прочее (космос, книги, коробки): латунная коробка, иногда с линзой — размер от имени */
      const r=rng(hashi((lot.ru||"").length,(id||"").length,0x7001)),w=.08+r()*.06,h=.05+r()*.06;
      K.box([0,h,0],[w,h,.07],Md,.012);K.box([0,h*1.6,0],[w-.008,h*.45,.072],Mb,.01);
      if(r()<.5)K.ell([w*.45,h,.072],[.03,.03,.012],Mk,4,10);}
  }
}

/* ── сетка коридора (меняется, когда ушла вещь или сменилась стоянка) ── */
function wan3Mesh(S,lots){
  const K=r3Kit(),P=R3P,L=WAN3_L,R=WAN3_R,H=WAN3_H,F=WAN3_F,B=WAN3_B;
  const Mw=K.mt([104,88,74],.2,6,P.wood),Mfl=K.mt([84,66,52],.08,9,P.wood),Mce=K.mt([46,42,44],.2,5,P.ceil);
  const Mcut=K.mt([18,18,20],.2,4,0),Mbr=K.mt(WAN3_BRASS,.7,12,P.brushed),Mdk=K.mt([62,46,34],.35,7,P.wood);
  const Mcl=K.mt([36,74,52],.05,3,P.cloth),Mst=K.mt([70,74,80],.55,10,P.brushed),Mwd=K.mt([96,72,48],.3,7,P.wood);
  K.part=0;
  /* коробка: задняя стена с щелью, стены, палуба, потолок; срез спереди тёмный */
  hallWall(K,L,R,0,H,B,[WAN3_WIN],K.mt([72,64,58],.2,6,P.wall));
  K.quad([L,0,F],[L,0,B],[L,H,B],[L,H,F],Mw,[1,0,0]);
  K.quad([R,0,B],[R,0,F],[R,H,F],[R,H,B],Mw,[-1,0,0]);
  K.quad([L,0,F],[R,0,F],[R,0,B],[L,0,B],Mfl,[0,1,0]);
  K.quad([L,H,B],[R,H,B],[R,H,F],[L,H,F],Mce,[0,-1,0]);
  K.box([0,-.15,F+.01],[R+.2,.15,.012],Mcut,0);K.box([0,H+.15,F+.01],[R+.2,.15,.012],Mcut,0);
  for(const s of [-1,1])K.box([s*(R+.1),H/2,F+.01],[.1,H/2+.3,.012],Mcut,0);
  /* щель: стекло узора window (край планеты), рама латунью */
  {const [x0,x1,y0,y1]=WAN3_WIN,z=B;
    K.quad([x0,y0,z+.01],[x1,y0,z+.01],[x1,y1,z+.01],[x0,y1,z+.01],K.mt([3,3,3],.2,70,P.window,0,true),[0,0,1]);
    K.box([(x0+x1)/2,y0-.02,z+.04],[(x1-x0)/2+.04,.02,.04],Mbr,.006);K.box([(x0+x1)/2,y1+.02,z+.04],[(x1-x0)/2+.04,.02,.04],Mbr,.006);
    for(let i=0;i<=4;i++)K.box([x0+(x1-x0)*i/4,(y0+y1)/2,z+.03],[.014,(y1-y0)/2,.03],Mbr,.004);}
  /* палуба — доски к стойке, вытертая дорожка посередине; у стен латунная полоса */
  for(let x=L+.2;x<R;x+=.2)K.box([x,.0015,(F+B)/2],[.0035,.0015,(F-B)/2],K.mt([40,32,26],.1,4,0),0);
  K.box([0,.004,(F+WAN3_CZ)/2+.2],[.55,.003,(F-WAN3_CZ)/2-.4],K.mt([118,58,40],.05,3,P.cloth),.002);
  for(const s of [-1,1])K.box([s*(R-.01),.07,(F+B)/2],[.008,.012,(F-B)/2],Mbr,0);
  /* стены — панели со швами, потолок — доски парусного дерева (золото сверху ляжет на них) */
  for(let z=F-.6;z>B;z-=1.25)for(const s of [-1,1])K.box([s*(R-.004),H/2,z],[.004,H/2,.006],K.mt([40,34,30],.2,4,0),0);
  for(let x=-1.2;x<=1.21;x+=.3)K.box([x,H-.02,(F+B)/2],[.11,.02,(F-B)/2],K.mt([132,96,58],.25,7,P.wood),.006);
  /* рёбра-кольца: тонкие дуги через пару витрин — коридор внутри хребта, а не решётка перед объективом */
  for(let i=0;i<=4;i++){const z=1.225-i*2.5;if(z<WAN3_CZ+.4)break;const ps=[];
    for(let a=0;a<=14;a++){const t=Math.PI*a/14;ps.push([-Math.cos(t)*(R-.04),Math.min(H-.05,(H-.3)*Math.min(1,Math.sin(t)*1.6)+.2*Math.sin(t)),z]);}
    K.tube(ps,.028,K.mt([120,100,70],.6,11,P.brushed),8);}
  /* витрины: тёмное дерево, сукно, полка, латунные уголки, лампочка сверху; вещь — на полке. Местные оси шкафа */
  lots.forEach((lot,i)=>{const C=wan3Case(i);K.pushM(C.A);
    K.box([0,1.22,-.2],[.44,.66,.2],Mdk,.02);
    K.box([0,1.24,.001],[.38,.56,.002],Mcl,0);
    K.box([0,.98,-.08],[.38,.015,.15],Mwd,.004);
    for(const sx of [-1,1])for(const sy of [-1,1])K.box([sx*.38,1.24+sy*.56,.002],[.04,.04,.012],Mbr,.004);
    K.box([0,1.85,-.08],[.06,.012,.03],Mbr,.004);
    K.ell([0,1.82,-.08],[.025,.02,.025],K.mt([255,226,170],.2,4,0,lot.empty?0:2.2,true),4,8);
    K.push([0,.995,-.07],0,0,0,1.7);   /* вещь крупнее модели: витрина её подаёт */
    if(lot.empty||lot.gone){   /* меловая бирка вместо вещи */
      K.push([0,.08,0],0,-.18,.06);K.box([0,0,0],[.11,.045,.004],K.mt([42,40,38],.2,4,0),.002);
      K.box([0,0,.005],[.08,.006,.001],K.mt([232,220,190],.1,3,0,.12),0);K.pop();}
    else wan3Item(K,lot);
    K.pop();K.pop();});
  /* тюки и ящики у стен между витринами: пол не пуст до самой стойки */
  for(let k=0;k<6;k++){const r=rng(hashi(S.seed|0,k,0xBA1E)),s=k%2?1:-1,z=-.05-k*1.25-r()*.2,x=s*(R-.35);
    if(r()<.5)K.box([x,.17,z],[.2,.17,.18],K.mt([96,74,50],.25,6,P.wood),.02);
    else K.ell([x,.16,z],[.24,.16,.2],K.mt([86,80,66],.08,3,P.cloth),6,12);}
  /* стойка: тумба тёмного дерева, латунная кромка, гроссбух под лампой, лампа с зелёным абажуром */
  {const z=WAN3_CZ;K.box([0,.5,z],[1.05,.5,.3],Mdk,.02);K.box([0,1.015,z],[1.1,.015,.34],K.mt([120,86,56],.35,8,P.wood),.006);
    K.box([0,1.0,z+.335],[1.1,.012,.008],Mbr,0);
    for(const s of [-1,1]){K.push([WAN3_LAMP[0]+s*.1,1.04,z+.05],-.06*s);K.box([0,0,0],[.1,.006,.14],K.mt([217,207,174],.08,3,0),.002);K.pop();}
    K.box([WAN3_LAMP[0],1.035,z+.05],[.21,.004,.145],K.mt([86,52,40],.3,5,P.leather),0);
    hallShade(K,WAN3_LAMP[0],WAN3_LAMP[1],z,[255,214,150],H,false);
    /* сорока на жёрдочке у края стойки: чёрная, белый бок, длинный хвост — герой рядом с хранителем */
    const bx=.62,by=1.03,bz=z-.02,Mk=K.mt([16,18,22],.5,12,0),Mw2=K.mt([226,226,222],.2,5,0),Mt=K.mt([22,34,52],.6,13,0);
    K.box([bx,by+.1,bz],[.012,.1,.012],Mwd,.004);K.box([bx,by+.2,bz],[.09,.008,.008],Mwd,.003);
    K.push([bx,by+.29,bz],-.5);
    K.ell([0,0,0],[.05,.055,.08],Mk,6,12);K.ell([.028,-.01,0],[.03,.04,.065],Mw2,5,10);K.ell([-.028,-.01,0],[.03,.04,.065],Mw2,5,10);
    K.ell([0,.055,.07],[.035,.035,.038],Mk,5,10);K.box([0,.05,.115],[.006,.006,.018],Mk,.002);
    K.push([0,0,-.1],0,.35);K.box([0,0,-.1],[.018,.006,.12],Mt,.004);K.pop();K.pop();}
  /* за стойкой: занавес тёмно-красный складками, по бокам полки с банками, шлем хранителя на крюке */
  K.surf(32,2,(u,v)=>[[-1.08+u*2.16,v*2.02,B+.12+.045*Math.sin(u*TAU*7)+.012*Math.sin(u*TAU*19)]],K.mt([112,32,30],.08,3,P.cloth));
  K.box([0,2.05,B+.1],[1.14,.02,.02],Mbr,.004);
  for(const s of [-1,1]){const x=s*1.3;
    for(const y of [1.1,1.5,1.9]){K.box([x,y,B+.13],[.17,.012,.12],Mwd,.003);
      for(let j=0;j<3;j++){const r=rng(hashi(j,y*10|0,s+5))();K.push([x-.1+j*.1,y+.012,B+.12]);
        K.lathe([[0,.03],[.07+r*.05,.032],[.08+r*.05,.02],[.095+r*.05,.022]],10,K.mt([[120,150,90],[150,96,60],[110,120,150]][j],.85,13,P.glass));K.pop();}}}
  K.ell([.82,1.55,B+.2],[.13,.14,.13],K.mt([138,146,153],.6,10,P.brushed),8,12);
  K.ell([.82,1.55,B+.31],[.085,.07,.03],K.mt([150,196,214],.85,14,P.glass),6,10);
  K.tube([[.82,1.69,B+.15],[.82,1.76,B+.04]],.008,Mst,5);
  /* леер под потолком и что на нём висит: каждая вещь — своя часть сетки, качается медленно */
  const Mro=K.mt([150,140,120],.2,4,0);
  for(const s of [-1,1])K.tube([[s*.64,H-.1,F-.4],[s*.64,H-.1,WAN3_CZ+.8]],.007,Mro,5);
  WAN3_HANG.forEach(([x,z,part],k)=>{K.part=part;const y=H-.1;
    K.tube([[x,y,z],[x,y-.2,z]],.004,Mro,4);
    if(k===0){K.push([x,y-.36,z]);K.lathe([[-.14,.06],[-.12,.08],[0,.09],[.1,.07],[.14,.03]],10,K.mt([54,58,62],.6,10,P.brushed));K.pop();}
    else if(k===1){for(let j=0;j<6;j++){const t=j/6*TAU;K.tube([[x,y-.2,z],[x+Math.cos(t)*.1,y-.3,z+Math.sin(t)*.1],[x+Math.cos(t)*.1,y-.5,z+Math.sin(t)*.1]],.004,Mbr,4);}
      K.box([x,y-.5,z],[.11,.008,.11],Mbr,.003);}
    else K.ell([x,y-.33,z],[.1,.13,.09],K.mt([120,100,76],.08,3,P.cloth),6,10);
    K.part=0;});
  return K.pack();
}

/* ── хранитель: тело генератора с постоянным геном, серый лётный костюм, лицо живое ── */
function wan3Keeper(){let s=hashi(0x50A0,0xCA,0x7EE9)>>>0;
  for(let i=0;i<12;i++){const g=cpGene({seed:s,loy:60,traits:[]});if(g&&!g.ai)break;s=(Math.imul(s,1103515245)+12345)>>>0;}
  return {seed:s,loy:60,traits:[],jac:[118,124,128]};}

function wan3Scene(S,lots,cam,t,cur){
  const M=WAN3_M,OT=WAN3_OT,I=r3Xf([0,0,0]),B=WAN3_B,dark=!!S.dark;
  for(let i=0;i<R3_MAXI*R3_PART;i++)M.set(I,i*16);OT.fill(0);
  /* висящее качается: длинные периоды, у каждого свой — дрейф, не маятник */
  WAN3_HANG.forEach(([x,z,part],k)=>{const a=.05*Math.sin(t*(.21+k*.07)+k*1.7),b=.04*Math.sin(t*(.17+k*.05)+k);
    M.set(r3Pivot(I,[x,WAN3_H-.1,z],0,b,a),part*16);});
  const draws=[[WAN3.mesh,0,1]],m=wan3Keeper(),mesh=cpMesh(m,"bar",1);
  win3Man(M,1,m,mesh,r3Xf([0,0,WAN3_KZ],0),t,cam.eye);draws.push([mesh,1,1]);
  const lights=[],bulbs=[],gold=dark?.45:1,nz=v=>{const l=Math.hypot(...v);return v.map(x=>x/l);};
  /* ключ — зелёная лампа над гроссбухом, с тенью */
  lights.push({p:[WAN3_LAMP[0],WAN3_LAMP[1]-.02,WAN3_LAMP[2]],range:4.2,c:r3Sc(r3Lin([255,212,150]),5.2),spot:1,d:[.05,-1,.02],
    cosO:Math.cos(1.05),cosI:Math.cos(.45),shadow:1,vol:.05,key:1});bulbs.push([WAN3_LAMP[0],WAN3_LAMP[1]-.03,WAN3_LAMP[2],.5]);
  /* лицо хранителя — малый ключ сбоку-спереди: без него голова у стойки — силуэт против занавеса */
  {const h=[0,1.62,WAN3_KZ],q=[-1.1,2.2,WAN3_KZ+1.5],v=[h[0]-q[0],h[1]-q[1],h[2]-q[2]],Ln=Math.hypot(...v);
    lights.push({p:q,range:Ln+.4,c:r3Sc(r3Lin([255,214,170]),Ln*Ln*2.4),spot:1,d:v.map(x=>x/Ln),cosO:Math.cos(.22),cosI:Math.cos(.1),vol:0});}
  /* холод — край планеты в щели: конусом вдоль коридора к вам, полосы на палубе */
  lights.push({p:[0,2.32,B+.3],range:15,c:r3Sc(r3Lin([150,190,230]),dark?2.2:4.2),spot:1,d:nz([0,-.2,1]),cosO:Math.cos(.62),cosI:Math.cos(.25),shadow:1,vol:.07});
  /* паруса — золото сверху, мягко: два широких пятна под потолком, не горячая точка */
  for(const z of [-1.2,-5.6])lights.push({p:[0,WAN3_H-.45,z],range:5.5,c:r3Sc(r3Lin([211,157,52]),1.1*gold),vol:.02});
  /* лампочки витрин: светят ближние к вам (до четырёх), на сукно сверху и чуть из-за стекла */
  for(let i=cur,n=0;i<lots.length&&n<4;i++){const lot=lots[i];if(!lot||lot.empty)continue;n++;const C=wan3Case(i),p=C.pt([0,1.8,.12]),q=C.pt([0,.9,-.15]);
    lights.push({p,range:2.1,c:r3Sc(r3Lin([255,214,160]),i===cur?2.4:1.5),spot:1,d:nz([q[0]-p[0],q[1]-p[1],q[2]-p[2]]),cosO:Math.cos(.9),cosI:Math.cos(.4),vol:0});
    if(bulbs.length<6)bulbs.push(C.pt([0,1.82,-.08]).concat(i===cur?.4:.25));}
  /* вспышка спички — последний час, один раз: тёплая точка у руки хранителя */
  if(S.flashT){const u=(clockNow()-S.flashT)/1500;if(u>=0&&u<1){const a=Math.sin(Math.PI*Math.min(1,u*4))*(1-u);
    lights.push({p:[.25,1.25,WAN3_CZ-.1],range:3.5,c:r3Sc(r3Lin([255,200,120]),8*a),vol:.03});}}
  /* заливка от разреза: слабый холод, чтобы ближняя витрина не была чёрной */
  lights.push({p:[0,1.9,WAN3_F+2],range:8,c:r3Sc(r3Lin([150,164,186]),.5),spot:1,d:[0,-.2,-.98],cosO:Math.cos(.8),cosI:Math.cos(.3),vol:0});
  const sys=G.sys,pl=(sys&&sys.planets&&S.w&&S.w.planetIx>=0)?sys.planets[S.w.planetIx]:null;
  const pal=(pl&&TYPES[pl.type])?TYPES[pl.type].pal:null,ac=pal?pal[Math.min(2,pal.length-1)]:[120,150,190];
  return {draws,vp:cam.vp,cam:cam.eye,t,lights:lights.slice(0,R3_MAXL),bulbs,
    sky:[...r3Lin([60,62,72]),.3],gnd:[...r3Lin([70,56,44]),.05],fog:[...r3Sc(r3Lin([36,40,52]),.2),.05],acc:[...r3Lin(ac),1],
    win:[WAN3_WIN[0],WAN3_WIN[2],WAN3_WIN[1],WAN3_WIN[3]],win2:[B,3,(S.seed%997)+t*.02,1],sgn:[0,0,0,0],sgn2:[B,0,0,0],
    flm:[0,0,1,0],flm2:[B,0,0,0],tsg:null,tfl:null,M,ot:OT};
}

/* ── холст, объектив, кадр ── */
function wan3Canvas(){
  let cn=WAN3.cn;
  if(!cn||!cn.isConnected){cn=document.getElementById("wan3d")||document.createElement("canvas");cn.id="wan3d";cn.setAttribute("aria-hidden","true");
    cn.style.cssText="position:fixed;left:0;top:0;pointer-events:none";(GPU.cv||document.body.firstChild).after(cn);WAN3.cn=cn;}
  let tg=WAN3.tags;
  if(!tg||!tg.isConnected){tg=document.getElementById("wan3Tags")||document.createElement("div");tg.id="wan3Tags";tg.setAttribute("aria-hidden","true");cn.after(tg);WAN3.tags=tg;}
  /* слой табличек #ovl (08bi) — над комнатой: он встаёт сразу за #g, и заведённый позже холста комнаты лёг бы под неё */
  const o=typeof OVL!=="undefined"?OVL.cv:null;
  if(o&&o.parentNode===cn.parentNode&&(o.compareDocumentPosition(cn)&4))o.before(cn);
  cn.style.display="";tg.style.display="";return cn;
}
/* станция курсора: стоите у витрины, через плечо — коридор до стойки. Телефон — ближе к своей стене, уже */
function wan3Station(cur,n,wide){
  const C=wan3Case(clamp(cur,0,Math.max(0,n-1))),s=C.side,end=[0,1.4,WAN3_CZ];
  /* телефон: узкий кадр — витрина целиком, с отступом, в окне над пультом (цель ниже — витрина выше) */
  const eye=wide?[-s*.45,1.62,Math.min(WAN3_F-.3,C.z+2.5)]:[-s*.85,1.5,Math.min(WAN3_F-.3,C.z+2.6)];
  const k=wide?.36:.06,near=C.pt([0,wide?1.15:.82,0]);
  return {eye,tgt:near.map((v,i)=>v+(end[i]-v)*k),fy:wide?.92:1.1};
}
function wan3Cam(sz,t,cur,n){
  const A=wan3Station(cur,n,sz.wide),dt=WAN3.t?Math.min(.1,Math.max(0,t-WAN3.t)):1;WAN3.t=t;
  let c=WAN3.cam;
  if(!c||c.wide!==sz.wide)c=WAN3.cam={eye:A.eye.slice(),tgt:A.tgt.slice(),fy:A.fy,wide:sz.wide};
  else{const k=1-Math.exp(-dt*3.2);for(let i=0;i<3;i++){c.eye[i]+=(A.eye[i]-c.eye[i])*k;c.tgt[i]+=(A.tgt[i]-c.tgt[i])*k;}c.fy+=(A.fy-c.fy)*k;}
  const e=[c.eye[0]+.02*Math.sin(t*.31),c.eye[1]+.012*Math.sin(t*.23),c.eye[2]];
  const P=r3Persp(c.fy,sz.cw/Math.max(1,sz.ch),.1,90);
  return {eye:e,tgt:c.tgt,fy:c.fy,vp:r3Mul(P,r3Look(e,c.tgt,[0,1,0])),moving:Math.hypot(A.eye[2]-c.eye[2],A.eye[0]-c.eye[0])>.12};
}
function wan3Ok(){return typeof document!=="undefined"&&!!(GPU&&GPU.dev&&GPU.ok);}
function wan3Frame(){
  const S=wanAll(),cn=wan3Canvas(),sz=home3Size(cn),R=rpgGet(cn);if(!R)return false;
  R.dpr=cn.__dpr;
  const lots=wanLots(),cur=clamp(S.cursor,0,Math.max(0,lots.length-1));
  const mk=(S.seed|0)+"|"+(S.dark?1:0)+"|"+lots.map(l=>(l.id||"-")+(l.empty?"e":"")+(l.gone?"g":"")).join(",");
  if(!WAN3.mesh||WAN3.mkey!==mk){r3Drop(WAN3.mesh);WAN3.mesh=wan3Mesh(S,lots);WAN3.mkey=mk;}
  const t=wallMs()/1000,cam=wan3Cam(sz,t,cur,lots.length),Sc=wan3Scene(S,lots,cam,t,cur);
  const lab=r3Dev()?R3.blank:null;   /* подписей поверх кадра нет: пустой вид движка, а не выпечка 2D */
  const U=new Float32Array(60);
  Sc.bulbs.slice(0,6).forEach((b,i)=>{const q=r3Proj(cam.vp,b,sz.cw,sz.ch),q2=r3Proj(cam.vp,[b[0],b[1],b[2]+.05],sz.cw,sz.ch);
    if(q&&q2&&q[2]>0)U.set([q[0],q[1]+2,Math.max(2,Math.abs(q2[0]-q[0])+Math.abs(q2[1]-q[1])),b[3]],i*4);});
  U.set([...r3Lin([255,200,140]),1.0],24);
  U[43]=t;U[44]=1;U[47]=1;
  const oq=r3Proj(cam.vp,cam.tgt,sz.cw,sz.ch);U.set([oq?oq[0]/sz.cw:.5,oq?oq[1]/sz.ch:.5,HALL_CA,1],48);
  U.set([1,sz.ch/sz.cw,HALL_SHARP,1],52);
  WAN3.frames++;WAN3.S=Sc;WAN3.vp=cam.vp;WAN3.sz=sz;
  WAN3.meas={man:+hallManK(cam,0,WAN3_KZ,sz.ch).toFixed(3),cur,n:lots.length};
  /* пульт «Сороки» (26d) внизу: таблички кончаются над ним */
  const pw=document.getElementById("wanwin"),pr=pw&&pw.classList.contains("open")?pw.getBoundingClientRect():null;
  room3TagsDraw(wan3Tags(lots,cur),cam,{cw:sz.cw,ch:sz.ch,wide:sz.wide,xr:sz.wide?sz.cw-200*UIK:sz.cw-12,yr:pr?pr.top-8:sz.ch-(sz.wide?150:230)},WAN3.tags,cam.moving);
  /* реплика хранителя — табличкой у его головы, с поводком (08bj, якорь режима «keeper»). Голова за кадром или под
     пультом (телефон смотрит на витрину) — якоря нет, строка остаётся прежней строкой сообщения */
  const hq=r3Proj(cam.vp,[0,1.62,WAN3_KZ],sz.cw,sz.ch),hq2=r3Proj(cam.vp,[.14,1.62,WAN3_KZ],sz.cw,sz.ch);
  WAN3.head=hq&&hq2&&hq[2]>0&&hq[0]>sz.cw*.06&&hq[0]<sz.cw*.94&&hq[1]>sz.ch*.08&&hq[1]<(pr?pr.top:sz.ch)-24?[hq[0],hq[1]]:null;
  if(WAN3.head)hangAt("keeper",hq[0],hq[1],Math.max(8,Math.abs(hq2[0]-hq[0])));
  return r3Frame(cn,Sc,(pl,Sv,Vv,Bv)=>rpgField(R,pl,"r3post",R3_POST_WGSL,U,[Sv,lab,Vv,Bv]));
}
/* цена — мелом у витрины: ближние три; пустая и проданная говорят словом */
function wan3Tags(lots,cur){const out=[];
  for(let i=cur;i<lots.length&&i<cur+3;i++){const lot=lots[i],C=wan3Case(i);
    const t=lot.empty?"ПУСТО":lot.gone?"ПРОДАНО":lot.pay&&lot.pay.m?lot.pay.m+" СП.":"ОБМЕН";
    out.push({p:C.pt([C.side>0?.38:-.38,.6,.02]),t,s:"",c:"sg",al:C.side>0?"r":""});}
  return out;}
function wan3Hide(){
  if(WAN3.cn&&WAN3.cn.style.display!=="none"){WAN3.cn.style.display="none";r3Free(WAN3.cn);}
  if(WAN3.tags&&WAN3.tags.style.display!=="none"){WAN3.tags.style.display="none";WAN3.tags.textContent="";WAN3.tags.__key="";}
  if(WAN3.mesh){r3Drop(WAN3.mesh);WAN3.mesh=null;WAN3.mkey="";}
  WAN3.cam=null;WAN3.t=0;
}
wan3Frame=hallCostWrap(wan3Frame);

/* ── кадр (28) ── */
function drawWanderRoom(){
  if(!G.wan||!wan3Ok()){wan3Hide();return;}
  try{wan3Frame();}catch(e){WAN3.err++;wan3Hide();throw e;}   /* сбой называет страж кадра (28) */
}
{const f0=drawWorldIn;drawWorldIn=function(){f0();if(WAN3.cn&&!(G.mode==="wanderer"&&G.wan&&wan3Ok()))wan3Hide();};}
