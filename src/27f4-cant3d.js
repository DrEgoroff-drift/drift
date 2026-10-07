/* ══════════════ кантина в объёме (M725) ══════════════
   Автор, 07.10: «2d не должно быть». Зал — сцена 27f2 в метрах: стойка, полка с бутылками на подсветке,
   окно наружу, неоновая вывеска, лампы на шнурах с конусами и тенями, табуреты, столики, реквизит станции;
   люди — модели 27f3 с тем же геном, что и портрет.

   ПРАВИЛА ФАЙЛА:
   1. Камера — посетитель у входа, на высоте глаз (1.45 м), смотрит на стойку. Ширина кадра решает,
      сколько стойки видно (на телефоне — середина), высота кадра людей не мельчит: кандидат на
      табурете — ~11 % высоты зала головой на ПК.
   2. Кандидаты сидят на табуретах ПЕРЕД стойкой лицом к залу (спиной к бармену): их выбирают, значит
      лицо — к нам. Поза — от зерна (стакан на колене, локти на стойке, руки скрещены, локти на коленях).
   3. Свет — планировка CANT_LIGHT (сколько ламп, какого тона, ширина конуса), а не ровная заливка:
      лампы над стойкой бросают тени, дым видно только в их конусах; окно и вывеска светят своим.
      На кино лампы гаснут, луч проектора режет дым, полотно освещает затылки.
   4. Выбор и наведение — кромка акцентом по силуэту (ot.x), а не рамка. Подписи (имя над выбранным,
      дела над столиками, слово бармена) — выпечка поверх тона, в CSS-пикселях, не мылится.
   5. Попадания — проекция тех же точек (макушка, таз, плечи), что рисуются: тыкают в человека, а не
      в прямоугольник на глазок. Без видеокарты (Node) считается только это. */
const C3={L:null,lkey:"",room:null,rkey:"",tabs:[],sign:null,skey:"",film:null,fT:0,story:null,sT:-1e9,tick:0};
const C3_VIEW={dock:0,foundry:1,slip:2,stars:3,dust:4};
/* толпа: места (x, z, поза, куда смотрит x, z) и кто из них занят по типу станции */
const C3_SLOT=[[3.0,-.75,"mug",3.5,-1.1],[4.0,-.7,"stand",3.5,-1.1],[3.5,-1.72,"mug",3.5,-1.1],[-3.35,.32,"lean",-2.2,-.4],[-3.95,-.55,"stand",-3,.2],
  [3.9,.82,"table",4.35,1.27],[4.78,1.66,"table",4.35,1.27],[2.75,-2.15,"stand",3.5,-1.1],[-4.45,1.15,"lean",0,4]];
const C3_CROWD={trade:[0,1,3,5,2,7],indust:[0,1,2,3,4,5,6,7,8],yard:[0,1,3,7,5],sci:[5,3],outpost:[0,4,6]};
const C3_CL=-3.0,C3_CR=2.4,C3_TOP=1.08,C3_BACK=-2.8;
const C3_STORY={corner:[-3.0,.55,"stand"],far:[3.15,-1.95,"stand"],end:[2.85,.42,"mug"],door:[-3.6,-1.45,"stand"]};
/* камера по пропорции кадра: полуширина видимого у стойки — от 2.4 м (телефон) до 3.3 (ПК) */
function c3Cam(cssW,cssH){
  const asp=cssW/Math.max(1,cssH),hw=2.4+.9*clamp((asp-1.6)/1.2,0,1),eye=[0,1.45,4.7],tgt=[-.2,1.15,-.6];
  const d=eye[2]-0,fy=2*Math.atan(hw/d/asp);
  const vp=r3Mul(r3Persp(fy,asp,.1,40),r3Look(eye,tgt,[0,1,0]));
  const hwAt=z=>(eye[2]-z)*Math.tan(fy/2)*asp;
  return {eye,tgt,fy,asp,vp,hwAt};
}
/* сидячие места кандидатов: кучно у середины стойки */
function c3Seats(n){const step=Math.min(.8,(C3_CR-C3_CL-1)/Math.max(1,n)),c0=-.35,out=[];
  for(let i=0;i<n;i++)out.push(c0+(i-(n-1)/2)*step);return out;}
