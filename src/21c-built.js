/* ══════════════ ваша база видна с земли ══════════════ */
/* База существовала строчкой в меню: чтобы понять, что она у вас есть, нужно
   было зайти в раздел. Сели на планету, где стоит ваша база, — на горизонте
   ничего. Теперь она стоит там, где стоит: с земли её видно, к ней идут ногами,
   и вход — это подойти, а не найти пункт в списке.

   Дом отсюда ушёл: у него свой модуль (`21f-home-out`), см. `builtHere`.

   ПРАВИЛА:
   1. Строение рисуется тем же слоем, что и POI (`21b-surface-deco`): сначала
      тень на грунте, потом тело с клипом по профилю — иначе оно висит в воздухе
      или врастает в скалу.
   2. Ничего не персистится сверх уже имеющегося: где база — знает `G.bases`.
      Место на поверхности выводится из seed планеты, как и всё остальное в мире.
   3. Масштаб держится человеком: ангар базы вдвое выше астронавта. Постройка,
      которую видно от горизонта, врёт о размере мира. */
/* что стоит в этой системе на этой планете */
function builtHere(){
  const S=G.surf;if(!S)return [];
  const out=[];
  /* база привязана к планете (21a: ключ sx,sy:idx) — на чужой планете той же
     системы её нет, иначе она «телепортируется» вслед за игроком */
  const B=(typeof baseAt==="function")?baseAt(G.sx,G.sy,S.p.idx):null;
  if(B)
    out.push({kind:"base",ru:"ВАША БАЗА",lvl:(B.cells?Object.keys(B.cells).length:1)});
  /* ── дома здесь больше нет, и это не потеря ──
     Плейтест 30.08.2026: «дом как говно нарисован… и тут получается в дом не
     зайти… проверь метки: дом рядом, а показывает 2000 метров».
     Все три жалобы — про одно: дом рисовался ДВАЖДЫ и в РАЗНЫХ местах. Здесь,
     на `builtSpot`, стояла коробка со скатом и подписью «ВАШ ДОМ · ступеней N»
     — заготовка тех времён, когда дома снаружи ещё не было; а настоящий дом с
     террасой, двором, гаражом и светом в окне (M170, `21f-home-out`) стоял на
     своём `homeSpotX`, за пару тысяч метров отсюда. Маркер навигатора и дверь
     считаются от НАСТОЯЩЕГО дома — поэтому у коробки не было двери, а стрелка
     звала прочь от неё.
     Это место дома не знает и знать не должно: у него свой модуль. Здесь
     остаётся только база — снаружи её больше никто не рисует. */
  return out;
}
/* место постройки на профиле: детерминировано от seed планеты, поэтому
   возвращаться к своей базе всегда приходится в одно и то же место */
function builtSpot(tr,p,kind){
  const r=rng(hashi(p.seed,kind==="home"?0x40E:0xBA5,11));
  /* Ровное место, а не случайный индекс: база висела над обрывом. Ищем участок
     с наименьшим перепадом на ширине постройки — так строят и в жизни. */
  const half=Math.max(3,Math.round(70/tr.step));
  const from=Math.floor(tr.N*.14),to=Math.floor(tr.N*.86);
  let best=null;
  for(let k=0;k<28;k++){
    const i=clamp(from+Math.floor(r()*(to-from)),half,tr.N-half-1);
    let lo=1e9,hi=-1e9;
    for(let j=i-half;j<=i+half;j++){lo=Math.min(lo,tr.h[j]);hi=Math.max(hi,tr.h[j]);}
    const flat=hi-lo;
    if(!best||flat<best.flat)best={i,flat};
    if(flat<6)break;                    // достаточно ровно — дальше не ищем
  }
  const i=best.i;
  /* ставим на самую высокую точку площадки: лучше пусть подножие уйдёт
     в грунт, чем постройка повиснет над ямой */
  let y=-1e9;
  for(let j=i-half;j<=i+half;j++)y=Math.max(y,tr.h[j]);
  return {x:i*tr.step,y};
}
function drawBuilt(tr,camx,camy,p){
  const list=builtHere();if(!list.length)return;
  for(const b of list){
    const sp=builtSpot(tr,p,b.kind);
    const x=sp.x-camx,y=sp.y-camy;
    if(x<-360||x>W+360)continue;
    const hgt=150;
    if(builtGpu(b,sp,tr,p,x,y,hgt))continue;
    ctx.save();ctx.globalAlpha=.7;
    groundShadow(x-60,y+2,140,7);
    ctx.restore();
    /* клип по профилю: постройка стоит НА земле — ниже линии грунта её нет */
    const i0=clamp(Math.floor((camx-40)/tr.step),0,tr.N-1);
    const i1=clamp(Math.ceil((camx+W+40)/tr.step),0,tr.N-1);
    const SKY=new Path2D();
    SKY.moveTo(i0*tr.step-camx,-4000);
    for(let i=i0;i<=i1;i++)SKY.lineTo(i*tr.step-camx,tr.h[i]-camy+8);
    SKY.lineTo(i1*tr.step-camx,-4000);
    SKY.closePath();
    ctx.save();ctx.clip(SKY);
    ctx.translate(x,y);
    drawBaseBuilding(b,hgt);
    ctx.restore();
    /* подпись: постройку видно издалека, но чья она — только по метке */
    /* подпись на подложке и выше конька: голый текст тонул в небе и налезал
       на строку планеты */
    const col="143,208,138";
    ctx.font="9px ui-monospace,monospace";ctx.textAlign="center";
    const lab=b.ru+" · ячеек "+b.lvl;
    const tw=ctx.measureText(lab).width;
    const ly=y-hgt-30;
    ctx.fillStyle="rgba(6,10,16,.8)";ctx.fillRect(x-tw/2-6,ly-10,tw+12,15);
    ctx.strokeStyle="rgba("+col+",.5)";ctx.lineWidth=1;
    ctx.strokeRect(x-tw/2-5.5,ly-9.5,tw+11,14);
    ctx.fillStyle="rgba("+col+",.95)";ctx.fillText(lab,x,ly);
    ctx.strokeStyle="rgba("+col+",.35)";                    // выноска к крыше
    ctx.beginPath();ctx.moveTo(x,ly+5);ctx.lineTo(x,y-hgt*.82-3);ctx.stroke();
  }
}
/* ── ангар базы ──
   Куб на опорах, шлюз, мачта связи и панели: то же, что игрок видит в разрезе
   (`21a-mode-base`), только снаружи и целиком. */
