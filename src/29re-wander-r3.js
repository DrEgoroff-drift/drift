/* ══════════════ «Сорока» на движке (M851, docs/DESIGN-rooms.md §4) ══════════════
   Коридор внутри хребта парусника — сценой рендера интерьеров 27f2 во весь экран под приборами. Логика не
   правится: шаг по коридору, покупка, прилавок сырья, отплытие — 24c-mode-wanderer и пульт 26d; здесь только
   как это выглядит. Проход «СР · Визуал» 22.10: антикварная лавка внутри парусника, а не щиты с сукном.

   ПРАВИЛА ФАЙЛА:
   1. Мерило — человек 1.75 м. Коридор 3 м шириной, потолок 2.6 — низкий, долгий; шпангоуты из бруса через
      2.5 м — ритм и глубина; витрины — шкафы с глубиной (.3 м), на комодах, по стенам вперемежку (чёт — левая);
      в конце стойка хранителя, за ней шторы, подвязанные к бокам, и между ними щель на край планеты.
      Курсор — это где вы стоите: объектив идёт по коридору к витрине курсора и плывёт, а не прыгает.
   2. Свет — один тон, один спор. Тон — тёплое дерево и латунь: фонари под потолком (пыль в их конусах), капюшон
      над вещью в каждом ближнем шкафу, лампа хранителя над гроссбухом. Спор — холод планеты в щели: кладёт
      полосу по палубе и кромку на латунь. Зелёного в кадре одно место — абажур банкирской лампы. Ничего не
      светит в потолок: потолок — тёмное крыло, самое светлое в кадре — вещь курсора и щель.
   3. Купленная вещь оставляет пустую витрину с меловой биркой: дыра и есть память. Цена — мелом, словом у
      витрины (табличка DOM, как в других комнатах), не на холсте.
   4. Хранитель — тело генератора (27f3) в жилете клерка, руки на стойке, смотрит на вас; голова против щели,
      лицо — свой малый ключ, иначе силуэт. Последний час — вспышка спички у его руки, один раз.
   5. 2D-«Сороки» нет (22.10, автор: «2D не должно быть»): художник 24c-mode-wanderer-draw удалён. Без видеокарты
      кадра нет — плашка «нет WebGPU» (08b2); сбой кадра называет страж (28-loop). */
const WAN3={cn:null,tags:null,mesh:null,mkey:"",err:0,frames:0,S:null,vp:null,sz:null,meas:null,cam:null,t:0};
/* «Сорока» говорит у хранителя: строка say() встаёт табличкой у якоря «keeper» (08bj HANG_MSG_AT), его кладёт wan3Frame */
HANG_MSG_AT.wanderer="keeper";
const WAN3_L=-1.5,WAN3_R=1.5,WAN3_H=2.6,WAN3_F=3.4,WAN3_B=-10.6;
const WAN3_CZ=-9.3,WAN3_KZ=-9.95;   /* стойка и где стоит хранитель */
const WAN3_WIN=[-1.15,1.15,1.78,2.3];   /* щель над стойкой: x0, x1, y0, y1 — голова хранителя против неё */
const WAN3_LAMP=[-.44,1.42,WAN3_CZ-.04];   /* колба банкирской лампы над гроссбухом */
const WAN3_LANT=[[-.55,-1.4],[.55,-5.8]];   /* фонари под потолком: x, z; первый качается (часть 1) */
const WAN3_M=new Float32Array(R3_MAXI*R3_PART*16),WAN3_OT=new Float32Array(R3_MAXI*R3_PART*4);
/* висящее на леере: x, z крюка и часть сетки (качается своей матрицей): фонарь, бухта троса, пустая клетка */
const WAN3_HANG=[[-.55,-1.4,1],[.62,-3.3,2],[-.6,-7.4,3]];
const WAN3_BRASS=[176,142,82],WAN3_DARK=[46,33,25],WAN3_FELT=[40,44,54];

/* витрина i: стена (чёт — левая, side −1), глубина z середины. Шкаф развёрнут к идущему на 35°: прямо
   вдоль стены его видно только ребром, и вещи на полке не читаются. A — местные оси шкафа (+z — лицом
   в коридор), pt(p) — местная точка в мир */
const WAN3_TURN=.61;
function wan3Case(i){const side=i%2===0?-1:1,z=.6-i*1.25,x=side*(WAN3_R-.32),yaw=-side*(Math.PI/2-WAN3_TURN);
  const A=r3Xf([x,0,z],yaw);return {side,z,x,yaw,A,pt:p=>r3Pt(A,p)};}

