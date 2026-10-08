/* ══════════════ зал за экранами: обжитость (M810, проход 3) ══════════════
   Общая для всех типов одежда зала по грамматике 21pie: зал — рабочее место, не витрина.
   Трубы и кабельный лоток под потолком (кронштейны, оранжевые пояса), короб вентиляции с решётками,
   эмалевые таблички и знак опасности на пилястрах, бра-клетки, огнетушитель, ящики и мешки у торца
   стойки (передний план), бочки, разметка пола. Палитра — сталь, ржавчина, копоть, оранжевый, бетон:
   не один коричневый. Свет здесь не живёт (его считает сцена): бра — только свечение колбы. */
const HALL_PROP_C={steel:[118,124,132],rust:[128,70,44],soot:[42,40,38],orange:[226,118,38],concrete:[140,138,132],paint:[64,92,104]};

/* табурет бара: четыре разведённые ноги, подножка, малое сиденье — без круглого основания («постамента») */
function hallStool(K,x,z,yaw){
  const Mm=K.mt([96,100,106],.6,10,R3P.brushed),Ms=K.mt([70,40,32],.4,8,R3P.leather);
  K.push([x,0,z],yaw||0);
  for(let i=0;i<4;i++){const a=i/4*TAU+.785,c=Math.cos(a),s=Math.sin(a);
    K.tube([[c*.2,0,s*.2],[c*.12,.66,s*.12]],.012,Mm,5);}
  const ring=[];for(let i=0;i<=16;i++){const a=i/16*TAU;ring.push([Math.cos(a)*.165,.26,Math.sin(a)*.165]);}K.tube(ring,.009,Mm,5);
  K.lathe([[.66,0],[.665,.15],[.69,.165],[.73,.16],[.745,.1],[.75,0]],14,Ms);
  K.pop();
}

/* труба вдоль x: кронштейны к потолку, оранжевые пояса, фланцы стыков */
function hallPipe(K,x0,x1,y,z,r,M,hc,band){
  K.tube([[x0,y,z],[x1,y,z]],r,M,10);
  const Br=K.mt(HALL_PROP_C.soot,.5,8,R3P.brushed),Bd=K.mt(HALL_PROP_C.orange,.4,7,R3P.hazard);
  for(let x=x0+.6;x<x1-.2;x+=1.6){K.box([x,(y+hc)/2,z],[.012,(hc-y)/2,.012],Br,.004);
    K.push([x,y,z],0,0,Math.PI/2);K.lathe([[-.02,r+.012],[.02,r+.012]],10,Br);K.pop();}
  if(band)for(let x=x0+1.4;x<x1-.3;x+=3.2){K.push([x,y,z],0,0,Math.PI/2);K.lathe([[-.07,r+.004],[.07,r+.004]],10,Bd);K.pop();}
  for(let x=x0+2.4;x<x1-.3;x+=4.8){K.push([x,y,z],0,0,Math.PI/2);K.lathe([[-.018,0],[-.018,r+.03],[.018,r+.03],[.018,0]],12,M);K.pop();}
}

/* табличка на пилястре: эмаль, полоса цвета сверху, строки — тёмные штрихи */
function hallPlate(K,x,y,z,w,h,band,R){
  K.box([x,y,z],[w,h,.004],K.mt([212,206,190],.35,8,0),.003);
  K.box([x,y+h*.72,z+.003],[w,h*.2,.002],K.mt(band,.3,6,0),.001);
  for(let i=0;i<3;i++){const ww=w*(.4+R()*.45);K.box([x-w*.8+ww,y+h*(.15-i*.3),z+.004],[ww,.006,.001],K.mt([40,40,44],.2,4,0),0);}
}

/* бра-клетка: пластина, плафон-сетка, колба своим свечением (тёплая) */
function hallCage(K,x,y,z,e){
  const Md=K.mt(HALL_PROP_C.soot,.5,8,R3P.brushed);
  K.box([x,y,z],[.05,.08,.012],Md,.006);
  K.push([x,y-.02,z+.08]);
  K.ell([0,0,0],[.045,.06,.045],K.mt([255,214,160],.2,4,0,e,true),6,10);
  for(let i=0;i<4;i++){const a=i/4*TAU;K.tube([[Math.cos(a)*.055,-.07,Math.sin(a)*.055],[Math.cos(a)*.055,.06,Math.sin(a)*.055]],.003,Md,3);}
  K.lathe([[-.075,.05],[-.065,.058],[.06,.058],[.07,.03]],10,Md);
  K.pop();
  K.box([x,y,z+.04],[.008,.008,.04],Md,.003);
}