/* раскладка зала: где кто сидит и стоит; чистый JS — попадания считаются и без видеокарты */
function c3Layout(cssW,cssH,list,deals,folk){
  const st=(G.st&&G.st.stype)||"trade",S=cantStyle(),seed=(G.sys.seed^0xCA47)>>>0,cam=c3Cam(cssW,cssH);
  const K9=(typeof kinoHere==="function")?kinoHere():null,tree=typeof holTreeUp==="function"&&holTreeUp();
  if(!C3.story||now()-C3.sT>3000||now()<C3.sT){C3.story=(typeof storyCantScene==="function")?storyCantScene():[];C3.sT=now();}
  const L={st,S,seed,cam,K9,tree,acc:hex2rgb(S.acc),people:[],tables:[],seats:c3Seats(list.length),stories:C3.story};
  /* кандидаты */
  list.forEach((m,i)=>L.people.push({id:m.id,m,pose:"stool"+((m.seed>>>5)&3),x:L.seats[i],z:.36,yaw:0,lod:1,kind:"cand"}));
  /* бармен — в самом широком просвете между сидящими */
  const st0=L.seats.concat([C3_CL+.2]).sort((a,b)=>a-b);let best=-1,bx=-1.6;
  for(let i=0;i<=st0.length;i++){const a=i===0?C3_CL+.3:st0[i-1],b=i===st0.length?C3_CR-.4:st0[i];if(b-a>best){best=b-a;bx=(a+b)/2;}}
  L.bx=clamp(bx,C3_CL+.6,C3_CR-.6);
  L.people.push({id:"counter",m:cantKeeper(),pose:"bar",x:L.bx,z:-1.0,yaw:0,lod:1,kind:"keep"});
  /* завсегдатай у двери */
  if(folk&&typeof FOLK!=="undefined"&&FOLK[folk.id])
    L.people.push({id:"folk:"+folk.id,m:{seed:hashi(seed,0xF01C,folk.id.length)>>>0,loy:60,traits:[]},pose:"lean",x:-3.85,z:-1.9,yaw:.35,lod:1,kind:"folk"});
  /* столики с делами: на переднем плане по краям */
  const nT=Math.min(3,(deals||[]).length),TP=[[-.62,2.0],[.62,2.05],[-.9,1.0]];
  for(let i=0;i<nT;i++){const d=deals[i],z=TP[i][1],x=TP[i][0]*cam.hwAt(z);
    L.tables.push({id:"deal:"+d.key,d,x,z,seed:hashi(d.seed||1,i*97,0x7AB)>>>0});
    L.people.push({id:"deal:"+d.key,m:{seed:hashi(d.seed||1,i,0xDEA1)>>>0,loy:50,traits:[]},pose:"table",x,z:z-.46,yaw:0,lod:1,kind:"deal"});}
  /* толпа — или ряды зрителей на кино */
  const cr=C3_CROWD[st]||C3_CROWD.trade;
  if(K9){const n=Math.min(cr.length+2,9);
    for(let i=0;i<n;i++){const row=i<5?0:1,x=(i-(row?7:2))*.78+(row?.39:0);
      L.people.push({id:null,m:{seed:hashi(seed,i,0xC0D)>>>0,loy:50+i*5,traits:[]},pose:"chair",x,z:1.55+row*.85,yaw:Math.PI,lod:0,kind:"kino"});}
  }else for(const k of cr){const s=C3_SLOT[k];
    L.people.push({id:null,m:{seed:hashi(seed,k,0xC0D)>>>0,loy:40+k*6,traits:[]},pose:s[2],x:s[0],z:s[1],yaw:Math.atan2(s[3]-s[0],s[4]-s[1]),lod:0,kind:"crowd"});}
  /* люди историй: по месту сцены */
  for(const sc of L.stories){if(!sc.figure)continue;const p=C3_STORY[sc.seat]||C3_STORY.far;
    L.people.push({id:null,m:{seed:hashi(seed,(sc.seat||"x").length*31,0x5707)>>>0,loy:50,traits:[]},pose:p[2],x:p[0],z:p[1],yaw:Math.atan2(-p[0]*.3,2),lod:0,kind:"story",dim:sc.dim?.55:.15});}
  L.people=L.people.slice(0,R3_MAXI-1-L.tables.length);
  /* сетки людей (кэш 27f3) */
  for(const p of L.people)p.mesh=cpMesh(p.m,p.pose,p.lod);
  L.rkey=st+"|"+seed+"|"+L.seats.length+"|"+(K9?1:0)+"|"+(tree?1:0)+"|"+L.bx.toFixed(2)+"|"+L.stories.map(s=>(s.props||[]).join(",")+":"+s.seat).join(";");
  return L;
}
/* ── сборка зала: всё неподвижное — одна сетка; лампы, вентилятор, голограмма — свои части ── */
function c3Bottle(K,x,y,z,kind,col,R){
  const M=K.mt(col,.9,13,R3P.glass),h=.2+R()*.12,r=kind===1?.045:kind===2?.038:.032;
  K.push([x,y,z],R()*TAU);
  if(kind===2){K.box([0,h*.4,0],[r,h*.4,r*.45],M,r*.4);K.lathe([[h*.8,r*.3],[h*.95,r*.25],[h*1.02,r*.25]],8,M);}
  else K.lathe([[0,0],[.002,r],[h*(kind===1?.45:.62),r],[h*(kind===1?.7:.74),r*.42],[h*.95,r*.3],[h*1.02,r*.3]],kind===1?12:10,M);
  K.lathe([[h*1.0,r*.33],[h*1.06,r*.33],[h*1.07,0]],6,K.mt([40,30,24],.2,4,0));
  if(R()<.75)K.lathe([[h*.25,r*1.02],[h*.42,r*1.02]],10,K.mt([226,214,180],.15,4,0));
  K.pop();
}
function c3Glass(K,liq,full){
  const G=K.mt([200,220,230],.9,13,R3P.glass);
  K.lathe([[0,0],[.001,.03],[.005,.032],[.09,.036],[.092,.034]],10,G);
  if(full)K.lathe([[.006,.028],[.055*full,.031],[.056*full,0]],10,K.mt(liq,.6,10,0));
}
function c3Stool(K,x,z){
  const Mm=K.mt([150,154,160],.8,12,R3P.brushed),Ms=K.mt([96,36,30],.45,8,R3P.leather);
  K.push([x,0,z]);
  K.lathe([[0,0],[.005,.2],[.02,.19],[.03,.04]],14,Mm);
  K.lathe([[.03,.03],[.7,.025]],8,Mm);
  const ring=[];for(let i=0;i<=20;i++){const t=i/20*TAU;ring.push([Math.cos(t)*.17,.3,Math.sin(t)*.17]);}K.tube(ring,.011,Mm,6);
  for(let i=0;i<3;i++){const t=i/3*TAU+.5;K.tube([[0,.3,0],[Math.cos(t)*.17,.3,Math.sin(t)*.17]],.008,Mm,5);}
  K.lathe([[.69,.0],[.7,.17],[.72,.195],[.77,.19],[.79,.12],[.795,0]],16,Ms);
  K.pop();
}
function c3Chair(K,x,z,yaw){
  const W=K.mt([70,48,34],.35,7,R3P.wood);
  K.push([x,0,z],yaw);
  K.box([0,.44,0],[.21,.025,.2],W,.012);
  for(const sx of [-1,1])for(const sz of [-1,1])K.box([sx*.18,.21,sz*.17],[.018,.21,.018],W,.006);
  K.box([0,.72,-.19],[.2,.12,.018],W,.01);
  for(const sx of [-1,1])K.box([sx*.18,.57,-.19],[.018,.15,.018],W,.006);
  K.pop();
}
function c3RoundTable(K,x,z,top,r,M){
  K.push([x,0,z]);
  K.lathe([[0,0],[.005,.26],[.03,.24],[.05,.05],[top-.05,.045],[top-.03,.07]],14,K.mt([40,40,44],.7,10,R3P.brushed));
  K.lathe([[top-.03,0],[top-.025,r],[top,r+.005],[top+.012,r],[top+.014,0]],24,M);
  K.pop();
}
/* лампа: шнур, абажур снаружи тёмный, внутри эмаль, колба своим светом (теней не бросает) */
/* лампы висят высоко: абажур у верхней кромки кадра, вывеска под ним свободна, лучи идут сверху */
const C3_LH=.42;
function c3Lamp(K,x,z,tone,kind){
  const Md=K.mt([44,50,58],.7,10,R3P.brushed),Me=K.mt([235,226,210],.3,6,0,.35),Mb=K.mt(tone,.2,4,0,9,true);
  K.tube([[x,3.2,z],[x,2.16+C3_LH,z]],.004,K.mt([20,20,22],.2,4,0),4);
  K.push([x,C3_LH,z]);
  if(kind==="bar"){   /* научная: длинный плафон вместо конуса */
    K.box([0,2.1,0],[.42,.03,.07],Md,.015);K.box([0,2.068,0],[.4,.006,.055],K.mt(tone,.2,4,0,6,true),.003);
  }else{
    K.lathe([[1.985,.175],[2.0,.172],[2.08,.11],[2.15,.05],[2.18,.02],[2.19,0]],20,Md);
    K.lathe([[1.99,.165],[2.07,.105],[2.14,.045],[2.17,.015]],20,Me);
    K.lathe([[2.06,0],[2.07,.012],[2.09,.012],[2.1,0]],8,Md);
    K.ell([0,2.03,0],[.032,.04,.032],Mb,6,10);
  }
  K.pop();
}
function c3Counter(K,st,acc,R){
  const P=R3P,L=C3_CL,Rr=C3_CR,mx=(L+Rr)/2,hw=(Rr-L)/2,T=C3_TOP;
  if(st==="trade"){
    const W=K.mt([88,52,32],.45,9,P.wood),Wd=K.mt([60,34,22],.55,11,P.wood),Br=K.mt([196,156,84],.9,12,P.brushed);
    K.box([mx,.5,-.32],[hw,.5,.28],W,.02);
    for(let x=L+.3;x<Rr-.2;x+=.6){K.box([x,.52,-.035],[.25,.36,.012],Wd,.01);K.box([x,.52,-.024],[.2,.3,.008],W,.012);}
    K.box([mx,T-.04,-.31],[hw+.05,.04,.35],Wd,.02);
    K.push([Rr,0,-.31]);K.lathe([[0,.3],[1.0,.3]],18,W);K.lathe([[T-.08,.35],[T,.35],[T,0]],18,Wd);K.pop();
    K.tube([[L,.2,.13],[Rr,.2,.13]],.022,Br,10);
    for(let x=L+.2;x<Rr;x+=.9)K.tube([[x,.2,.13],[x,.02,.02]],.012,Br,6);
    K.tube([[L,T+.012,.03],[Rr,T+.012,.03]],.012,Br,8);
  }else if(st==="indust"){
    const S=K.mt([92,96,100],.6,9,P.wall),Tp=K.mt([120,124,128],.7,11,P.brushed);
    K.box([mx,.5,-.32],[hw,.5,.28],S,.01);
    for(let x=L+.1;x<Rr;x+=.5)K.box([x,.5,-.035],[.02,.5,.01],K.mt([70,72,76],.6,9,P.brushed),.004);
    K.box([mx,T-.03,-.31],[hw+.04,.03,.34],Tp,.008);
    K.push([L-.45,0,-.1]);K.lathe([[0,.27],[.05,.29],[.45,.29],[.5,.27],[.55,.29],[.85,.29],[.9,.27],[.91,0]],18,K.mt([150,70,40],.5,8,P.brushed));K.pop();
  }else if(st==="yard"){
    const Wt=K.mt([132,100,68],.35,7,P.wood),Dr=K.mt([60,92,98],.55,9,P.brushed),Hd=K.mt([180,184,190],.8,12,P.brushed);
    K.box([mx,.5,-.32],[hw,.5,.28],Dr,.01);
    for(let x=L+.35;x<Rr-.2;x+=.7)for(let y=.22;y<.95;y+=.26){K.box([x,y,-.035],[.31,.11,.012],Dr,.01);K.box([x,y+.05,-.018],[.08,.008,.01],Hd,.004);}
    for(let k=0;k<3;k++)K.box([mx,T-.04,-.55+k*.2],[hw+.06,.04,.095],Wt,.012);
    K.push([Rr+.02,T,-.2]);K.box([0,.06,0],[.06,.06,.1],K.mt([70,90,110],.6,9,P.brushed),.01);K.box([0,.06,.13],[.06,.05,.03],Hd,.01);K.tube([[-.12,.09,.17],[.12,.09,.17]],.008,Hd,5);K.pop();
  }else if(st==="sci"){
    const Gl=K.mt([60,90,110],.95,14,P.glass),Wh=K.mt([214,222,230],.7,12,0);
    K.box([mx,.5,-.32],[hw,.5,.28],Gl,.01);
    K.box([mx,.04,-.03],[hw-.02,.012,.012],K.mt(acc,.2,4,0,3,true),.004);
    K.box([mx,T-.02,-.31],[hw+.05,.02,.35],Wh,.008);
  }else{
    const Pl=K.mt([108,84,58],.25,5,P.wood),Ba=K.mt([110,70,46],.45,7,P.brushed);
    for(const x of [L+.5,Rr-.5]){K.push([x,0,-.3]);K.lathe([[0,.3],[.05,.32],[.5,.32],[.55,.3],[.6,.32],[.95,.32],[1.0,.3],[1.01,0]],16,Ba);K.pop();}
    for(let k=0;k<4;k++){const z=-.58+k*.18,w=hw+.08-R()*.12;K.box([mx+(R()-.5)*.1,T-.03,z],[w,.025,.075],Pl,.008);}
    K.box([mx,.3,-.3],[.3,.3,.25],K.mt([84,74,60],.3,6,P.wood),.02);
  }
}
/* полка за стойкой: что стоит — по типу станции; подсветка снизу каждой полки — свечение акцента */
function c3Shelf(K,st,acc,seed){
  const P=R3P,L=C3_CL,Rx=.2,Z=C3_BACK,R=rng(seed^0x5C);
  const Cab=K.mt(st==="sci"?[70,78,90]:[52,40,32],.4,8,st==="sci"?P.brushed:P.wood);
  K.box([(L+Rx)/2-.05,.46,Z+.25],[(Rx-L)/2+.15,.46,.25],Cab,.015);
  K.box([(L+Rx)/2-.05,.935,Z+.26],[(Rx-L)/2+.18,.02,.27],Cab,.01);
  if(st==="outpost"){
    for(let x=L+.1;x<Rx-.2;x+=.38+R()*.1){const rows=1+((R()*3)|0);
      for(let k=0;k<rows;k++){const w=.17+R()*.04,h=.14+R()*.03,y=.96+h+k*(h*2+.01);
        K.box([x,y,Z+.2],[w,h,.16],K.mt([86,76,62],.3,6,P.wood),.012);K.box([x,y,Z+.361],[w*.7,.012,.002],K.mt(acc,.2,4,0,.4),.001);}}
    return;
  }
  const ys=st==="sci"?[1.22,1.54,1.86]:[1.28,1.7];
  for(const y of ys){
    K.box([(L+Rx)/2,y-.015,Z+.15],[(Rx-L)/2,.015,.15],K.mt(st==="sci"?[110,120,132]:[64,52,40],.5,9,st==="sci"?P.brushed:P.wood),.006);
    K.box([(L+Rx)/2,y+.02,Z+.012],[(Rx-L)/2-.02,.012,.006],K.mt(mixc(acc,[255,214,160],.5),.2,4,0,3.2,true),.003);
    for(let x=L+.08;x<Rx-.06;x+=(st==="indust"?.085:.1)+R()*.05){
      if(st==="sci"){const h=.12+R()*.1;K.push([x,y,Z+.14]);K.lathe([[0,.028],[h,.028],[h+.01,0]],10,K.mt([170,200,214],.9,13,P.glass));
        K.lathe([[.004,.024],[h*.5,.024],[h*.5+.001,0]],10,K.mt([120,220,210],.4,8,0,.6));K.pop();}
      else if(st==="indust"){K.push([x,y,Z+.14]);K.lathe([[0,.032],[.17,.032],[.19,.018],[.21,.018],[.215,0]],10,K.mt([120,112,92],.6,9,P.brushed));K.pop();}
      else{const hue=[[60,110,70],[140,80,46],[50,80,130],[120,60,96],[170,140,70]][(R()*5)|0];c3Bottle(K,x,y,Z+.14,(R()*3)|0,hue,R);}
    }
  }
  for(const x of [L-.02,Rx+.02])K.box([x,1.55,Z+.15],[.02,.62,.15],Cab,.006);
}
/* реквизит по типу станции: в углах зала, не загораживая стойку */
function c3Prop(K,kind,x,z,acc,R){
  const P=R3P;K.push([x,0,z],R()*.6-.3);
  if(kind==="plant"){K.lathe([[0,.2],[.3,.24],[.34,.25],[.35,0]],14,K.mt([120,74,52],.3,6,0));
    for(let i=0;i<9;i++){const a=i/9*TAU+R(),h=.7+R()*.5,l=[[0,.32,0],[Math.cos(a)*.12,.32+h*.5,Math.sin(a)*.12],[Math.cos(a)*.32,.32+h,Math.sin(a)*.32]];
      K.tube(l,[.012,.01,.004],K.mt([60,96,52],.3,6,P.plant),5);K.ell(l[2],[.08,.02,.05],K.mt([72,120,60],.35,6,P.plant),4,6);K.ell(l[1],[.07,.018,.045],K.mt([66,110,56],.35,6,P.plant),4,6);}}
  else if(kind==="crates"){for(let i=0;i<3;i++){const s=.22+R()*.06;K.box([(i-1)*.28+R()*.05,s+(i===2?.46:0),R()*.1],[s,s,s],K.mt([96,78,56],.3,6,P.wood),.02);}}
  else if(kind==="lantern"){K.tube([[0,0,0],[0,1.5,0]],.02,K.mt([40,40,44],.6,9,P.brushed),6);K.box([0,1.6,0],[.08,.12,.08],K.mt([60,60,66],.6,9,P.brushed),.01);
    K.ell([0,1.6,0],[.05,.08,.05],K.mt([255,190,110],.2,4,0,5,true),5,8);}
  else if(kind==="pipes"){for(let i=0;i<3;i++)K.tube([[-.6,2.6+i*.14,-.3],[1.6,2.6+i*.14,-.3],[1.6,2.6+i*.14,1.5]],.05-i*.01,K.mt([110,96,80],.6,9,P.brushed),10);
    K.box([.2,2.75,-.3],[.08,.2,.08],K.mt([140,40,30],.4,7,P.brushed),.01);}
  else if(kind==="barrel"){K.lathe([[0,.28],[.05,.3],[.45,.31],[.5,.29],[.55,.31],[.9,.3],[.95,.28],[.96,0]],18,K.mt([100,64,40],.5,8,P.brushed));
    K.box([0,.96,0],[.18,.004,.004],K.mt(acc,.2,4,0,.3),.001);}
  else if(kind==="fan"){K.part=1;K.push([0,2.95,0]);
    K.lathe([[0,.06],[.1,.06],[.12,0]],10,K.mt([60,64,70],.6,9,P.brushed));
    for(let i=0;i<4;i++){K.push([0,0,0],i/4*TAU);K.box([.38,-.02,0],[.32,.006,.07],K.mt([84,72,58],.4,7,P.wood),.004);K.pop();}
    K.pop();K.part=0;K.tube([[0,3.2,0],[0,3.0,0]],.015,K.mt([60,64,70],.6,9,P.brushed),6);}
  else if(kind==="gantry"){const Y=K.mt([196,150,40],.5,8,P.hazard);K.box([0,2.95,-1],[2.4,.07,.07],Y,.01);
    K.tube([[.6,2.88,-1],[.6,2.2,-1]],.006,K.mt([60,60,64],.5,8,0),4);K.box([.6,2.16,-1],[.05,.05,.03],K.mt([70,74,80],.7,10,P.brushed),.01);}
  else if(kind==="toolboard"){K.box([0,1.5,0],[.5,.45,.02],K.mt([92,86,72],.3,6,0),.01);
    for(let i=0;i<7;i++)K.box([-.4+i*.13,1.5+(R()-.5)*.3,.03],[.015,.1+R()*.08,.01],K.mt([160,164,170],.8,11,P.brushed),.005);}
  else if(kind==="holo"){K.lathe([[0,.3],[.7,.26],[.74,.3],[.76,0]],16,K.mt([60,70,84],.7,11,P.brushed));
    K.part=7;K.push([0,.76,0]);K.lathe([[.0,.0],[.02,.18],[.3,.14],[.32,.0]],10,K.mt(acc,.2,4,0,2.2,true));
    K.ell([0,.42,0],[.16,.16,.16],K.mt(acc,.2,4,P.screen,1.4,true),6,10);K.pop();K.part=0;}
  else if(kind==="books"){for(let s=0;s<3;s++){K.box([0,.4+s*.42,0],[.45,.012,.14],K.mt([70,52,40],.3,6,P.wood),.004);
    for(let x=-.42;x<.4;x+=.04+R()*.02){const h=.14+R()*.1;K.box([x,.41+s*.42+h/2,0],[.016,h/2,.1],K.mt([[120,40,36],[40,70,110],[90,110,60],[150,120,70]][(R()*4)|0],.3,6,0),.003);}}}
  else if(kind==="hazard"){K.box([0,.5,0],[.32,.5,.24],K.mt([200,160,40],.5,8,P.hazard),.02);}
  K.pop();
}
function c3Tree(K,acc,R){
  const Gr=K.mt([40,90,52],.3,6,R3P.plant);
  K.lathe([[0,.08],[.3,.08],[.32,0]],8,K.mt([90,60,40],.3,6,R3P.wood));
  for(let t=0;t<4;t++){const y=.25+t*.38,r=.62-t*.13;K.lathe([[y,r],[y+.55,.02],[y+.56,0]],14,Gr);
    for(let i=0;i<9;i++){const a=i/9*TAU+t,rr=r*.82;K.ell([Math.cos(a)*rr,y+.08,Math.sin(a)*rr],[.025,.025,.025],K.mt(i&1?acc:[255,200,120],.2,4,0,5,true),4,6);}}
  K.ell([0,1.92,0],[.05,.05,.05],K.mt([255,220,140],.3,6,0,6,true),5,8);
}
/* вещи историй на стойке (11c storyCantScene) */
function c3StoryProp(K,p,x,R){
  const y=C3_TOP,z=-.22;K.push([x,y,z],R()*TAU);
  if(p==="glass"||p==="glass_empty")c3Glass(K,[200,150,60],p==="glass"?.8:0);
  else if(p==="cup"){K.lathe([[0,0],[.002,.035],[.07,.038],[.072,0]],12,K.mt([210,200,180],.5,9,0));K.tube([[.036,.055,0],[.055,.04,0],[.036,.018,0]],.006,K.mt([210,200,180],.5,9,0),5);}
  else if(p==="cap"){K.ell([0,.03,0],[.09,.04,.09],K.mt([70,78,92],.2,5,R3P.cloth),5,10);K.box([0,.006,.1],[.07,.005,.04],K.mt([60,66,78],.2,5,R3P.cloth),.004);}
  else if(p==="bread"){K.ell([0,.035,0],[.12,.04,.06],K.mt([188,140,86],.3,6,0),6,10);}
  else if(p==="tally"){for(let i=0;i<5;i++)K.box([-.04+i*.02,.002,0],[.003,.002,.04],K.mt([230,230,220],.1,3,0),.001);}
  else if(p==="candle"){K.lathe([[0,.016],[.08,.016],[.081,0]],8,K.mt([230,220,190],.3,6,0));K.ell([0,.1,0],[.008,.016,.008],K.mt([255,190,90],.2,4,0,8,true),4,6);}
  else if(p==="key"){K.box([0,.004,0],[.04,.003,.006],K.mt([210,190,120],.9,12,R3P.brushed),.002);}
  else if(p==="jar"){K.lathe([[0,0],[.002,.04],[.1,.04],[.11,.03],[.112,0]],10,K.mt([180,220,200],.9,13,R3P.glass));}
  else if(p==="paper"){K.box([0,.002,0],[.08,.001,.11],K.mt([230,226,210],.1,3,0),.001);}
  K.pop();
}
function c3RoomMesh(L){
  const K=r3Kit(),P=R3P,S=L.S,st=L.st,acc=L.acc,R=rng(L.seed^0x3D),LT=CANT_LIGHT[st]||CANT_LIGHT.trade;
  const wall=S.wall,Mw=K.mt(wall.map(v=>v*1.25),.25,6,P.wall),Mw2=K.mt(mixc(wall,[12,10,10],.35),.3,6,P.wall);
  K.part=0;
  /* пол, стены, потолок */
  K.quad([-5.4,0,C3_BACK],[5.4,0,C3_BACK],[5.4,0,6],[-5.4,0,6],K.mt(mixc(wall,[100,92,82],.5),.35,7,P.floor),[0,1,0]);
  K.quad([-5.4,1.0,C3_BACK],[5.4,1.0,C3_BACK],[5.4,3.2,C3_BACK],[-5.4,3.2,C3_BACK],Mw,[0,0,1]);
  K.quad([-5.4,0,C3_BACK],[5.4,0,C3_BACK],[5.4,1.0,C3_BACK],[-5.4,1.0,C3_BACK],Mw2,[0,0,1]);
  for(const s of [-1,1]){K.quad([s*5.4,0,C3_BACK],[s*5.4,0,6],[s*5.4,3.2,6],[s*5.4,3.2,C3_BACK],Mw,[-s,0,0]);}
  K.quad([-5.4,3.2,C3_BACK],[5.4,3.2,C3_BACK],[5.4,3.2,6],[-5.4,3.2,6],K.mt(mixc(wall,[0,0,0],.4),.2,4,P.ceil),[0,-1,0]);
  const Tr=K.mt(mixc(wall,[30,26,22],.5),.4,8,P.brushed);
  K.box([0,1.0,C3_BACK+.02],[5.4,.025,.02],Tr,.008);K.box([0,.05,C3_BACK+.015],[5.4,.05,.015],Tr,.006);
  for(let x=-4.8;x<5;x+=1.6)K.box([x,3.12,1.6],[.06,.08,4.4],K.mt(mixc(wall,[0,0,0],.3),.4,8,P.brushed),.01);
  /* окно: проём, вид наружу, рама и переплёт */
  const wx0=.8,wx1=3.6,wy0=1.15,wy1=2.4,Fr=K.mt([120,130,142],.7,11,P.brushed);
  K.quad([wx0,wy0,C3_BACK+.01],[wx1,wy0,C3_BACK+.01],[wx1,wy1,C3_BACK+.01],[wx0,wy1,C3_BACK+.01],K.mt([3,3,3],.9,14,P.window),[0,0,1]);
  K.box([(wx0+wx1)/2,wy0-.03,C3_BACK+.06],[(wx1-wx0)/2+.06,.03,.07],Fr,.01);
  K.box([(wx0+wx1)/2,wy1+.03,C3_BACK+.05],[(wx1-wx0)/2+.06,.03,.05],Fr,.01);
  for(const x of [wx0-.03,wx1+.03,wx0+(wx1-wx0)/3,wx0+(wx1-wx0)*2/3])K.box([x,(wy0+wy1)/2,C3_BACK+.05],[.03,(wy1-wy0)/2,.05],Fr,.01);
  /* вывеска: плата, буквы — текстура (pat sign), неоновая кромка */
  const sx0=-2.6,sx1=-.5,sy0=2.1,sy1=2.42;
  K.box([(sx0+sx1)/2,(sy0+sy1)/2,C3_BACK+.03],[(sx1-sx0)/2+.04,(sy1-sy0)/2+.04,.025],K.mt([16,18,22],.5,9,0),.01);
  K.quad([sx0,sy0,C3_BACK+.058],[sx1,sy0,C3_BACK+.058],[sx1,sy1,C3_BACK+.058],[sx0,sy1,C3_BACK+.058],K.mt([255,255,255],.4,10,P.sign),[0,0,1]);
  const ne=[[sx0-.03,sy0-.03],[sx1+.03,sy0-.03],[sx1+.03,sy1+.03],[sx0-.03,sy1+.03],[sx0-.03,sy0-.03]].map(p=>[p[0],p[1],C3_BACK+.07]);
  K.tube(ne,.006,K.mt(acc,.3,8,P.neon,2.2,true),5);
  /* дверь: рама, полотно в нише, круглое окошко */
  const Dr=K.mt(mixc(wall,[80,84,92],.3),.6,9,st==="outpost"?P.hazard:P.brushed);
  K.box([-3.9,1.1,C3_BACK+.04],[.52,1.1,.04],Dr,.015);
  K.box([-3.9,1.05,C3_BACK+.07],[.44,1.02,.02],K.mt(mixc(wall,[60,64,70],.4),.5,8,P.brushed),.01);
  K.ell([-3.9,1.62,C3_BACK+.09],[.12,.12,.01],K.mt([150,190,230],.4,8,0,1.6,true),5,12);
  /* стойка, полка, табуреты, стаканы, колонка розлива */
  c3Counter(K,st,acc,R);c3Shelf(K,st,acc,L.seed);
  for(const x of L.seats){c3Stool(K,x,.36);K.push([x+.13,C3_TOP,-.18]);c3Glass(K,[200,150,60],.5+R()*.4);K.pop();}
  K.push([L.bx-.62,C3_TOP,-.32]);K.lathe([[0,.05],[.02,.05],[.03,.025],[.42,.025],[.44,0]],10,K.mt([170,174,180],.85,13,P.brushed));
  for(let i=0;i<3;i++)K.box([(i-1)*.07,.36,.05],[.012,.06,.012],K.mt([30,30,34],.5,8,0),.005);K.pop();
  for(let i=0;i<4;i++){K.push([C3_CL+.4+R()*(C3_CR-C3_CL-.8),C3_TOP,-.4-R()*.15]);c3Glass(K,[190,200,190],R()<.5?.4:0);K.pop();}
  /* толпе — высокий стол и стол со стульями */
  c3RoundTable(K,3.5,-1.1,1.05,.32,K.mt([70,50,36],.45,9,P.wood));
  for(let i=0;i<3;i++){K.push([3.5+(R()-.5)*.3,1.064,-1.1+(R()-.5)*.3]);K.lathe([[0,.04],[.11,.04],[.112,0]],10,K.mt([200,190,170],.4,8,0));K.pop();}
  c3RoundTable(K,4.35,1.27,.74,.36,K.mt([70,50,36],.45,9,P.wood));
  c3Chair(K,3.9,.82,Math.atan2(.45,.45)+Math.PI);c3Chair(K,4.78,1.66,Math.atan2(-.43,-.39)+Math.PI);
  /* лампы: каждая — своя часть (качаются на верфи) */
  const tone=mixc(LT.tone,acc,.25),xs=c3LampX(L);
  xs.forEach((x,i)=>{K.part=2+i;c3Lamp(K,x,.12,tone,st==="sci"?"bar":"cone");});K.part=0;
  /* реквизит: по углам */
  const spots=[[-4.6,1.4],[4.6,-2.3],[-4.7,-1.2]];
  S.props.forEach((k,i)=>c3Prop(K,k,spots[i%3][0],spots[i%3][1],acc,R));
  if(L.K9){for(let i=0;i<9;i++){const row=i<5?0:1;c3Chair(K,(i-(row?7:2))*.78+(row?.39:0),1.55+row*.85-.02,Math.PI);}
    K.box([0,2.2,C3_BACK+.42],[1.7,.02,.02],K.mt([40,40,44],.6,9,P.brushed),.01);
    K.quad([-1.6,1.05,C3_BACK+.4],[1.6,1.05,C3_BACK+.4],[1.6,2.18,C3_BACK+.4],[-1.6,2.18,C3_BACK+.4],K.mt([255,255,255],0,1,P.film),[0,0,1]);}
  if(L.tree){K.push([3.25,0,.55]);c3Tree(K,acc,R);K.pop();}
  for(const sc of L.stories){if(!sc.props)continue;const p=C3_STORY[sc.seat]||C3_STORY.far;let x=clamp(p[0],C3_CL+.2,C3_CR-.2)-(sc.props.length-1)*.07;
    for(const q of sc.props){c3StoryProp(K,q,x,R);x+=.14;}}
  return K.pack();
}
/* столик с делом: сетка у начала координат — экземпляр ставит его на место и подсвечивает */
function c3TableMesh(T){
  const K=r3Kit(),R=rng(T.seed),P=R3P;
  c3RoundTable(K,0,0,.75,.4,K.mt([74,52,36],.5,10,P.wood));
  c3Chair(K,0,-.46,0);
  K.push([.16,.764,.08]);K.lathe([[0,.04],[.11,.042],[.112,0]],10,K.mt([200,190,170],.4,8,0));K.pop();
  if(R()<.5){K.push([-.12,.766,.06],(R()-.5)*.6);K.box([0,0,0],[.1,.002,.14],K.mt([226,220,200],.1,3,0),.001);K.pop();}
  else K.box([-.14,.84,.05],[.09,.07,.07],K.mt([84,70,56],.3,6,P.wood),.01);
  return K.pack();
}
/* лампы над стойкой: x по стойке; на верфи качаются */
function c3LampX(L){const LT=CANT_LIGHT[L.st]||CANT_LIGHT.trade,xs=[];
  for(let i=0;i<LT.n;i++)xs.push(C3_CL+.3+(C3_CR-C3_CL-.6)*(i+.5)/LT.n);return xs;}