/* ── вещь на полке: одно тело, латунь и бумага; местные оси — +z к коридору, y=0 — полка ── */
function wan3Item(K,lot){
  const P=R3P,Mb=K.mt(WAN3_BRASS,.78,12,P.brushed),Md=K.mt([98,74,30],.62,10,P.brushed),Mk=K.mt([38,40,46],.42,8,0);
  const Mpa=K.mt([217,207,174],.08,3,0),Mle=K.mt([58,49,40],.3,6,P.leather),Mwd=K.mt([92,64,40],.3,7,P.wood);
  const id=lot.cat?lot.cat.id:lot.id,fam=lot.fam;
  if(fam==="paper"){   /* карта области: гармошка из пяти листов стоит полураскрытой на латунной подставке, красная нить маршрута */
    K.box([0,.004,-.02],[.16,.004,.05],Mwd,.002);
    for(let k=0;k<5;k++){const x=-.16+k*.08,tilt=(k%2?-1:1)*.42;K.push([x+.04,.01,0],0,0,0);K.push([0,0,0],tilt);
      K.box([0,.075,0],[.0015,.075,.058],Mpa,0);
      if(k===2)K.box([0,.09,.002],[.0005,.004,.05],K.mt([150,48,36],.2,3,0),0);
      if(k===1)K.ell([0,.1,.002],[.0005,.012,.012],K.mt([90,70,40],.1,3,0),4,8);
      K.pop();K.pop();}
    return;}
  if(fam==="wild"){    /* свёрток под сукном: ком со складками, бечёвка крестом, бирка на ней */
    K.push([0,0,0],.4);
    K.lathe([[0,.0],[.17,.012],[.19,.06],[.17,.12],[.11,.17],[.05,.2],[0,.205]],14,K.mt([112,96,74],.1,3,P.cloth));
    const ring=[];for(let a=0;a<=20;a++){const t=a/20*TAU;ring.push([Math.cos(t)*.185,.07+.01*Math.sin(t*3),Math.sin(t)*.185]);}
    K.tube(ring,.004,K.mt([160,140,100],.2,4,0),4);
    K.tube([[-.16,.09,0],[0,.21,0],[.16,.09,0]],.004,K.mt([160,140,100],.2,4,0),4);
    K.pop();K.push([.14,.08,.12],0,-.3,.4);K.box([0,0,0],[.04,.025,.002],Mpa,.001);K.pop();return;}
  if(fam==="cosm"){    /* отделка борта: банка лака с открытой крышкой, цвет внутри — от имени; кисть рядом */
    const r=rng(hashi((id||"").length,(lot.ru||"").length,0x7C05)),hue=r()*TAU,c=[128+110*Math.cos(hue),128+110*Math.cos(hue+2.1),128+110*Math.cos(hue+4.2)].map(v=>clamp(v,40,230));
    K.lathe([[0,.0],[.07,0],[.072,.01],[.07,.11],[.062,.12],[.058,.12]],16,K.mt([150,152,156],.7,11,P.brushed));
    K.lathe([[0,.108],[.056,.108]],12,K.mt(c,.55,10,0));
    K.push([.11,.012,.02],0,0,.35);K.lathe([[0,0],[.072,0],[.074,.012],[0,.012]],14,K.mt([150,152,156],.7,11,P.brushed));K.pop();
    K.push([-.1,.012,.05],.6,0,0);K.box([0,0,0],[.09,.008,.008],Mwd,.003);K.box([.1,0,0],[.03,.012,.014],K.mt(c,.2,4,0),.004);K.pop();return;}
  switch(id){
    case "bell":{   /* судовой колокол на скобе: раструб с губой, талия, плечо, корона-ушко; язык виден снизу */
      K.box([0,.006,0],[.15,.006,.07],Mwd,.003);
      for(const sx of [-1,1])K.box([sx*.135,.14,0],[.012,.14,.012],Mwd,.004);K.box([0,.285,0],[.15,.012,.014],Mwd,.004);
      K.push([0,.03,0]);
      K.lathe([[0,.105],[.008,.112],[.02,.104],[.06,.074],[.13,.066],[.17,.058],[.19,.042],[.2,.022],[.205,0]],22,K.mt([108,78,36],.16,20,P.brushed));   /* тёмная полированная латунь: малый блик, не жёлтый пластик */
      K.lathe([[.012,.113],[.02,.105]],20,Md);K.tube([[0,.205,0],[0,.24,0]],.01,Md,6);
      K.tube([[0,.13,0],[0,.04,0]],.004,Md,4);K.ell([0,.035,0],[.016,.016,.016],Md,4,8);K.pop();break;}
    case "sextant":{const ps=[];for(let a=0;a<=12;a++){const t=Math.PI*(1.1+.8*a/12);ps.push([Math.cos(t)*.17,.2+Math.sin(t)*.17,0]);}
      K.tube(ps,.012,Mb,6);K.tube([[0,.2,0],[-.12,.06,0]],.008,Md,5);K.tube([[0,.2,0],[.13,.08,0]],.008,Md,5);
      K.ell([0,.2,0],[.022,.022,.015],Mk,4,8);K.box([0,.02,0],[.1,.02,.06],Mk,.006);break;}
    case "gyro":{   /* гирокомпас: латунная тарелка-основание, стойка, два кольца карданова подвеса, шар с картушкой */
      K.lathe([[0,0],[.1,0],[.105,.012],[.095,.022],[.03,.03],[.02,.08],[0,.08]],16,Mb);
      const c=[0,.17,0],r=.12;
      for(let k=0;k<2;k++){const ps=[];for(let a=0;a<=28;a++){const t=a/28*TAU;
          ps.push(k===0?[c[0]+Math.cos(t)*r,c[1]+Math.sin(t)*r,c[2]]:[c[0]+Math.cos(t)*r*.8*Math.cos(.5),c[1]+Math.sin(t)*r*.8,c[2]+Math.cos(t)*r*.8*Math.sin(.5)]);}
        K.tube(ps,k?.009:.012,Mb,6);}
      for(const s of [-1,1])K.ell([c[0]+s*r,c[1],c[2]],[.016,.016,.016],Md,4,8);
      K.ell(c,[.06,.06,.06],Mk,8,14);K.lathe([[0,.235],[.04,.232],[.05,.225]],12,K.mt([226,216,190],.1,3,0));
      K.push(c);K.lathe([[-.012,.062],[.012,.062]],14,Md);K.pop();break;}
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
    default:{   /* прочее (ящик конторы, книги): латунная шкатулка с крышкой, иногда с линзой — размер от имени */
      const r=rng(hashi((lot.ru||"").length,(id||"").length,0x7001)),w=.08+r()*.06,h=.05+r()*.06;
      K.box([0,h,0],[w,h,.07],Md,.012);K.box([0,h*1.6,0],[w-.008,h*.45,.072],Mb,.01);
      if(r()<.5)K.ell([w*.45,h,.072],[.03,.03,.012],Mk,4,10);}
  }
}