function hallSmudge(K,x,z,rx,rz,Mf,c){
  const n=18,ci=r3Lin(c),cm=r3Lin(mixc(c,Mf.c.map(v=>Math.pow(v,1/2.2)*255),.45)),co=Mf.c,N=[0,1,0],y=.0016;
  const at=(i,k)=>{const a=i/n*TAU,w=1+.18*Math.sin(a*3+x*7);return [x+Math.cos(a)*rx*k*w,y,z+Math.sin(a)*rz*k*w];};
  for(let i=0;i<n;i++){const a0=at(i,.5),a1=at(i+1,.5),b0=at(i,1),b1=at(i+1,1);
    K.vx([x,y,z],N,Mf,ci);K.vx(a1,N,Mf,cm);K.vx(a0,N,Mf,cm);
    K.vx(a0,N,Mf,cm);K.vx(a1,N,Mf,cm);K.vx(b1,N,Mf,co);K.vx(a0,N,Mf,cm);K.vx(b1,N,Mf,co);K.vx(b0,N,Mf,co);}
}
function hallClutter(K,L,R){
  const T=L.T,P=R3P,hc=T.hc,B=HALL_B,X0=HALL_L,X1=L.R,C=HALL_PROP_C,dk=!!T.dark;
  const xEnd=L.bar?HALL_XB-4.6:X1;   /* общая одежда — до бара; у бара своя */
  const St=K.mt(C.steel,.65,10,P.brushed),Ru=K.mt(C.rust,.35,7,P.brushed),Pt=K.mt(C.paint,.5,8,P.brushed);
  /* трубы вдоль задней стены под потолком: стальная, крашеная, тонкая ржавая */
  if(L.st!=="indust"){
    hallPipe(K,X0,xEnd,hc-.2,B+.16,.055,St,hc,true);
    hallPipe(K,X0,xEnd,hc-.33,B+.3,.038,Pt,hc,false);
    hallPipe(K,X0,HALL_WIN[0]-.7,hc-.43,B+.14,.025,Ru,hc,false);
    /* стояк в углу: вниз к вентилю (красное колесо) */
    K.tube([[X0+.35,hc-.2,B+.16],[X0+.35,1.15,B+.16]],.055,St,10);
    const wh=[];for(let i=0;i<=18;i++){const a=i/18*TAU;wh.push([X0+.35+Math.cos(a)*.12,1.35+Math.sin(a)*.12,B+.3]);}
    K.tube(wh,.012,K.mt([170,44,34],.4,7,0),5);K.tube([[X0+.35,1.35,B+.16],[X0+.35,1.35,B+.3]],.015,St,5);}
  /* кабельный лоток поперёк зала: полка, борта, пучок кабелей (чёрный, серый, оранжевый) */
  {const y=Math.min(hc-.32,3.6),z=.75,len=(xEnd-X0)/2,cx=(X0+xEnd)/2,Tr=K.mt(mixc(C.steel,[96,80,62],.55),.3,8,P.brushed);   /* тёплая оцинковка, матово: днём лоток не спорит с лампой-ключом */
    K.box([cx,y,z],[len,.006,.15],Tr,.002);for(const s of [-1,1])K.box([cx,y+.035,z+s*.15],[len,.035,.005],Tr,.002);
    [[22,22,24],[90,92,96],C.orange].forEach((c,i)=>K.tube([[X0,y+.025,z-.07+i*.06],[xEnd,y+.025,z-.07+i*.06]],.014+.004*(i===0),K.mt(c,.3,6,P.leather),6));
    for(let x=X0+.8;x<xEnd;x+=2.0)for(const s of [-1,1])K.tube([[x,y,z+s*.16],[x,hc,z+s*.16]],.006,K.mt(C.soot,.5,8,P.brushed),4);}
  /* короб вентиляции над доской (в высоких залах): решётки — тёмные рёбра */
  if(hc>=3.5){const y=Math.min(hc-.65,3.4),x0=X0+.2,x1=HALL_WIN[0]-.75,Du=K.mt(mixc(C.steel,C.concrete,.4),.5,9,P.brushed);
    K.box([(x0+x1)/2,y,B+.2],[(x1-x0)/2,.16,.2],Du,.015);
    for(let x=x0+.7;x<x1-.3;x+=1.4){K.box([x,y,B+.405],[.24,.11,.004],K.mt(C.soot,.4,7,0),.003);
      for(let k=0;k<5;k++)K.box([x,y-.08+k*.04,B+.41],[.23,.006,.006],Du,.002);}}
  /* пилястры окна: бра, таблички, знак опасности, огнетушитель (у окна: справа от пилястры он стоял посреди кадра конторы) */
  const pl=[HALL_WIN[0]-.45,HALL_WIN[1]+.45];
  for(const x of pl)hallCage(K,x,Math.min(hc-.5,2.3),B+.2,dk?1.4:2.4);
  hallPlate(K,pl[0],1.62,B+.205,.1,.13,C.orange,R);
  K.box([pl[1],1.62,B+.205],[.1,.1,.004],K.mt([210,160,40],.4,7,P.hazard),.003);
  K.push([pl[1]-.25,0,B+.12]);K.lathe([[.18,0],[.19,.075],[.62,.075],[.68,.05],[.72,.02],[.73,0]],12,K.mt([176,36,28],.6,10,0));
  K.tube([[0,.7,.03],[.06,.6,.08],[.07,.3,.09]],.008,K.mt(C.soot,.3,6,P.leather),4);K.box([0,.4,-.07],[.04,.02,.02],K.mt(C.soot,.5,8,P.brushed),.004);K.pop();
  /* у торца стойки, первым планом: штабель ящиков, мешки, крашеный стальной контейнер */
  {const Wd=K.mt([108,84,58],.3,6,P.wood),Cn=K.mt(mixc(C.orange,C.rust,.35),.45,8,P.brushed);
    hallCrate(K,-5.05,0,3.25,.3,.12,Wd);hallCrate(K,-5.0,.6,3.2,.22,-.2,Wd);hallCrate(K,-4.55,0,3.75,.24,.4,Wd);
    K.push([-5.3,0,4.25],.1);K.box([0,.32,0],[.42,.32,.3],Cn,.02);K.box([0,.66,0],[.43,.012,.31],K.mt(C.soot,.4,7,P.brushed),.006);
    for(const s of [-1,1])K.box([s*.42,.32,0],[.006,.3,.24],K.mt(mixc(C.orange,C.soot,.3),.4,7,P.brushed),.004);
    K.box([0,.45,.305],[.16,.05,.003],K.mt([212,206,190],.3,6,0),.002);K.pop();
    hallSack(K,-4.85,1.04,3.1,.15,R);hallSack(K,-4.25,.1,4.3,.18,R);hallSack(K,-4.0,.1,4.0,.15,R);}
  /* бочки: ржавая и стальная у правой пилястры (если там не бар), ещё одна у левой стены */
  if(!L.bar&&L.st!=="fuel"){hallDrum(K,X1-.55,-2.3,C.orange,C.rust);hallDrum(K,X1-1.15,-2.35,C.orange,C.steel);}
  hallDrum(K,X0+.5,-1.55,C.orange,C.paint);
  /* пол — тоже тело: швы плит, затёртая дорожка у стойки и к доске, пятна масла у бочек и под верстаком */
  {const Js=K.mt([46,46,48],.1,3,0),x1=xEnd-.05;
    for(let z=B+1.2;z<HALL_F;z+=1.2)K.box([(X0+x1)/2,.0012,z],[(x1-X0)/2,.0008,.006],Js,0);
    for(let x=X0+1.2;x<x1;x+=1.2)K.box([x,.0012,(B+HALL_F)/2],[.006,.0008,(HALL_F-B)/2],Js,0);
    /* пятна — плоский веер в материале пола: середина своей краски, край ровно в цвет пола (без кромки) */
    const rough=T.win===1||T.weld||T.dark,fc=rough?[92,90,86]:mixc(T.wall,[100,92,82],.5),Mf=K.mt(fc,rough?.25:.32,rough?6:7,P.floor);
    hallSmudge(K,-4.25,.5,.42,2.3,Mf,mixc(fc,[176,170,158],.3));hallSmudge(K,-3.0,-.7,.6,.45,Mf,mixc(fc,[176,170,158],.25));
    for(const s of [[X0+.7,-1.2,.5,.36,.5],[-.9,-1.9,.36,.26,.45],[1.6,-1.7,.3,.42,.3],[-2.2,2.7,.6,.38,.3],[.4,1.1,.24,.18,.4]])
      hallSmudge(K,s[0],s[1],s[2],s[3],Mf,mixc(fc,[26,24,22],s[4]));}
  /* разметка: линия прохода вдоль стойки, «зебра» у окна */
  const Hz=K.mt([200,150,40],.35,7,P.hazard),Ln=K.mt([132,120,84],.15,4,0);
  K.box([-3.95,.0025,1.2],[.03,.002,3.6],Ln,0);
  K.box([(HALL_WIN[0]+HALL_WIN[1])/2,.0025,-1.45],[(HALL_WIN[1]-HALL_WIN[0])/2+.3,.002,.05],Hz,0);
}
