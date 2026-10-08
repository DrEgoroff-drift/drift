/* ══ чужой и мирный (M820 §4) ══
   Пират читается врагом без полосы: поверх сварного кома (17c2a) — накладка злой формы. Один шип-таран
   с борта, вдвое длиннее огрызка с другого; шар турели не на оси, а на свесе; оранжевый — единственный
   акцент (окалина на остриях, пояс турели), синего игрока нет. Ходовые огни грязно-рыжие, два и не
   в пару: разные борта, разная высота, разный ритм. Выхлоп рыже-бурый и длиннее мирного (12i).
   Борт державы — чистый: корпус генератором своего завода (hullGpuDraw), белые ходовые огни,
   цвет державы на киле — записью NPC_SHIPS (13d), факел штатный, бело-голубой */
const BODY_PIR={keep:16,n:0,X:1.7,
  C:[[255,226,180],[226,128,60],[120,54,28]],   /* лестница факела пирата: жёлтое ядро, рыжее, бурое */
  RUST:[118,56,30],IRON:[50,45,42],LT:[232,124,52]};
/* накладка по выпечке пирата: art — 12i (B — обвод, rad), сторона шипа по зерну корпуса */
function bodyPirDress(art){
  if(!art.dk)art.dk=++BODY_PIR.n;
  return bodyMesh("pd:"+art.dk,BODY_PIR.keep,()=>{
    const B=art.B,L=B.L,hw=B.hw,r=rng(hashi(art.dk*977+(B.kills|0),0x5B1E,(L*10)|0));
    const sg=r()<.5?-1:1,{V,C,lathe,tube,box}=h3dKit();
    const iron=C(BODY_PIR.IRON),rust=C(BODY_PIR.RUST),dk=C(mixc(art.cols[0],[0,0,0],.2));
    const cone=(x0,y,z,len,r0,col)=>lathe(x0,y,z,[[0,r0],[len*.55,r0*.62],[len*.92,r0*.16],[len,.02]],col,3,.7,0,8,null,null);
    /* таран: длинный с одного борта, огрызок с другого; остриё в окалине */
    const sx=B.nose*.72,lg=L*(.34+r()*.12),sh=L*(.1+r()*.05),sy=sg*hw*(.34+r()*.12),r0=hw*.15;
    cone(sx,sy,.25,lg*.82,r0,iron);cone(sx+lg*.8,sy,.25,lg*.2,r0*.2,rust);
    cone(sx,-sy*.8,.2,sh,r0*.8,dk);
    box(sx-L*.05,sx+L*.02,Math.min(sy,0)-r0*1.3,Math.max(sy,0)+r0*1.3,-.4,.75,.15,dk,3,.5);   /* хомут на борту */
    /* турель на свесе другого борта: шар, пояс окалины, ствол вперёд и наружу */
    const tx=lerp(B.tail*.3,B.nose*.25,r()),ty=-sg*hw*(.92+r()*.2),tr=hw*(.26+r()*.08),tz=tr*.5,Sp=[];
    for(let k=0;k<=7;k++){const ph=-Math.PI/2+Math.PI*k/7;Sp.push([tr*Math.sin(ph),Math.max(tr*Math.cos(ph),.01)]);}
    lathe(tx,ty,tz,Sp,dk,3,.8,0,12,null,null);
    lathe(tx-tr*.12,ty,tz,[[0,tr*1.03],[tr*.24,tr*1.03]],rust,3,.6,0,12,null,null);
    tube([[tx,ty,tz+tr*.4],[tx+L*.24,ty-sg*hw*.12,tz+tr*.5]],tr*.16,iron,3,.6,6);
    box(tx-tr*.5,tx+tr*.5,Math.min(ty,-sg*hw*.55),Math.max(ty,-sg*hw*.55),-.3,tz,.1,dk,3,.5);   /* кронштейн к телу */
    const m=h3dPack(V,art.rad*1.25,{st:[[B.nose,hw*.3],[B.tail,hw*.3]],ne:2.3,kh:.5,gl:.35});
    /* огни не в пару: рыжий у тарана, второй — у кормы с другого борта, ниже и в другом ритме */
    m.L=[{x:sx+lg*.25,y:sy+sg*r0*1.6,c:BODY_PIR.LT,r:hw*.14,k:.07,ph:0},
      {x:B.tail*.72,y:-sg*hw*(.62+r()*.2),c:mixc(BODY_PIR.LT,[150,90,60],.35),r:hw*.1,k:.043,ph:1.3}];
    return m;});
}
/* накладка поверх тела пирата (12i gpuPirateBody, после h3dPirate): та же поза и крен */
function bodyPirate(art,p,x,y,s,lx,ly){
  if(!bodyGpu()||!art.B||p.wreck)return;
  const T=bodyT0();if(!T)return;
  const m=bodyPirDress(art);
  if(h3dRun(m,T,x,y,p.a,s,(p.bank||0)*.6,lx,ly,null,0))bodyLights(m,x,y,p.a,s,1);
}
/* борт державы рисуется телом (тогда живой слой 12i его пропускает) */
function bodyPowerOn(p){return !!(p&&p.pw&&!p.wreck&&NPC_SHIPS[p.shipId]&&bodyGpu());}
/* мирный борт державы: свой корпус завода, белые ходовые огни; false — пусть рисует сварной */
function bodyPower(p,x,y,s,lx,ly){
  if(!bodyPowerOn(p))return false;
  if(!hullGpuDraw(p.shipId,x,y,p.a,s,!!p.thrust,false,0,(p.bank||0)*.6,lx,ly))return false;
  const h=hullOf(p.shipId),len=h.nose-h.tail,wy=len*.2;
  bodyLights({L:[{x:h.tail+len*.3,y:-wy,c:[255,250,240],r:len*.035,k:.06,ph:0},{x:h.tail+len*.3,y:wy,c:[255,250,240],r:len*.035,k:.06,ph:0},
    {x:h.tail+len*.05,y:0,c:[230,240,255],r:len*.03,k:0,ph:0}]},x,y,p.a,s,1);
  return true;
}
/* факел пирата (12i gpuPirateLive): длина и лестница; у прочих — прежние */
function bodyPirFlame(p){return BODY.on&&!p.pw&&!p.wreck?BODY_PIR:null;}
/* габарит цели на экране для рамки захвата (15b): полуширина и полувысота повёрнутого корпуса + 4 px;
   null — не корабль с корпусом, рамка прежняя */
function bodyMarkBox(p,Z){
  if(!p||!p.shipId||typeof shipScaleAt!=="function")return null;
  let nose,tail,hw,s=shipScaleAt(Z)*.82;
  if(bodyPowerOn(p)){const h=hullOf(p.shipId);nose=h.nose;tail=h.tail;hw=(nose-tail)*.22;}
  else{const hp=clamp((p.hull||0)/(p.hullMax||1),0,1),B=pirateArtOf(p.shipId,p.rogue||p.hunter,p.wreck?2:hp<.5,p.rank|0,p.deserter?1:0).B;
    if(!B)return null;nose=B.nose+(BODY.on&&!p.pw?B.L*.2:0);tail=B.tail;hw=B.hw*1.2;}
  const c=Math.abs(Math.cos(p.a||0)),n=Math.abs(Math.sin(p.a||0)),hl=(nose-tail)/2;
  return [(hl*c+hw*n)*s+4,(hl*n+hw*c)*s+4];
}