/* корабельный фонарь: латунная клетка со стеклом, колба тёплая своим светом; подвешен за кольцо в p */
function wan3Lantern(K,p,on){
  const Mb=K.mt([150,120,60],.62,10,R3P.brushed),Mg=K.mt([255,206,140],.6,10,R3P.glass,on?1.3:0,true),Mc=K.mt([255,214,160],.2,4,0,on?3:0,true);
  K.push(p);
  K.tube([[0,0,0],[0,-.09,0]],.005,Mb,5);K.lathe([[-.09,0],[-.1,.05],[-.12,.06],[-.13,0]],10,Mb);
  K.lathe([[-.13,.055],[-.2,.078],[-.34,.078],[-.4,.055]],10,Mg);
  for(let i=0;i<4;i++){const a=i/4*TAU;K.tube([[Math.cos(a)*.08,-.13,Math.sin(a)*.08],[Math.cos(a)*.08,-.41,Math.sin(a)*.08]],.006,Mb,4);}
  K.lathe([[-.4,.09],[-.42,.09],[-.43,.06],[-.46,.03],[-.47,0]],10,Mb);
  K.ell([0,-.26,0],[.028,.045,.028],Mc,5,8);
  K.pop();
}

/* ── сетка коридора (меняется, когда ушла вещь или сменилась стоянка) ── */
function wan3Mesh(S,lots){
  const K=r3Kit(),P=R3P,L=WAN3_L,R=WAN3_R,H=WAN3_H,F=WAN3_F,B=WAN3_B;
  const Mw=K.mt([96,76,58],.22,6,P.wood),Mfl=K.mt([84,66,52],.08,9,P.wood),Mce=K.mt([54,44,36],.18,5,P.wood);
  const Mcut=K.mt([16,16,18],.2,4,0),Mbr=K.mt(WAN3_BRASS,.7,12,P.brushed),Mdk=K.mt(WAN3_DARK,.32,7,P.wood);
  const Mfe=K.mt(WAN3_FELT,.04,3,P.cloth),Mst=K.mt([70,74,80],.55,10,P.brushed),Mwd=K.mt([112,82,52],.3,7,P.wood),Mbm=K.mt([64,48,36],.3,7,P.wood);
  K.part=0;
  /* коробка: задняя стена со щелью, стены, палуба, потолок; срез спереди тёмный */
  hallWall(K,L,R,0,H,B,[WAN3_WIN],K.mt([70,58,48],.2,6,P.wall));
  K.quad([L,0,F],[L,0,B],[L,H,B],[L,H,F],Mw,[1,0,0]);
  K.quad([R,0,B],[R,0,F],[R,H,F],[R,H,B],Mw,[-1,0,0]);
  K.quad([L,0,F],[R,0,F],[R,0,B],[L,0,B],Mfl,[0,1,0]);
  K.quad([L,H,B],[R,H,B],[R,H,F],[L,H,F],Mce,[0,-1,0]);
  K.box([0,-.15,F+.01],[R+.2,.15,.012],Mcut,0);K.box([0,H+.15,F+.01],[R+.2,.15,.012],Mcut,0);
  for(const s of [-1,1])K.box([s*(R+.1),H/2,F+.01],[.1,H/2+.3,.012],Mcut,0);
  /* щель: стекло узора window (край планеты), латунная рама с переплётом */
  {const [x0,x1,y0,y1]=WAN3_WIN,z=B;
    K.quad([x0,y0,z+.01],[x1,y0,z+.01],[x1,y1,z+.01],[x0,y1,z+.01],K.mt([3,3,3],.2,70,P.window,0,true),[0,0,1]);
    K.box([(x0+x1)/2,y0-.02,z+.04],[(x1-x0)/2+.04,.02,.04],Mbr,.006);K.box([(x0+x1)/2,y1+.02,z+.04],[(x1-x0)/2+.04,.02,.04],Mbr,.006);
    for(let i=0;i<=4;i++)K.box([x0+(x1-x0)*i/4,(y0+y1)/2,z+.03],[.012,(y1-y0)/2,.03],Mbr,.004);}
  /* палуба — доски к стойке, тёмно-винная дорожка посередине; у стен тёмный плинтус и латунная полоса */
  for(let x=L+.2;x<R;x+=.2)K.box([x,.0015,(F+B)/2],[.0035,.0015,(F-B)/2],K.mt([40,32,26],.1,4,0),0);
  K.box([0,.004,(F+WAN3_CZ)/2+.2],[.42,.003,(F-WAN3_CZ)/2-.45],K.mt([92,38,36],.05,3,P.cloth),.002);
  for(const s of [-1,1]){K.box([s*(R-.03),.05,(F+B)/2],[.03,.05,(F-B)/2],Mdk,.004);K.box([s*(R-.012),.11,(F+B)/2],[.006,.008,(F-B)/2],Mbr,0);}
  /* стены — панели со швами и поясом на высоте .95 (мерило человека); потолок — доски вдоль, тёмные */
  for(let z=F-.6;z>B;z-=1.25)for(const s of [-1,1])K.box([s*(R-.004),H/2,z],[.004,H/2,.006],K.mt([40,34,30],.2,4,0),0);
  for(const s of [-1,1])K.box([s*(R-.015),.95,(F+B)/2],[.015,.02,(F-B)/2],Mbm,.004);
  for(let x=-1.2;x<=1.21;x+=.3)K.box([x,H-.015,(F+B)/2],[.135,.015,(F-B)/2],K.mt([66,52,40],.22,6,P.wood),.005);
  /* шпангоуты: стойки и бимс из бруса через 2.5 м, латунные накладки в углах — коридор внутри хребта */
  for(let i=0;i<=4;i++){const z=1.225-i*2.5;if(z<WAN3_CZ+.4)break;
    for(const s of [-1,1])K.box([s*(R-.07),H/2,z],[.07,H/2,.07],Mdk,.012);
    K.box([0,H-.08,z],[R,.08,.075],Mdk,.012);
    for(const s of [-1,1])K.box([s*(R-.14),H-.17,z],[.02,.05,.085],Mbr,.006);}
  /* витрины — шкафы с глубиной: задняя стенка сукном, бока, верх и низ из тёмного дерева, полка-постамент,
     латунная рейка по переднему краю, капюшон лампы над вещью; под шкафом комод с двумя ящиками */
  lots.forEach((lot,i)=>{const C=wan3Case(i);K.pushM(C.A);
    K.box([0,1.4,-.31],[.42,.46,.012],Mdk,.004);
    K.box([0,1.4,-.3],[.37,.41,.003],Mfe,0);
    for(const sx of [-1,1])K.box([sx*.4,1.4,-.15],[.02,.46,.16],Mdk,.006);
    K.box([0,1.84,-.15],[.42,.025,.17],Mdk,.006);K.box([0,.96,-.15],[.42,.025,.17],Mdk,.006);
    K.box([0,1.0,-.18],[.3,.018,.11],Mwd,.004);
    K.box([0,.95,.015],[.42,.006,.006],Mbr,0);K.box([0,1.855,.015],[.42,.006,.006],Mbr,0);
    /* капюшон лампы: латунный козырёк под верхней доской, колба за ним — свет на вещь сверху-спереди */
    K.push([0,1.78,-.04],0,0,Math.PI/2);K.lathe([[-.14,.0],[-.14,.045],[.14,.045],[.14,0]],8,K.mt([150,120,60],.6,10,P.brushed));K.pop();
    K.ell([0,1.765,-.06],[.03,.016,.03],K.mt([255,222,170],.2,4,0,lot.empty?0:2.4,true),4,8);
    /* комод */
    K.box([0,.46,-.19],[.42,.46,.19],Mdk,.012);
    for(const dy of [.26,.66]){K.box([0,dy,.002],[.36,.15,.006],Mbm,.004);K.box([0,dy,.012],[.035,.01,.006],Mbr,.003);}
    K.push([0,1.018,-.19],0,0,0,1.7);   /* вещь крупнее модели: витрина её подаёт */
    if(lot.empty||lot.gone){   /* меловая бирка вместо вещи */
      K.push([0,.08,0],0,-.18,.06);K.box([0,0,0],[.11,.045,.004],K.mt([42,40,38],.2,4,0),.002);
      K.box([0,0,.005],[.08,.006,.001],K.mt([232,220,190],.1,3,0,.12),0);K.pop();}
    else wan3Item(K,lot);
    K.pop();K.pop();});
  /* тюки, ящики и бочка у стены напротив шкафа: пол не пуст до самой стойки, и фонарю есть на что светить */
  for(let k=0;k<6;k++){const r=rng(hashi(S.seed|0,k,0xBA1E)),s=k%2?-1:1,z=.6-k*1.25-.15+r()*.3,x=s*(R-.42);
    const u=r();if(u<.4)hallDrum(K,x,z,[118,86,50],[58,46,38]);   /* СР · Визуал: мешок зала читался серым комом — тёмный бочонок */
    else if(u<.75)hallCrate(K,x,0,z,.2+r()*.05,(r()-.5)*.5,K.mt([96,74,50],.25,6,P.wood));
    else hallDrum(K,x,z,[150,120,60],[70,60,52]);}
  /* стойка: тумба тёмного дерева с филёнками, столешница светлее, латунная кромка и подножка, гроссбух под лампой */
  {const z=WAN3_CZ;K.box([0,.48,z],[.7,.48,.3],Mdk,.016);
    for(const s of [-1,1])K.box([s*.34,.5,z+.305],[.26,.3,.008],Mbm,.006);
    K.box([0,.985,z],[.76,.025,.36],K.mt([120,86,56],.35,8,P.wood),.006);
    K.box([0,.975,z+.365],[.76,.012,.008],Mbr,0);K.tube([[-.7,.13,z+.44],[.7,.13,z+.44]],.014,Mbr,8);
    for(const s of [-1,1]){K.push([.1+s*.11,1.013,z+.04],-.06*s);K.box([0,0,0],[.11,.006,.15],K.mt([217,207,174],.08,3,0),.002);K.pop();}
    K.box([.1,1.008,z+.04],[.23,.004,.155],K.mt([86,52,40],.3,5,P.leather),0);
    /* банкирская лампа: латунное основание и стойка, зелёный стеклянный абажур — одно зелёное место кадра */
    const lx=WAN3_LAMP[0],lz=WAN3_LAMP[2];
    K.push([lx,1.01,lz]);K.lathe([[0,0],[.075,0],[.08,.012],[.05,.03],[.012,.04],[.012,.4],[0,.4]],14,Mbr);K.pop();
    K.tube([[lx,1.4,lz],[lx,1.48,lz],[lx,1.5,lz+.04]],.01,Mbr,6);
    /* СР · Визуал 22.10: абажур — купол, не ромб: профиль с изгибом, глянцевое стекло ловит блик, латунная кромка,
       нутро тёплое (свет лампы), зелёным светится только верх и слабо */
    K.push([lx,1.47,lz],0,0,Math.PI/2);
    K.lathe([[-.17,0],[-.165,.04],[-.14,.075],[-.09,.098],[0,.105],[.09,.098],[.14,.075],[.165,.04],[.17,0]],18,K.mt([26,72,48],.22,16,P.glass,.035));
    K.lathe([[-.16,.006],[-.135,.07],[0,.1],[.135,.07],[.16,.006]],14,K.mt([255,214,150],.5,6,0,.3,true));
    for(const sx of [-.17,.17])K.lathe([[sx-.006,0],[sx+.006,0],[sx+.006,.012],[sx-.006,.012]],14,Mbr);
    K.pop();
    K.ell([lx,1.44,lz],[.022,.03,.022],K.mt([255,214,150],.2,4,0,6,true),5,8);
    /* сорока на жёрдочке у края стойки: чёрная, белый бок, длинный хвост — герой рядом с хранителем */
    const bx=.62,by=1.01,bz=z-.02,Mk=K.mt([16,18,22],.5,12,0),Mw2=K.mt([226,226,222],.2,5,0),Mt=K.mt([22,34,52],.6,13,0);
    K.box([bx,by+.1,bz],[.012,.1,.012],Mwd,.004);K.box([bx,by+.2,bz],[.09,.008,.008],Mwd,.003);
    K.push([bx,by+.29,bz],-.5);
    K.ell([0,0,0],[.05,.055,.08],Mk,6,12);K.ell([.028,-.01,0],[.03,.04,.065],Mw2,5,10);K.ell([-.028,-.01,0],[.03,.04,.065],Mw2,5,10);
    K.ell([0,.055,.07],[.035,.035,.038],Mk,5,10);K.box([0,.05,.115],[.006,.006,.018],Mk,.002);
    K.push([0,0,-.1],0,.35);K.box([0,0,-.1],[.018,.006,.12],Mt,.004);K.pop();K.pop();}
  /* за стойкой: шторы тёмно-винного бархата, подвязанные к бокам (между ними — щель), латунный карниз;
     по бокам полки с банками, шлем хранителя над ними */
  {const Mcu=K.mt([104,30,30],.06,3,P.cloth);
    for(const s of [-1,1])K.surf(14,24,(u,v)=>{const y=2.32-v*2.27,pin=1-.5*Math.exp(-Math.pow((v-.5)/.07,2)),x=s*(.66+u*.44*pin+(1-pin)*.1),
        z=B+.14+(.04*Math.sin(u*TAU*3+s)+.012*Math.sin(u*TAU*8))*pin;return [[x,y,z]];},Mcu);
    K.tube([[-1.22,2.36,B+.14],[1.22,2.36,B+.14]],.014,Mbr,8);
    for(const s of [-1,1]){const ring=[];for(let a=0;a<=12;a++){const t=a/12*TAU;ring.push([s*.86+Math.cos(t)*.06,1.17+Math.sin(t)*.03,B+.19+Math.sin(t)*.05]);}K.tube(ring,.006,Mbr,5);}
    for(const s of [-1,1]){const x=s*1.32;
      for(const y of [1.1,1.5,1.9]){K.box([x,y,B+.13],[.16,.012,.12],Mwd,.003);
        for(let j=0;j<3;j++){const r=rng(hashi(j,y*10|0,s+5))();K.push([x-.1+j*.1,y+.012,B+.12]);
          K.lathe([[0,.03],[.07+r*.05,.032],[.08+r*.05,.02],[.095+r*.05,.022]],10,K.mt([[120,150,90],[150,96,60],[110,120,150]][j],.85,13,P.glass));K.pop();}}}
    K.ell([1.32,2.16,B+.2],[.13,.14,.13],K.mt([138,146,153],.6,10,P.brushed),8,12);
    K.ell([1.32,2.16,B+.31],[.085,.07,.03],K.mt([150,196,214],.85,14,P.glass),6,10);
    K.tube([[1.32,2.3,B+.15],[1.32,2.36,B+.04]],.008,Mst,5);}
  /* леер под потолком и что на нём висит: фонарь, бухта троса, пустая клетка (дверца открыта — сорока на стойке);
     каждая вещь — своя часть сетки, качается медленно. Второй фонарь — на крюке, не качается */
  const Mro=K.mt([150,140,120],.2,4,0);
  for(const s of [-1,1])K.tube([[s*.6,H-.1,F-.4],[s*.6,H-.1,WAN3_CZ+.8]],.007,Mro,5);
  WAN3_HANG.forEach(([x,z,part],k)=>{K.part=part;const y=H-.1;
    if(k===0){K.tube([[x,y,z],[x,y-.1,z]],.004,Mro,4);wan3Lantern(K,[x,y-.1,z],true);}
    else if(k===1){K.tube([[x,y,z],[x,y-.16,z]],.004,Mro,4);K.push([x,y-.3,z],0,0,Math.PI/2);
      K.lathe([[-.07,.08],[-.05,.13],[.05,.13],[.07,.08]],12,K.mt([150,136,100],.15,4,P.cloth));K.pop();
      for(let j=0;j<4;j++){const t=j/4*TAU;K.tube([[x+Math.cos(t)*.09,y-.17,z+Math.sin(t)*.09],[x+Math.cos(t)*.13,y-.3,z+Math.sin(t)*.13],[x+Math.cos(t)*.09,y-.43,z+Math.sin(t)*.09]],.012,K.mt([160,146,108],.15,4,P.cloth),5);}}
    else{K.tube([[x,y,z],[x,y-.14,z]],.004,Mro,4);const Mc=K.mt([150,120,60],.6,10,P.brushed),r0=.12;
      K.lathe([[-.14,0],[-.14,r0*.5],[-.17,r0],[-.2,r0]],10,Mc);
      for(let j=0;j<8;j++){const t=j/8*TAU;if(j===2)continue;K.tube([[x+Math.cos(t)*r0,y-.2,z+Math.sin(t)*r0],[x+Math.cos(t)*r0,y-.5,z+Math.sin(t)*r0]],.003,Mc,3);}
      K.push([x,y-.5,z]);K.lathe([[0,r0],[-.015,r0+.01],[-.03,r0]],10,Mc);K.lathe([[-.03,0],[-.03,r0-.01]],10,K.mt([60,50,40],.3,5,P.wood));K.pop();
      K.tube([[x+Math.cos(.78)*r0,y-.2,z+Math.sin(.78)*r0],[x+Math.cos(1.2)*r0*1.6,y-.32,z+Math.sin(1.2)*r0*1.6]],.003,Mc,3);}
    K.part=0;});
  const l2=WAN3_LANT[1];K.tube([[l2[0],H,l2[1]],[l2[0],H-.1,l2[1]]],.005,Mro,4);wan3Lantern(K,[l2[0],H-.1,l2[1]],true);
  return K.pack();
}