/* с видеокартой (G15): тело печётся раз на свет и ложится в слой стоящего — тень
   и свет мира от него, как от находок; мигалка мачты живая, поверх выпечки;
   подпись — в слой интерфейса (#ovl), тем же рисунком, что 2D */
function builtGpu(b,sp,tr,p,x,y,hgt){
  if(typeof GPU==="undefined"||!GPU.ok||!GPU.on||!GPU.enc||typeof SUN_DIR!=="object")return false;
  const gp=standPass();if(!gp)return false;
  const o=lifeHere(0,0),hw=136,top=Math.ceil(hgt*1.2+12);
  const k=p.seed+"|"+sp.x+"|"+sp.y+"|"+b.lvl+"|d"+dayKq(p)+"|a"+sunAzQ(p)+"|"+DPR+"|"+SCK;
  const shs=[poiShadowRect(x+10,y+2,70,3.5,.7,o)];
  standAdd((ps,bl,layer)=>{if(!layer)gpuImage(ps,poiShadowTex(),shs);});
  bakeStand(bakeAt("built|"+b.kind,k,hw,top,12,g=>{
    groundClip(g,tr,sp.x,sp.y,hw,top,8);
    drawBaseBuilding(b,hgt,true);
    poiLight(g,{h:hgt},hw,top,p,tr,sp.x,sp.y);
  }),x,y);
  const M=builtMast(hgt),m=lifeHere(x+M.x,y+M.y),on=Math.sin(G.t*.2)>0;
  const L=[[1,m.x,m.y,2.6*m.s,0,0,0,255,90,70,on?.95:.25]];
  if(on)L.unshift([1,m.x,m.y,7*m.s,0,0,5*m.s,255,90,70,.22]);   /* ореол горящей мигалки */
  standAdd((ps,bl)=>gpuShapes(ps,L,{blend:bl}));
  /* подпись на подложке и выноска к крыше */
  const col="143,208,138",lab=b.ru+" · ячеек "+b.lvl,ly=y-hgt-30;
  const a=lifeHere(x,ly),s=a.s;
  domLabel("built|"+b.kind,a.x,a.y,lab,+(9*s).toFixed(2)+"px ui-monospace,monospace","rgba("+col+",.95)","center",1);
  const e=OVL.lab.get("built|"+b.kind);
  if(e){
    const x0=e.x0-6*s,x1=e.x1+6*s,y0=a.y-10*s,y1=a.y+5*s,t=s,bc="rgba("+col+",.5)";
    ovRect(x0,y0,x1,y1,"rgba(6,10,16,.8)",1);
    ovRect(x0,y0,x1,y0+t,bc,1);ovRect(x0,y1-t,x1,y1,bc,1);
    ovRect(x0,y0,x0+t,y1,bc,1);ovRect(x1-t,y0,x1,y1,bc,1);
  }
  const r=lifeHere(x,y-hgt*.82-3);
  ovRect(a.x-.5*s,a.y+5*s,a.x+.5*s,r.y,"rgba("+col+",.35)",1);
  return true;
}
/* мачта базы: подножие на крыше и мигалка — одно место для 2D и для живой мигалки */
function builtMast(h){return {x0:104*.22+8,y0:-h*.82-4.5,x:104*.25+8,y:-h*1.12};}
function drawBaseBuilding(b,hgt,still){
  const w=104,h=hgt,d=16,e=-9;            // глубина: грань уходит вправо-вверх
  const hw=w/2,hr=h*.62,ht=h*.82,wt=w*.3;
  const poly=(pts,f)=>{ctx.beginPath();ctx.moveTo(pts[0],pts[1]);
    for(let i=2;i<pts.length;i+=2)ctx.lineTo(pts[i],pts[i+1]);ctx.closePath();ctx.fillStyle=f;ctx.fill();};
  /* солнечные панели на стойках — до корпуса, они стоят за ним */
  for(let i=0;i<3;i++){
    const cx=-hw-18-i*22,cy=-h*.17-i*3;
    ctx.strokeStyle="rgba(40,48,58,1)";ctx.lineWidth=1.8;
    ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,cy);ctx.stroke();
    poly([cx-11,cy+4,cx+10,cy-6,cx+11,cy-1,cx-10,cy+9],"rgba(34,58,96,1)");
    ctx.strokeStyle="rgba(127,176,230,.8)";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(cx-11,cy+4);ctx.lineTo(cx+10,cy-6);ctx.stroke();
    ctx.strokeStyle="rgba(127,176,230,.25)";
    for(const t of [-.33,.33]){ctx.beginPath();ctx.moveTo(cx+t*21-.5,cy-t*10-1);ctx.lineTo(cx+t*21+.5,cy-t*10+4);ctx.stroke();}
  }
  /* опоры: без них куб лежит на грунте брюхом */
  ctx.fillStyle="rgba(30,36,46,1)";
  for(const sd of [-1,1])ctx.fillRect(sd*w*.36-4,-h*.12,8,h*.12);
  /* боковая грань и крыша — объём; лицо рисуется последним и перекрывает стык */
  poly([hw,-h*.1,hw+d,-h*.1+e,hw+d,-hr+e,hw,-hr],"rgba(22,27,36,1)");
  poly([hw,-hr,wt,-ht,wt+d,-ht+e,hw+d,-hr+e],"rgba(44,53,66,1)");
  poly([-wt,-ht,wt,-ht,wt+d,-ht+e,-wt+d,-ht+e],"rgba(84,98,114,1)");
  const g=ctx.createLinearGradient(0,-h,0,0);
  g.addColorStop(0,"rgba(62,75,90,1)");g.addColorStop(1,"rgba(28,34,44,1)");
  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.moveTo(-hw,-h*.1);ctx.lineTo(-hw,-hr);ctx.lineTo(-wt,-ht);
  ctx.lineTo(wt,-ht);ctx.lineTo(hw,-hr);ctx.lineTo(hw,-h*.1);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgba(143,208,138,.35)";ctx.lineWidth=1.4;ctx.stroke();
  /* швы этажей — корпус собран из колец, а не отлит */
  ctx.fillStyle="rgba(0,0,0,.22)";
  for(let r=1;r<4;r++)ctx.fillRect(-hw+2,-h*.1-r*h*.13,w-4,1);
  ctx.fillStyle="rgba(255,255,255,.06)";
  for(let r=1;r<4;r++)ctx.fillRect(-hw+2,-h*.1-r*h*.13+1,w-4,1);
  /* ряды окон: свет изнутри — единственное, что говорит «тут живут» */
  for(let r=0;r<3;r++)for(let c=0;c<5;c++){
    const on=((r*5+c)%3)!==1,x=-w*.36+c*w*.17,y=-h*.7+r*h*.18;
    if(on){ctx.fillStyle="rgba(255,196,130,.10)";ctx.fillRect(x-3,y-3,16,13);}
    ctx.fillStyle="rgba(12,16,22,1)";ctx.fillRect(x-1,y-1,12,9);
    ctx.fillStyle=on?"rgba(255,226,180,.82)":"rgba(26,34,44,1)";
    ctx.fillRect(x,y,10,7);
    if(on){ctx.fillStyle="rgba(255,244,220,.5)";ctx.fillRect(x,y,10,2);}
  }
  ctx.fillStyle="rgba(18,22,30,1)";                    // шлюз
  ctx.fillRect(-13,-h*.24,26,h*.24-h*.1);
  ctx.fillStyle="rgba(143,208,138,.55)";ctx.fillRect(-13,-h*.24,26,2);
  ctx.fillStyle="rgba(143,208,138,.18)";ctx.fillRect(-1,-h*.24+4,2,h*.14-6);
  /* мачта стоит на крыше: короб, ствол, поперечина */
  const M=builtMast(h),mx0=M.x0,my0=M.y0;
  ctx.fillStyle="rgba(36,43,54,1)";ctx.fillRect(mx0-5,my0-5,10,6);
  ctx.strokeStyle="rgba(120,140,160,.8)";ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(mx0,my0-5);ctx.lineTo(M.x,M.y+2.6);ctx.stroke();
  const my=lerp(my0,M.y,.55),mx=lerp(mx0,M.x,.55);
  ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(mx-6,my);ctx.lineTo(mx+6,my);ctx.stroke();
  if(!still){            /* выпечка (builtGpu) мигалку не держит — она живая, поверх */
    ctx.fillStyle=(Math.sin(G.t*.2)>0)?"rgba(255,90,70,.95)":"rgba(255,90,70,.25)";
    ctx.beginPath();ctx.arc(M.x,M.y,2.6,0,TAU);ctx.fill();
  }
}