const C3_M=new Float32Array(R3_MAXI*R3_PART*16),C3_OT=new Float32Array(R3_MAXI*R3_PART*4);
/* матрицы и свет кадра; сцена — для r3Frame */
function c3Scene(L,sel,hover,t){
  const LT=CANT_LIGHT[L.st]||CANT_LIGHT.trade,acc=L.acc,K9=L.K9,M=C3_M,OT=C3_OT,I=r3Xf([0,0,0]);
  for(let i=0;i<R3_MAXI*R3_PART;i++)M.set(I,i*16);OT.fill(0);
  const draws=[];
  /* зал: экземпляр 0 */
  const xs=c3LampX(L),lamps=[];
  xs.forEach((x,i)=>{const sw=LT.sway?.05*Math.sin(t*.7+i*2.1):0,sw2=LT.sway?.03*Math.sin(t*.53+i*1.3):0;
    const A=r3Pivot(I,[x,3.2,.12],0,sw2,sw);M.set(A,(2+i)*16);lamps.push({p:r3Pt(A,[x,2.03+C3_LH,.12]),d:r3Pt(A,[x,1.0,.3]).map((v,k)=>v-r3Pt(A,[x,2.03+C3_LH,.12])[k])});});
  /* вентилятор и голограмма вращаются вокруг своего места (споты реквизита c3RoomMesh) */
  if(L.S.props.indexOf("fan")>=0){const i=L.S.props.indexOf("fan"),sp=[[-4.6,1.4],[4.6,-2.3],[-4.7,-1.2]][i%3];M.set(r3Pivot(I,[sp[0],2.95,sp[1]],t*2.4,0,0),16);}
  if(L.S.props.indexOf("holo")>=0){const i=L.S.props.indexOf("holo"),sp=[[-4.6,1.4],[4.6,-2.3],[-4.7,-1.2]][i%3];M.set(r3Pivot(I,[sp[0],0,sp[1]],t*.5,0,0),7*16);}
  draws.push([L.room,0,1]);
  /* столики с делами: экземпляры 1..n */
  let ii=1;
  L.tables.forEach((T,k)=>{const A=r3Xf([T.x,0,T.z]);for(let p=0;p<R3_PART;p++)M.set(A,(ii*R3_PART+p)*16);
    const on=sel===T.id?1:hover===T.id?.55:0;for(let p=0;p<R3_PART;p++)OT[(ii*R3_PART+p)*4]=on;
    draws.push([C3.tabs[k],ii,1]);T.ii=ii;ii++;});
  /* люди */
  for(const P of L.people){if(ii>=R3_MAXI)break;
    const ph=(P.m.seed%1000)*.0063,br=1+.006*Math.sin(t*1.6+ph),A=r3Xf([P.x,0,P.z],P.yaw);
    const B=r3Mul(A,[1,0,0,0, 0,br,0,0, 0,0,1,0, 0,0,0,1]),at=P.mesh.at;
    const look=P.id&&(P.id===sel||P.id===hover);
    const hy=look?0:.28*Math.sin(t*.21+ph*3)*Math.max(0,Math.sin(t*.09+ph)),hp=look?.04:.05*Math.sin(t*.17+ph);
    M.set(B,(ii*R3_PART)*16);
    M.set(r3Pivot(B,at.neck,hy,hp,0),(ii*R3_PART+1)*16);
    for(let k=0;k<2;k++){let rA=B;
      if(P.kind==="keep"&&k===1)rA=r3Pivot(B,at.sh[1],.18*Math.sin(t*1.3),0,.04*Math.sin(t*2.6));
      M.set(rA,(ii*R3_PART+2+k)*16);}
    const on=P.id&&sel===P.id?1:P.id&&hover===P.id?.55:0;
    for(let p=0;p<R3_PART;p++){OT[(ii*R3_PART+p)*4]=on;OT[(ii*R3_PART+p)*4+1]=P.dim||0;}
    draws.push([P.mesh,ii,1]);P.ii=ii;ii++;}
  /* свет: лампы над стойкой (тени), заполняющий от входа, окно, неон; на кино — проектор и полотно */
  const tone=r3Lin(mixc(LT.tone,acc,.25)),pw=LT.pow*(K9?.16:1),sci=L.st==="sci";
  const lights=[];
  lamps.forEach((l,i)=>{const d=l.d,dl=Math.hypot(...d);
    lights.push({p:l.p,range:sci?4:5,c:r3Sc(tone,(sci?4.6:8)*pw),spot:1,d:[d[0]/dl,d[1]/dl,d[2]/dl],
      cosO:Math.cos(Math.min(1.35,(sci?1.25:.78)*LT.cone)),cosI:Math.cos(Math.min(1.2,(sci?.9:.42)*LT.cone)),shadow:i<4,vol:(sci?.25:1)*(K9?.4:1)});});
  /* ключ на лица: широкое пятно сверху-спереди, от входа; без тени и дыма — лица у стойки читаются */
  {const kd=[-.35,1.2-2.7,.3-3.2],kl=Math.hypot(...kd);
  lights.push({p:[.4,2.7,3.2],range:9,c:r3Sc(r3Lin(mixc(LT.tone,[150,160,190],.4)),2.6*LT.amb*(K9?.3:1)),spot:1,d:kd.map(x=>x/kl),
    cosO:Math.cos(.8),cosI:Math.cos(.3),vol:0});}
  const vw=L.S.view,wc=vw==="foundry"?[255,150,90]:vw==="dust"?[230,170,120]:vw==="stars"?[150,180,255]:[170,200,255];
  lights.push({p:[2.2,1.8,C3_BACK+.25],range:4.2,c:r3Sc(r3Lin(wc),1.4),vol:.5,shadow:0});
  const fl=(Math.sin(t*.31+L.seed%7)>-.92)?1:.35;
  lights.push({p:[-1.55,2.26,C3_BACK+.35],range:2.6,c:r3Sc(r3Lin(acc),1.6*fl),vol:.2});
  /* над столиками — низкая лампа: тот, кто сидит у объектива, не силуэт, а человек */
  if(!K9)for(const T of L.tables)lights.push({p:[T.x+.15,1.5,T.z+.05],range:2,c:r3Sc(tone,.95*pw),vol:0});
  if(K9){lights.push({p:[0,2.45,4.3],range:8.5,c:r3Sc(r3Lin([220,230,255]),9),spot:1,d:(()=>{const v=[0,1.6-2.45,C3_BACK+.4-4.3],l=Math.hypot(...v);return v.map(x=>x/l);})(),
      cosO:Math.cos(.17),cosI:Math.cos(.1),shadow:1,vol:2.4});
    lights.push({p:[0,1.6,C3_BACK+.9],range:5.5,c:r3Sc(r3Lin([170,190,230]),1.3*(.8+.2*Math.sin(t*3.1))),vol:0});}
  const fog=r3Lin(mixc(L.S.wall,LT.tone,.25));
  return {draws,vp:L.cam.vp,cam:L.cam.eye,t,lights:lights.slice(0,R3_MAXL),
    sky:[...r3Sc(r3Lin(mixc(L.S.wall,[170,180,200],.35)),1),.22*LT.amb*(K9?.5:1)],gnd:[...r3Lin(mixc(L.S.wall,[60,50,40],.3)),.018],
    fog:[...r3Sc(fog,.25),K9?.05:.032],acc:[...r3Lin(acc),fl],
    win:[.8,1.15,3.6,2.4],win2:[C3_BACK,C3_VIEW[vw]||0,L.seed%997,1],sgn:[-2.6,2.1,-.5,2.42],sgn2:[C3_BACK,fl,0,0],
    flm:[-1.6,1.05,1.6,2.18],flm2:[C3_BACK+.4,K9?1:0,0,0],tsg:C3.sign,tfl:K9?C3.film:null,M,ot:OT,lampsAt:lamps};
}
/* попадания: проекция макушки, таза и плеч каждого, кого можно выбрать (CSS-пиксели) */
function c3Hits(L,cssW,cssH){
  const vp=L.cam.vp,hits=[];
  const box=(pts,id,pad)=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    for(const p of pts){const q=r3Proj(vp,p,cssW,cssH);if(!q)continue;x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1]);}
    if(x1>x0)hits.push({id,x:x0-pad,y:y0-pad,w:x1-x0+pad*2,h:y1-y0+pad*2});};
  const wp=(P,p)=>{const c=Math.cos(P.yaw),s=Math.sin(P.yaw);return [P.x+p[0]*c+p[2]*s,p[1],P.z-p[0]*s+p[2]*c];};
  /* сначала ближние: столики, потом люди у стойки — find берёт первое */
  for(const T of L.tables){const P=L.people.find(q=>q.id===T.id);const at=P&&P.mesh.at;
    box([[T.x-.42,.76,T.z],[T.x+.42,.76,T.z],[T.x,.0,T.z+.3]].concat(at?[wp(P,at.top),wp(P,at.sh[0]),wp(P,at.sh[1])]:[]),T.id,4);}
  for(const P of L.people){if(!P.id||P.kind==="deal")continue;const at=P.mesh.at;
    box([wp(P,at.top),wp(P,[at.pel[0],at.pel[1]-.3,at.pel[2]+.2]),wp(P,[at.sh[0][0]+.08,at.sh[0][1],at.sh[0][2]]),wp(P,[at.sh[1][0]-.08,at.sh[1][1],at.sh[1][2]])],P.id,3);}
  return hits;
}
/* подписи поверх тона: имя над выбранным, дело над столиком, слово бармена */
function c3Labels(g,L,sel,hover,cssW,cssH,s){
  g.scale(s,s);
  const vp=L.cam.vp,acc=L.acc,wp=(P,p)=>[P.x+p[0]*Math.cos(P.yaw)+p[2]*Math.sin(P.yaw),p[1],P.z-p[0]*Math.sin(P.yaw)+p[2]*Math.cos(P.yaw)];
  const tag=(x,y,txt,on,font)=>{g.font=font||"10px ui-monospace,monospace";g.textAlign="center";const tw=g.measureText(txt).width;
    x=clamp(x,tw/2+8,cssW-tw/2-8);y=clamp(y,14,cssH-6);
    g.fillStyle="rgba(6,10,16,.86)";g.fillRect(x-tw/2-7,y-12,tw+14,17);
    g.strokeStyle=rgba(acc,on?.85:.5);g.lineWidth=1;g.strokeRect(x-tw/2-6.5,y-11.5,tw+13,16);
    g.fillStyle=on?"#eef6f4":"rgba(226,232,238,.82)";g.fillText(txt,x,y);g.textAlign="left";};
  for(const P of L.people){if(P.kind!=="cand"||(P.id!==sel&&P.id!==hover))continue;
    const q=r3Proj(vp,wp(P,P.mesh.at.top),cssW,cssH);if(!q)continue;const R2=MGR_ROLES[P.m.role];
    tag(q[0],q[1]-10,P.m.name.toUpperCase()+" · "+R2.ru.toUpperCase(),P.id===sel);}
  for(const T of L.tables){const P=L.people.find(q=>q.id===T.id);if(!P)continue;
    const q=r3Proj(vp,wp(P,P.mesh.at.top),cssW,cssH);if(!q)continue;
    tag(q[0],q[1]-10,T.d.def.ru.toUpperCase(),sel===T.id||hover===T.id,"9px ui-monospace,monospace");}
  if(typeof cantBubble!=="undefined"&&cantBubble&&now()-cantBubble.t<5200){
    const age=(now()-cantBubble.t)/1000,al=age<.2?age/.2:(age>4.4?Math.max(0,(5.2-age)/.8):1);
    const P=L.people.find(q=>q.kind==="keep"),q=P&&r3Proj(vp,wp(P,P.mesh.at.top),cssW,cssH);
    if(q){g.save();g.globalAlpha=al;g.font="10px ui-monospace,monospace";g.textAlign="left";
      const words=cantBubble.line.split(" "),lines=[];let cur="";
      for(const w of words){const t=cur?cur+" "+w:w;if(g.measureText(t).width>cssW*.42&&cur){lines.push(cur);cur=w;}else cur=t;}
      if(cur)lines.push(cur);
      const bw=lines.reduce((m,l)=>Math.max(m,g.measureText(l).width),0)+20,bh=lines.length*13+12;
      const bx=clamp(q[0]+18,8,cssW-bw-8),by=clamp(q[1]-bh-6,6,cssH-bh-6);
      g.fillStyle="rgba(8,12,18,.9)";g.fillRect(bx,by,bw,bh);
      g.strokeStyle=rgba(acc,.6);g.lineWidth=1;g.strokeRect(bx+.5,by+.5,bw,bh);
      g.fillStyle="#e8f0f2";lines.forEach((l,i)=>g.fillText(l,bx+10,by+16+i*13));g.restore();}
  }
}
/* вывеска: буквы белым по прозрачному (маска для неона в шейдере), вторая строка — что дают */
function c3SignTex(S){
  const cby=(G.sys&&G.sys.station&&G.sys.station.by)||"gt",CP=(typeof powerOf==="function")?powerOf(cby):null,food=CP&&CP.food?"сегодня: "+CP.food:"";
  const key=S.sign+"|"+food;
  if(C3.sign&&C3.skey===key&&C3.sign.dev===GPU.dev)return C3.sign;
  if(C3.sign)gpuBakeDrop(C3.sign);
  C3.skey=key;
  C3.sign=gpuBake(840,136,g=>{g.fillStyle="#fff";g.textAlign="center";g.font="bold 64px ui-monospace,monospace";g.fillText(S.sign,420,food?74:92);
    if(food){g.font="30px ui-monospace,monospace";g.fillStyle="rgba(255,255,255,.55)";g.fillText(food,420,120);}},{mips:false});
  return C3.sign;
}
/* полотно кино: кадр ленты (27da kinoScreen) — раз в четыре кадра */
function c3FilmTex(K,seed){
  if(C3.film&&C3.film.dev===GPU.dev&&C3.fT++%4)return C3.film;
  if(C3.film)gpuBakeDrop(C3.film);
  C3.film=gpuBake(512,180,g=>{if(typeof kinoScreen==="function")kinoScreen(g,0,0,512,180,K,seed);},{mips:false});
  return C3.film;
}
/* кадр зала: раскладка по ключу, сетки по ключу, свет и движение каждый кадр */
function cant3dFrame(cn,list,sel,hover,deals,folk){
  const dpr=cn.__dpr||1,cssW=cn.width/dpr,cssH=cn.height/dpr;
  const key=cssW+"x"+cssH+"|"+list.map(m=>m.id+":"+Math.round((m.loy||55)/12)).join(",")+"|"+(deals||[]).map(d=>d.key).join(",")+"|"+(folk?folk.id:"")+"|"+G.sys.seed+"|"+((G.st&&G.st.stype)||"");
  if(!C3.L||C3.lkey!==key||now()-C3.sT>3000||now()<C3.sT){C3.L=c3Layout(cssW,cssH,list,deals||[],folk);C3.lkey=key;}
  const L=C3.L,hits=c3Hits(L,cssW,cssH);
  const R=rpgGet(cn);if(!R)return hits;
  R.dpr=dpr;
  C3.tick++;
  if(!C3.room||C3.rkey!==L.rkey){r3Drop(C3.room);C3.room=c3RoomMesh(L);C3.rkey=L.rkey;
    for(const m of C3.tabs)r3Drop(m);C3.tabs=L.tables.map(c3TableMesh);}
  if(C3.tabs.length!==L.tables.length){for(const m of C3.tabs)r3Drop(m);C3.tabs=L.tables.map(c3TableMesh);}
  L.room=C3.room;
  c3SignTex(L.S);if(L.K9)c3FilmTex(L.K9,L.seed);
  const t=wallMs()/1000,Sc=c3Scene(L,sel,hover,t);
  /* подписи: выпечка по ключу; пузырь бармена в начале и в конце — каждый кадр (прозрачность) */
  const bub=(typeof cantBubble!=="undefined"&&cantBubble&&now()-cantBubble.t<5200)?cantBubble:null,age=bub?(now()-bub.t)/1000:0;
  const lkey=cn.width+"x"+cn.height+"|"+sel+"|"+hover+"|"+L.tables.map(T=>T.id).join(",")+"|"+(bub?bub.t+(age<.25||age>4.35?":"+Math.round(age*20):""):"")+"|"+C3.lkey;
  const lab=rpgBake(R,"r3lab",lkey,cn.width,cn.height,g=>c3Labels(g,L,sel,hover,cssW,cssH,dpr));
  /* ореолы колб: точки экрана и размер */
  const U=new Float32Array(60),LT=CANT_LIGHT[L.st]||CANT_LIGHT.trade;
  Sc.lampsAt.slice(0,6).forEach((l,i)=>{const q=r3Proj(L.cam.vp,l.p,cssW,cssH),q2=r3Proj(L.cam.vp,[l.p[0]+.05,l.p[1],l.p[2]],cssW,cssH);
    if(q&&q2)U.set([q[0],q[1]+2,Math.max(2,Math.abs(q2[0]-q[0])),LT.pow*(L.K9?.15:1)*(L.st==="sci"?.4:1)],i*4);});
  const tl=r3Lin(mixc(LT.tone,L.acc,.25));U.set([tl[0],tl[1],tl[2],1.0],24);
  U[43]=t;U[44]=1;U[47]=1;
  r3Frame(cn,Sc,(pl,Sv,Vv,Bv)=>rpgField(R,pl,"r3post",R3_POST_WGSL,U,[Sv,lab,Vv,Bv]));
  return hits;
}