/* ── хранитель: тело генератора с постоянным геном, жилет и галстук клерка (CP_KIT.clerk), бирка в латунь ── */
function wan3Keeper(){let s=hashi(0x50A0,0xCA,0x7EE9)>>>0;
  for(let i=0;i<12;i++){const g=cpGene({seed:s,loy:60,traits:[]});if(g&&!g.ai)break;s=(Math.imul(s,1103515245)+12345)>>>0;}
  return {seed:s,loy:60,traits:[],role:"clerk",acc:WAN3_BRASS};}

function wan3Scene(S,lots,cam,t,cur){
  const M=WAN3_M,OT=WAN3_OT,I=r3Xf([0,0,0]),B=WAN3_B,dark=!!S.dark;
  for(let i=0;i<R3_MAXI*R3_PART;i++)M.set(I,i*16);OT.fill(0);
  /* висящее качается: длинные периоды, у каждого свой — дрейф, не маятник */
  const sw=[];
  WAN3_HANG.forEach(([x,z,part],k)=>{const a=.04*Math.sin(t*(.21+k*.07)+k*1.7),b=.03*Math.sin(t*(.17+k*.05)+k);sw.push([a,b]);
    M.set(r3Pivot(I,[x,WAN3_H-.1,z],0,b,a),part*16);});
  const draws=[[WAN3.mesh,0,1]],m=wan3Keeper(),mesh=cpMesh(m,"bar",1);
  win3Man(M,1,m,mesh,r3Xf([0,0,WAN3_KZ],0),t,cam.eye);draws.push([mesh,1,1]);
  OT.set([0,WAN3_KZ,.32,.6],(1*R3_PART+R3_PART-1)*4);   /* контактная тень под ногами и холодная кромка силуэта */
  const lights=[],bulbs=[],nz=v=>{const l=Math.hypot(...v);return v.map(x=>x/l);};
  /* ключ — банкирская лампа над гроссбухом, с тенью; тёплая, зелёное — только стекло абажура */
  lights.push({p:[WAN3_LAMP[0],WAN3_LAMP[1],WAN3_LAMP[2]],range:4,c:r3Sc(r3Lin([255,214,156]),2.3),spot:1,d:[.12,-1,.08],
    cosO:Math.cos(.85),cosI:Math.cos(.4),shadow:1,vol:.05,key:1});bulbs.push([WAN3_LAMP[0],WAN3_LAMP[1],WAN3_LAMP[2],.5]);
  /* лицо хранителя — малый ключ сбоку-спереди: без него голова против щели — силуэт */
  {const h=[0,1.62,WAN3_KZ],q=[-1.1,2.1,WAN3_KZ+1.6],v=[h[0]-q[0],h[1]-q[1],h[2]-q[2]],Ln=Math.hypot(...v);
    lights.push({p:q,range:Ln+.4,c:r3Sc(r3Lin([255,214,170]),Ln*Ln*2.6),spot:1,d:v.map(x=>x/Ln),cosO:Math.cos(.22),cosI:Math.cos(.1),vol:0});}
  /* холод — край планеты в щели: конусом вдоль коридора к вам, полоса по палубе, кромка на латуни; с тенью */
  lights.push({p:[0,2.1,B+.25],range:16,c:r3Sc(r3Lin([140,186,236]),dark?2.4:4.6),spot:1,d:nz([0,-.22,1]),cosO:Math.cos(.66),cosI:Math.cos(.28),shadow:1,vol:.08});
  /* фонари под потолком: тёплые точки, пыль в их свете; ближний бросает тень (тюки и шкафы получают объём) */
  WAN3_LANT.forEach(([x,z],k)=>{const sx=k===0?sw[0][0]*.3:0,sz=k===0?sw[0][1]*.3:0,p=[x+sx,WAN3_H-.36,z+sz];
    lights.push({p,range:5.2,c:r3Sc(r3Lin([255,196,132]),dark?1.1:1.7),shadow:k===0?1:0,vol:.06});bulbs.push(p.concat(k===0?.55:.4));});
  /* капюшоны витрин: светят ближние к вам (до четырёх), на вещь сверху-спереди; у витрины курсора — с тенью */
  for(let i=cur,n=0;i<lots.length&&n<4;i++){const lot=lots[i];if(!lot||lot.empty)continue;n++;const C=wan3Case(i),p=C.pt([0,1.76,-.03]),q=C.pt([0,1.0,-.2]);
    lights.push({p,range:2,c:r3Sc(r3Lin([255,216,164]),i===cur?.9:.65),spot:1,d:nz([q[0]-p[0],q[1]-p[1],q[2]-p[2]]),cosO:Math.cos(.8),cosI:Math.cos(.35),shadow:i===cur?1:0,vol:0});
    if(bulbs.length<6)bulbs.push(C.pt([0,1.765,-.06]).concat(i===cur?.32:.2));}
  /* вспышка спички — последний час, один раз: тёплая точка у руки хранителя */
  if(S.flashT){const u=(clockNow()-S.flashT)/1500;if(u>=0&&u<1){const a=Math.sin(Math.PI*Math.min(1,u*4))*(1-u);
    lights.push({p:[.25,1.25,WAN3_CZ-.1],range:3.5,c:r3Sc(r3Lin([255,200,120]),8*a),vol:.03});}}
  /* заливка от разреза: слабый холод, чтобы ближняя витрина не была чёрной */
  lights.push({p:[0,1.9,WAN3_F+2],range:8,c:r3Sc(r3Lin([150,164,186]),.45),spot:1,d:[0,-.2,-.98],cosO:Math.cos(.8),cosI:Math.cos(.3),vol:0});
  const sys=G.sys,pl=(sys&&sys.planets&&S.w&&S.w.planetIx>=0)?sys.planets[S.w.planetIx]:null;
  const pal=(pl&&TYPES[pl.type])?TYPES[pl.type].pal:null,ac=pal?pal[Math.min(2,pal.length-1)]:[120,150,190];
  return {draws,vp:cam.vp,cam:cam.eye,t,lights:lights.slice(0,R3_MAXL),bulbs,
    sky:[...r3Lin([72,66,70]),.34],gnd:[...r3Lin([62,46,36]),.045],fog:[...r3Sc(r3Lin([34,36,50]),.22),.07],acc:[...r3Lin(ac),1],
    win:[WAN3_WIN[0],WAN3_WIN[2],WAN3_WIN[1],WAN3_WIN[3]],win2:[B,10,(S.seed%997)+t*.02,1],sgn:[0,0,0,0],sgn2:[B,0,0,0],
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
  const eye=wide?[-s*.45,1.6,Math.min(WAN3_F-.3,C.z+2.5)]:[-s*.85,1.5,Math.min(WAN3_F-.3,C.z+2.6)];
  const k=wide?.36:.06,near=C.pt([0,wide?1.2:.9,0]);
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
    out.push({p:C.pt([C.side>0?.3:-.3,.95,.02]),t,s:"",c:"sg",al:C.side>0?"r":""});}   /* внутри кромки витрины — на телефоне не рядом с ней */
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
