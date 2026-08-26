/* ══════════════ дом изнутри: кадр ══════════════
   M170. Ход и жильцы — в 29c, здесь только растр. Порядок слоёв тот же, что в
   базе и кантине: дальняя стена → пол и потолок → перегородки с проёмами →
   обстановка комнаты → жильцы → хозяин → свет. Свет один на комнату: лампа
   под потолком, и всё ей подчиняется. */
function hinPal(){
  return {wall:[52,46,44],wood:[96,72,50],metal:[104,112,120],floor:[62,50,40]};
}
function drawHomeIn(){
  const S=G.hin;if(!S)return;
  const P=hinPal(),R=hinRooms();
  if(!R.length){exitHomeIn();return;}
  /* масштаб по высоте комнаты: человек в доме крупнее, чем на поверхности —
     здесь на него смотрят, а не идут мимо */
  /* Ближе, чем было: при 2.4 комната занимала нижнюю треть кадра, а над ней
     висела пустота. Теперь дом заполняет кадр — комната, перекрытие и скат
     видны разом, и человек в доме крупнее, чем на улице, как и задумано. */
  const k=clamp(H/(HIN_ROOM_H+HIN_MAN*2.6),1,3.2);
  const vw=W/k;
  /* камера ходит по ТОЙ ЖЕ полосе, что и человек: наверху она короче и
     начинается не с нуля, и без этого верх уезжал бы в пустой левый край */
  const cLo=R[0].x-30, cHi=Math.max(cLo,R[R.length-1].x+R[R.length-1].w-vw+30);
  const want=clamp(S.x-vw*.5,cLo,cHi);
  S.cam+=(want-S.cam)*.12;
  const camx=S.cam;
  ctx.fillStyle="#0a0808";ctx.fillRect(0,0,W,H);
  ctx.save();ctx.scale(k,k);
  ctx.translate(-camx,H/k-HIN_MAN*.9);
  const fy=0, ceil=-HIN_ROOM_H;
  /* оболочка (29e): чердак или комната сверху и лаги снизу. Рисуется ПЕРВОЙ —
     это то, что за стеной комнаты, а не поверх неё */
  if(typeof hinDrawShell==="function")hinDrawShell(R,camx,vw,fy,ceil,P,S.up|0);
  /* ── дальняя стена ── */
  const wg=ctx.createLinearGradient(0,ceil,0,fy);
  wg.addColorStop(0,"rgb("+P.wall.map(v=>v*.7|0).join(",")+")");
  wg.addColorStop(.6,"rgb("+P.wall.join(",")+")");
  wg.addColorStop(1,"rgb("+P.wall.map(v=>v*.82|0).join(",")+")");
  ctx.fillStyle=wg;ctx.fillRect(camx-40,ceil,vw+80,HIN_ROOM_H);
  const rr=rng(0x40F5);
  for(let x=Math.floor((camx-40)/64)*64;x<camx+vw+64;x+=64){
    ctx.fillStyle="rgba(255,255,255,.015)";ctx.fillRect(x,ceil+6,60,HIN_ROOM_H-6);
    ctx.fillStyle="rgba(0,0,0,.22)";ctx.fillRect(x+60,ceil+6,2,HIN_ROOM_H-6);
  }
  for(let i=0;i<70;i++){
    ctx.fillStyle="rgba(0,0,0,"+(.03+rr()*.05).toFixed(3)+")";
    ctx.fillRect(camx-40+rr()*(vw+80),ceil+8+rr()*(HIN_ROOM_H-16),1.4,1.4);
  }
  ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(camx-40,ceil,vw+80,7);
  ctx.fillStyle="rgba(255,255,255,.05)";ctx.fillRect(camx-40,ceil+7,vw+80,1.2);
  /* ── членение стены по высоте (M173) ──
     Комнаты читались складом, и дело было не в числе: потолок в два с
     половиной роста нормален для дома. Стена была ГОЛОЙ от пояса до потолка,
     а высоту глаз меряет по вещам, а не по краске. Панель по пояс, полка её
     карниза и балка под потолком дают три горизонтали — и комната сразу
     становится комнатой, ничего больше не двигая. */
  {
    const dad=fy-HIN_MAN*.62;                       /* верх панели: по пояс */
    ctx.fillStyle="rgba(0,0,0,.16)";
    ctx.fillRect(camx-40,dad,vw+80,fy-dad);
    ctx.fillStyle="rgb("+P.wood.map(v=>v*.5|0).join(",")+")";
    ctx.fillRect(camx-40,dad-2.4,vw+80,3.4);
    ctx.fillStyle="rgba(255,236,200,.10)";
    ctx.fillRect(camx-40,dad-2.4,vw+80,1);
    /* плинтус: без него панель висит, а пол и стена сливаются в один тон */
    ctx.fillStyle="rgb("+P.wood.map(v=>v*.42|0).join(",")+")";
    ctx.fillRect(camx-40,fy-HIN_MAN*.07,vw+80,HIN_MAN*.07);
    /* балка под потолком — на неё же садится тень от лампы */
    const bm=ceil+HIN_MAN*.30;
    ctx.fillStyle="rgb("+P.wood.map(v=>v*.44|0).join(",")+")";
    ctx.fillRect(camx-40,bm,vw+80,HIN_MAN*.11);
    ctx.fillStyle="rgba(0,0,0,.3)";ctx.fillRect(camx-40,bm+HIN_MAN*.11,vw+80,2.6);
    ctx.fillStyle="rgba(255,236,200,.07)";ctx.fillRect(camx-40,bm,vw+80,1.2);
  }
  /* ── пол ── */
  const fg=ctx.createLinearGradient(0,fy-2,0,fy+HIN_MAN*.8);
  fg.addColorStop(0,"rgb("+P.floor.map(v=>Math.min(255,v*1.15)|0).join(",")+")");
  fg.addColorStop(1,"rgb("+P.floor.map(v=>v*.7|0).join(",")+")");
  ctx.fillStyle=fg;ctx.fillRect(camx-40,fy,vw+80,HIN_MAN*.9);
  ctx.strokeStyle="rgba(0,0,0,.30)";ctx.lineWidth=1;
  for(let x=Math.floor((camx-40)/26)*26;x<camx+vw+40;x+=26){
    ctx.beginPath();ctx.moveTo(x,fy);ctx.lineTo(x-6,fy+HIN_MAN*.9);ctx.stroke();
  }
  ctx.fillStyle="rgba(0,0,0,.34)";ctx.fillRect(camx-40,fy,vw+80,2.4);
  /* ── свет ДО обстановки ──
     Конус, положенный последним, читался плёнкой поверх мебели: он лежал на
     витрине и на станке, будто они прозрачные (самокритика M170). Свет падает
     на пол и стену, а вещи стоят В НЁМ — значит, рисуется он раньше вещей. */
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(const r of R){
    const lx=r.x+r.w*.5;
    if(lx<camx-100||lx>camx+vw+100)continue;
    const cg=ctx.createLinearGradient(0,ceil+HIN_MAN*.62,0,0);
    cg.addColorStop(0,"rgba(255,206,138,.22)");
    cg.addColorStop(.7,"rgba(255,196,130,.08)");
    cg.addColorStop(1,"rgba(255,180,110,0)");
    ctx.fillStyle=cg;
    ctx.beginPath();
    ctx.moveTo(lx-HIN_MAN*.22,ceil+HIN_MAN*.62);ctx.lineTo(lx+HIN_MAN*.22,ceil+HIN_MAN*.62);
    ctx.lineTo(lx+HIN_MAN*1.5,0);ctx.lineTo(lx-HIN_MAN*1.5,0);ctx.closePath();ctx.fill();
    const fgl=ctx.createRadialGradient(lx,0,2,lx,0,HIN_MAN*1.7);
    fgl.addColorStop(0,"rgba(255,206,138,.24)");
    fgl.addColorStop(1,"rgba(255,180,110,0)");
    ctx.fillStyle=fgl;
    ctx.beginPath();ctx.ellipse(lx,0,HIN_MAN*1.7,HIN_MAN*.32,0,0,TAU);ctx.fill();
  }
  ctx.restore();
  /* ── обстановка ── */
  for(const r of R){
    if(r.x+r.w<camx-60||r.x>camx+vw+60)continue;
    hinRoomStuff(r,fy,ceil,P);
  }
  /* ── перегородки с проёмами ── */
  for(let i=1;i<R.length;i++){
    const x=R[i].x;
    ctx.fillStyle="rgb("+P.wall.map(v=>v*.55|0).join(",")+")";
    ctx.fillRect(x-4,ceil+6,8,HIN_ROOM_H-6);
    ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(x-4,ceil+6,2,HIN_ROOM_H-6);
    /* В проёме видно СОСЕДНЮЮ КОМНАТУ: стена в своей тени, полоска её пола и
       тёплый отсвет её лампы. Чёрный прямоугольник читался шкафом, а не
       проходом (самокритика M170). */
    ctx.save();
    ctx.beginPath();ctx.rect(x-HIN_DOORW*.5,fy-HIN_MAN*1.5,HIN_DOORW,HIN_MAN*1.5);ctx.clip();
    ctx.fillStyle="rgb("+P.wall.map(v=>v*.5|0).join(",")+")";
    ctx.fillRect(x-HIN_DOORW*.5,fy-HIN_MAN*1.5,HIN_DOORW,HIN_MAN*1.5);
    ctx.fillStyle="rgb("+P.floor.map(v=>v*.55|0).join(",")+")";
    ctx.fillRect(x-HIN_DOORW*.5,fy-HIN_MAN*.18,HIN_DOORW,HIN_MAN*.18);
    const dg=ctx.createLinearGradient(0,fy-HIN_MAN*1.5,0,fy);
    dg.addColorStop(0,"rgba(255,206,138,.03)");
    dg.addColorStop(.75,"rgba(255,206,138,.10)");
    dg.addColorStop(1,"rgba(255,206,138,.20)");
    ctx.fillStyle=dg;ctx.fillRect(x-HIN_DOORW*.5,fy-HIN_MAN*1.5,HIN_DOORW,HIN_MAN*1.5);
    ctx.fillStyle="rgba(0,0,0,.34)";                 /* тень косяка внутрь */
    ctx.fillRect(x-HIN_DOORW*.5,fy-HIN_MAN*1.5,3,HIN_MAN*1.5);
    ctx.fillRect(x-HIN_DOORW*.5,fy-HIN_MAN*1.5,HIN_DOORW,3);
    ctx.restore();
    ctx.strokeStyle="rgba(226,226,220,.16)";ctx.lineWidth=1.4;
    ctx.strokeRect(x-HIN_DOORW*.5,fy-HIN_MAN*1.5,HIN_DOORW,HIN_MAN*1.5);
  }
  /* входная дверь слева — только на первом этаже: наверху выхода во двор нет */
  if(!S.up){
    ctx.fillStyle="rgb("+P.wood.map(v=>v*.6|0).join(",")+")";
    ctx.fillRect(-2,fy-HIN_MAN*1.6,HIN_DOORW*.9,HIN_MAN*1.6);
    ctx.strokeStyle="rgba(226,226,220,.2)";ctx.lineWidth=1.4;
    ctx.strokeRect(-2,fy-HIN_MAN*1.6,HIN_DOORW*.9,HIN_MAN*1.6);
    ctx.fillStyle="rgba(255,232,190,.6)";
    ctx.fillRect(HIN_DOORW*.9-6,fy-HIN_MAN*.85,2.4,2.4);
  }
  /* лестница: снизу марш, сверху проём в полу (29e, M178-9) */
  if(typeof hinHasUp==="function"&&hinHasUp()){
    if(S.up)hinDrawHole(fy,P);
    else hinDrawStair(fy,ceil,P);
  }
  {
    const x=R[R.length-1].x+R[R.length-1].w;
    ctx.fillStyle="rgb("+P.wall.map(v=>v*.42|0).join(",")+")";
    ctx.fillRect(x,ceil+6,80,HIN_ROOM_H-6);
    ctx.strokeStyle="rgba(0,0,0,.3)";ctx.lineWidth=1;
    for(let yy=ceil+10;yy<fy;yy+=9)
      for(let xx=x+((((yy-ceil)/9)|0)%2?6:0);xx<x+80;xx+=18)ctx.strokeRect(xx+.5,yy+.5,16,8);
  }
  /* ── жильцы и хозяин ── */
  /* У каждого своя глубина (M173): раньше все стояли на одной линии, и пятеро
     в комнате читались рядом одинаковых вырезок. Кто дальше — выше, мельче и
     глуше; разница маленькая, но именно она превращает ряд в компанию. */
  for(const f of S.folk){
    if((f.up|0)!==(S.up|0))continue;      /* каждый на своём этаже (M178-9) */
    if(f.x<camx-40||f.x>camx+vw+40)continue;
    const z=f.z||0;
    ctx.save();
    ctx.translate(f.x,fy-z*HIN_MAN*.13);ctx.scale(1-z*.10,1-z*.10);
    ctx.globalAlpha=1-z*.22;
    hinFigure(0,0,f.col,f.face,f.pose,f.walk||0,f.name,f.look);
    ctx.restore();
  }
  hinFigure(S.x,fy,[214,222,228],S.face,(keys.left||keys.right)?"walk":"stand",S.walk,null);
  /* ── передний план (M173) ──
     Комната была одной плоскостью: стена, вещи у стены, человек — и всё на
     одной глубине. Пара предметов БЛИЖЕ человека, обрезанных нижней кромкой
     кадра, дают комнате перед и зад одним движением. Рисуются после людей —
     иначе они не спереди. */
  for(const r of R){
    if(r.x+r.w<camx-80||r.x>camx+vw+80)continue;
    hinFrontStuff(r,fy,P);
  }
  /* ── свет: по лампе на комнату ── */
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(const r of R){
    const lx=r.x+r.w*.5;
    if(lx<camx-100||lx>camx+vw+100)continue;
    /* поверх остаётся только мягкий тёплый отсвет вокруг самой лампы: он
       ложится и на вещи, и на людей — это воздух комнаты, а не луч */
    const g=ctx.createRadialGradient(lx,ceil+HIN_MAN*.6,4,lx,ceil+HIN_MAN*.6,HIN_ROOM_H*.7);
    g.addColorStop(0,"rgba(255,206,138,.13)");
    g.addColorStop(1,"rgba(255,180,110,0)");
    ctx.fillStyle=g;ctx.fillRect(r.x,ceil,r.w,HIN_ROOM_H+HIN_MAN);
  }
  ctx.restore();
  for(const r of R){
    const lx=r.x+r.w*.5;
    if(lx<camx-100||lx>camx+vw+100)continue;
    ctx.strokeStyle="rgba(30,26,24,.9)";ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(lx,ceil+6);ctx.lineTo(lx,ceil+HIN_MAN*.42);ctx.stroke();
    ctx.fillStyle="rgb("+P.metal.map(v=>v*.7|0).join(",")+")";
    ctx.beginPath();
    ctx.moveTo(lx-HIN_MAN*.24,ceil+HIN_MAN*.62);ctx.lineTo(lx+HIN_MAN*.24,ceil+HIN_MAN*.62);
    ctx.lineTo(lx+HIN_MAN*.1,ceil+HIN_MAN*.42);ctx.lineTo(lx-HIN_MAN*.1,ceil+HIN_MAN*.42);
    ctx.closePath();ctx.fill();
    ctx.fillStyle="rgba(255,214,150,.9)";
    ctx.fillRect(lx-HIN_MAN*.16,ceil+HIN_MAN*.6,HIN_MAN*.32,2.2);
  }
  ctx.restore();
  /* ── строка внимания ── */
  if(S.look){
    const a=clamp(S.lookT/120,0,1);
    ctx.fillStyle="rgba(6,8,12,"+(.72*a).toFixed(2)+")";
    ctx.fillRect(0,H-66,W,46);
    ctx.fillStyle="rgba(242,178,92,"+a.toFixed(2)+")";
    ctx.font="12px ui-monospace,monospace";ctx.textAlign="left";
    ctx.fillText(S.look.ru.toUpperCase(),16,H-45);
    ctx.fillStyle="rgba(214,226,232,"+a.toFixed(2)+")";
    ctx.font="13px ui-monospace,monospace";
    ctx.fillText(S.look.say,16,H-27);
  }
  const room=hinRoomAt(S.x);
  if(room){
    ctx.fillStyle="rgba(127,230,216,.55)";
    ctx.font="10px ui-monospace,monospace";ctx.textAlign="left";
    ctx.fillText(room.ru.toUpperCase(),12,26);
  }
}
/* ── передний план комнаты (M173) ──
   Одна-две вещи БЛИЖЕ человека, срезанные нижней кромкой. Их задача не быть
   разглядёнными, а закрыть край кадра и дать глазу первый план: без него
   комната — плоская декорация с фигурой, наклеенной поверх. Поэтому они
   крупнее, темнее и без мелких деталей. */
function hinFrontStuff(r,fy,P){
  const M=HIN_MAN, at=t=>r.x+r.w*t;
  const y0=fy+M*.30;                        /* стоят ближе — значит ниже */
  const dk=k=>"rgb("+P.wood.map(v=>v*k|0).join(",")+")";
  const mk=k=>"rgb("+P.metal.map(v=>v*k|0).join(",")+")";
  ctx.save();
  if(r.key==="hall"||r.key==="living"||r.key==="corner"||r.key==="bed"){
    /* спинка стула: узнаётся силуэтом и не спорит с тем, что у стены */
    const x=at(r.key==="living"?.24:(r.key==="bed"?.14:.18)), w=M*.52, h=M*.82;
    ctx.fillStyle=dk(.34);
    ctx.fillRect(x-w*.5,y0-h,w,h*.42);
    ctx.fillRect(x-w*.5,y0-h*.42,w*.13,h*.42);
    ctx.fillRect(x+w*.5-w*.13,y0-h*.42,w*.13,h*.42);
    ctx.fillStyle="rgba(255,236,200,.07)";ctx.fillRect(x-w*.5,y0-h,w,2);
  }
  if(r.key==="shop"||r.key==="garage"||r.key==="dock"){
    /* торец верстака: горизонталь во всю ширину переднего плана */
    const x=at(.62), w=M*1.5, h=M*.66;
    ctx.fillStyle=mk(.34);
    ctx.fillRect(x-w*.5,y0-h,w,h*.30);
    ctx.fillStyle=mk(.24);
    ctx.fillRect(x-w*.5+3,y0-h*.70,w*.09,h*.70);
    ctx.fillRect(x+w*.5-3-w*.09,y0-h*.70,w*.09,h*.70);
    ctx.fillStyle="rgba(226,236,240,.06)";ctx.fillRect(x-w*.5,y0-h,w,1.8);
  }
  if(r.key==="study"||r.key==="hold"||r.key==="loft"){
    /* угол ящика: простой параллелепипед, но он и нужен только силуэтом */
    const x=at(r.key==="loft"?.16:.80), w=M*.9, h=M*.55;
    ctx.fillStyle=dk(.30);ctx.fillRect(x-w*.5,y0-h,w,h);
    ctx.fillStyle="rgba(0,0,0,.28)";ctx.fillRect(x-w*.5,y0-h,w,3);
    ctx.fillStyle="rgba(255,236,200,.05)";ctx.fillRect(x-w*.5,y0-h+3,w,1.4);
  }
  ctx.restore();
}
/* ── обстановка комнаты ──
   Каждая ступень — свои вещи на своих местах; координаты те же, что у зон
   внимания (HIN_THINGS в 29c), иначе подойти можно к пустому месту. */
function hinRoomStuff(r,fy,ceil,P){
  /* верхние комнаты обставляет свой модуль (29e): здесь он зовётся первым и
     на ключах первого этажа ничего не трогает */
  if(typeof hinUpStuff==="function"&&hinUpStuff(r,fy,ceil,P))return;
  /* Пол и стены комнаты — не общая заливка на весь дом: у мастерской пол в
     масляных пятнах, у жилой части ковёр, у гаража бетон с колеёй. Комната
     узнаётся раньше, чем в ней разглядят вещи (проход M170). */
  const M0=HIN_MAN, rr0=rng(hashi(r.x|0,7,0x40F7));
  /* ёлка в жилой комнате (M201): та же, что в кантине, и в те же дни */
  if(r.key==="living"&&typeof holTreeUp==="function"&&holTreeUp()&&typeof holTree==="function")
    holTree(ctx,r.x+r.w*0.84,fy,HIN_MAN*1.05,"rgba(236,214,150,.5)");
  if(r.key==="living"){
    ctx.fillStyle="rgba(122,72,58,.55)";
    ctx.fillRect(r.x+r.w*.16,fy+2,r.w*.68,M0*.5);
    ctx.fillStyle="rgba(200,170,130,.18)";
    ctx.fillRect(r.x+r.w*.16,fy+2,r.w*.68,2);
    for(let i=0;i<5;i++)ctx.fillRect(r.x+r.w*.2+i*r.w*.13,fy+M0*.16,r.w*.05,2);
  }else if(r.key==="shop"||r.key==="garage"){
    ctx.fillStyle="rgba(30,28,26,.35)";
    ctx.fillRect(r.x+2,fy,r.w-4,M0*.9);
    ctx.fillStyle="rgba(12,10,10,.25)";
    for(let i=0;i<9;i++)
      ctx.beginPath(),ctx.ellipse(r.x+8+rr0()*(r.w-16),fy+M0*.2+rr0()*M0*.5,
        3+rr0()*7,1.6+rr0()*2.4,0,0,TAU),ctx.fill();
  }else if(r.key==="dock"){
    ctx.fillStyle="rgba(60,66,72,.5)";
    ctx.fillRect(r.x+2,fy,r.w-4,M0*.9);
    ctx.fillStyle="rgba(226,178,92,.12)";              /* разметка причала */
    for(let i=0;i<6;i++)ctx.fillRect(r.x+10+i*r.w*.16,fy+M0*.3,r.w*.08,2);
  }
  const wood="rgb("+P.wood.join(",")+")";
  const woodD="rgb("+P.wood.map(v=>v*.6|0).join(",")+")";
  const metal="rgb("+P.metal.join(",")+")";
  const at=t=>r.x+r.w*t;
  const M=HIN_MAN;
  ctx.save();
  if(r.key==="corner"){
    ctx.fillStyle="rgb(86,74,70)";
    ctx.fillRect(at(.30)-M*.6,fy-M*.22,M*1.2,M*.22);
    ctx.fillStyle="rgba(226,220,206,.35)";
    ctx.fillRect(at(.30)-M*.6,fy-M*.26,M*1.2,M*.07);
    ctx.fillStyle=woodD;ctx.fillRect(at(.72)-M*.22,fy-M*.42,M*.44,M*.42);
    ctx.fillStyle="rgba(226,236,240,.5)";ctx.fillRect(at(.72)-3,fy-M*.5,6,M*.09);
  }else if(r.key==="hall"){
    ctx.fillStyle=woodD;ctx.fillRect(at(.35)-M*.5,fy-M*1.5,M*1.0,3);
    const cols=["rgba(120,140,150,.9)","rgba(150,120,90,.9)","rgba(90,110,90,.9)"];
    for(let i=0;i<3;i++){
      const hx=at(.35)-M*.36+i*M*.36;
      ctx.fillStyle=metal;ctx.fillRect(hx-1,fy-M*1.5,2,4);
      ctx.fillStyle=cols[i];
      ctx.beginPath();
      ctx.moveTo(hx-M*.14,fy-M*1.44);ctx.lineTo(hx+M*.14,fy-M*1.44);
      ctx.lineTo(hx+M*.18,fy-M*.6);ctx.lineTo(hx-M*.18,fy-M*.6);ctx.closePath();ctx.fill();
    }
    /* сапоги: голенище и подошва, а не два кубика; рядом коврик и ведро —
       по прихожей видно, что в дом заходят с улицы (проход M170) */
    for(const s of [-1,1]){
      const bx2=at(.75)+s*M*.16;
      ctx.fillStyle="rgb(52,44,38)";
      ctx.fillRect(bx2-M*.09,fy-M*.30,M*.18,M*.24);
      ctx.fillStyle="rgb(38,32,28)";
      ctx.fillRect(bx2-M*.12,fy-M*.07,M*.28,M*.07);
      ctx.fillStyle="rgba(255,255,255,.08)";
      ctx.fillRect(bx2-M*.09,fy-M*.30,M*.06,M*.24);
    }
    ctx.fillStyle="rgba(96,70,58,.6)";                /* коврик у двери */
    ctx.fillRect(at(.75)-M*.55,fy+1,M*.5,M*.12);
    ctx.fillStyle="rgba(0,0,0,.25)";
    for(let i=0;i<4;i++)ctx.fillRect(at(.75)-M*.5+i*M*.12,fy+2,M*.05,M*.1);
    ctx.fillStyle="rgb(84,90,96)";                    /* ведро */
    ctx.beginPath();
    ctx.moveTo(at(.55)-M*.13,fy-M*.28);ctx.lineTo(at(.55)+M*.13,fy-M*.28);
    ctx.lineTo(at(.55)+M*.1,fy);ctx.lineTo(at(.55)-M*.1,fy);ctx.closePath();ctx.fill();
    ctx.strokeStyle="rgb(112,120,128)";ctx.lineWidth=1.2;
    ctx.beginPath();ctx.arc(at(.55),fy-M*.28,M*.13,Math.PI,TAU);ctx.stroke();
  }else if(r.key==="garage"){
    /* В гараже стоит НАСТОЯЩИЙ второй корабль, если он там есть (homeStore):
       чехол поверх корпуса, стойки, лужа масла. Пустой гараж — пустой, и это
       честно: обобщённый «катер под чехлом» врал о владении (проход M170). */
    const kept=(G.home&&G.home.garage&&G.home.garage[0])||null;
    const gx2=at(.30);
    ctx.fillStyle="rgba(0,0,0,.3)";
    ctx.beginPath();ctx.ellipse(gx2,fy-2,M*1.5,M*.16,0,0,TAU);ctx.fill();
    if(kept&&typeof drawHull==="function"&&typeof hullOf==="function"){
      /* drawHull рисует корпус примерно в 2.4 длины и 5.2 полуширины (те же
         множители, что в дорожном экране 27k): считать масштаб по «голым»
         len/bw — значит поставить в гараж корабль во всю комнату (M170) */
      const h2=hullOf(kept);
      const sc2=Math.min(M*2.3/(2.4*(h2.len||40)),M*1.0/(5.2*(h2.bw||12)));
      ctx.save();
      /* корпус лежит носом вправо, как на экране корабля: drawHull рисует в
         своих единицах вокруг нуля */
      ctx.translate(gx2,fy-M*.52);ctx.scale(sc2,sc2);
      drawHull(kept,false,false,0,0);
      ctx.restore();
      /* Чехол укрывает НИЗ корпуса, а не весь корабль: под глухой трапецией
         не видно, что там вообще стоит (самокритика M170). Складки по краю и
         растяжки к полу — по ним видно, что он привязан и стоит давно. */
      ctx.fillStyle="rgba(146,152,158,.72)";
      ctx.beginPath();
      ctx.moveTo(gx2-M*1.25,fy-M*.06);
      ctx.quadraticCurveTo(gx2-M*.9,fy-M*.52,gx2-M*.2,fy-M*.5);
      ctx.quadraticCurveTo(gx2+M*.5,fy-M*.48,gx2+M*1.1,fy-M*.06);
      ctx.closePath();ctx.fill();
      ctx.fillStyle="rgba(255,255,255,.09)";
      ctx.beginPath();
      ctx.moveTo(gx2-M*.9,fy-M*.4);ctx.quadraticCurveTo(gx2-M*.2,fy-M*.56,gx2+M*.5,fy-M*.4);
      ctx.lineTo(gx2+M*.4,fy-M*.3);ctx.quadraticCurveTo(gx2-M*.2,fy-M*.44,gx2-M*.85,fy-M*.3);
      ctx.closePath();ctx.fill();
      ctx.strokeStyle="rgba(60,56,52,.7)";ctx.lineWidth=1.2;
      for(const s of [-.9,-.2,.6]){
        ctx.beginPath();
        ctx.moveTo(gx2+M*s,fy-M*.42);ctx.lineTo(gx2+M*s+M*.16,fy);ctx.stroke();
      }
    }else{
      /* пустой гараж: козлы, канистры и пятно на полу — место ЖДЁТ корабль */
      ctx.strokeStyle="rgb("+P.wood.map(v=>v*.6|0).join(",")+")";ctx.lineWidth=2.4;
      for(const s of [-1,1]){
        ctx.beginPath();
        ctx.moveTo(gx2+s*M*.8-M*.2,fy);ctx.lineTo(gx2+s*M*.8,fy-M*.42);
        ctx.lineTo(gx2+s*M*.8+M*.2,fy);ctx.stroke();
      }
      ctx.fillStyle="rgb("+P.wood.map(v=>v*.5|0).join(",")+")";
      ctx.fillRect(gx2-M*1.0,fy-M*.46,M*2.0,M*.06);
      ctx.fillStyle="rgb(96,104,90)";
      for(let i=0;i<3;i++)ctx.fillRect(gx2-M*1.35+i*M*.28,fy-M*.3,M*.2,M*.3);
    }
    ctx.strokeStyle="rgba(0,0,0,.3)";ctx.lineWidth=1;
    for(let i=0;i<5;i++){
      const xx=at(.30)-M*1.3+i*M*.62;
      ctx.beginPath();ctx.moveTo(xx,fy-M*.9);ctx.lineTo(xx-M*.1,fy);ctx.stroke();
    }
    for(let s=0;s<3;s++){
      const yy=fy-M*.5-s*M*.42;
      ctx.fillStyle=woodD;ctx.fillRect(at(.78)-M*.5,yy,M*1.0,3);
      ctx.fillStyle=metal;
      for(let i=0;i<4;i++)ctx.fillRect(at(.78)-M*.44+i*M*.24,yy-M*.2,M*.14,M*.2);
    }
  }else if(r.key==="case"){
    const cw=M*1.4,ch=M*1.6,cx=at(.5);
    ctx.fillStyle=woodD;ctx.fillRect(cx-cw/2,fy-ch,cw,ch);
    ctx.fillStyle="rgba(30,40,46,.9)";ctx.fillRect(cx-cw/2+3,fy-ch+3,cw-6,ch-6);
    const tro=(G.home&&G.home.trophies)||[];
    const tc=["rgba(214,178,96,.9)","rgba(150,196,224,.9)","rgba(196,150,214,.9)"];
    for(let s=0;s<3;s++){
      const yy=fy-ch+M*.44+s*M*.42;
      ctx.fillStyle="rgba(90,80,70,.9)";ctx.fillRect(cx-cw/2+4,yy,cw-8,2);
      for(let i=0;i<3;i++){
        if(s*3+i>=Math.max(2,tro.length))break;
        ctx.fillStyle=tc[(s+i)%3];
        ctx.fillRect(cx-cw/2+8+i*M*.4,yy-M*.24,M*.2,M*.24);
      }
    }
    ctx.fillStyle="rgba(226,246,255,.16)";
    ctx.beginPath();
    ctx.moveTo(cx-cw/2+3,fy-6);ctx.lineTo(cx+cw/2-3,fy-ch+3);
    ctx.lineTo(cx+cw/2-3,fy-ch+12);ctx.lineTo(cx-cw/2+3,fy-2);ctx.closePath();ctx.fill();
  }else if(r.key==="shop"){
    ctx.fillStyle=wood;ctx.fillRect(at(.32)-M*.8,fy-M*.62,M*1.6,M*.14);
    ctx.fillStyle=woodD;
    ctx.fillRect(at(.32)-M*.72,fy-M*.48,M*.12,M*.48);
    ctx.fillRect(at(.32)+M*.6,fy-M*.48,M*.12,M*.48);
    ctx.fillStyle=metal;ctx.fillRect(at(.32)-M*.2,fy-M*.8,M*.34,M*.18);
    ctx.fillStyle="rgba(226,236,240,.3)";ctx.fillRect(at(.32)-M*.2,fy-M*.8,M*.34,2);
    /* станок: станина, шпиндель, маховик и ремень к валу под потолком —
       серый ящик с тёмным квадратом читался холодильником (самокритика M170) */
    const mx2=at(.74);
    ctx.fillStyle="rgb(64,68,74)";                     /* станина на ногах */
    ctx.fillRect(mx2-M*.44,fy-M*.5,M*.88,M*.5);
    ctx.fillStyle="rgb(52,56,62)";
    ctx.fillRect(mx2-M*.4,fy-M*.06,M*.12,M*.06);ctx.fillRect(mx2+M*.28,fy-M*.06,M*.12,M*.06);
    ctx.fillStyle="rgb(84,90,96)";                     /* стол станка */
    ctx.fillRect(mx2-M*.5,fy-M*.58,M*1.0,M*.1);
    ctx.fillStyle="rgba(255,255,255,.10)";ctx.fillRect(mx2-M*.5,fy-M*.58,M*1.0,2);
    ctx.fillStyle="rgb(70,76,82)";                     /* стойка и шпиндель */
    ctx.fillRect(mx2+M*.16,fy-M*1.3,M*.16,M*.74);
    ctx.fillRect(mx2-M*.06,fy-M*1.06,M*.3,M*.12);
    ctx.fillStyle="rgb(120,128,136)";
    ctx.fillRect(mx2+M*.02,fy-M*.94,M*.06,M*.24);
    ctx.strokeStyle="rgb(96,104,112)";ctx.lineWidth=2;  /* маховик */
    ctx.beginPath();ctx.arc(mx2-M*.3,fy-M*.78,M*.13,0,TAU);ctx.stroke();
    ctx.beginPath();ctx.moveTo(mx2-M*.43,fy-M*.78);ctx.lineTo(mx2-M*.17,fy-M*.78);ctx.stroke();
    ctx.strokeStyle="rgba(40,36,32,.8)";ctx.lineWidth=1.6;   /* ремень наверх */
    ctx.beginPath();ctx.moveTo(mx2+M*.2,fy-M*1.3);ctx.lineTo(mx2+M*.24,ceil+M*.9);ctx.stroke();
    ctx.fillStyle="rgba(214,206,180,.16)";              /* стружка под станком */
    for(let i=0;i<7;i++)ctx.fillRect(mx2-M*.5+i*M*.16,fy-2,M*.08,2);
  }else if(r.key==="study"){
    ctx.fillStyle=wood;ctx.fillRect(at(.34)-M*.8,fy-M*.62,M*1.6,M*.12);
    ctx.fillStyle=woodD;ctx.fillRect(at(.34)-M*.7,fy-M*.5,M*1.4,M*.5);
    ctx.fillStyle="rgba(226,226,214,.8)";
    for(let i=0;i<3;i++)ctx.fillRect(at(.34)-M*.5+i*M*.3,fy-M*.68,M*.22,M*.06);
    ctx.fillStyle="rgba(150,196,224,.5)";ctx.fillRect(at(.34)+M*.3,fy-M*.74,M*.22,M*.12);
    ctx.fillStyle="rgba(40,52,60,.95)";
    ctx.fillRect(at(.76)-M*.7,fy-M*1.7,M*1.4,M*.9);
    ctx.strokeStyle="rgba(127,230,216,.35)";ctx.lineWidth=1;
    for(let i=0;i<5;i++){
      const px=at(.76)-M*.6+i*M*.28, py=fy-M*1.6+((i*7)%5)*M*.14;
      ctx.beginPath();ctx.arc(px,py,1.6,0,TAU);ctx.stroke();
    }
    ctx.strokeStyle="rgba(226,120,90,.5)";
    ctx.beginPath();ctx.moveTo(at(.76)-M*.6,fy-M*1.5);ctx.lineTo(at(.76)+M*.4,fy-M*1.2);ctx.stroke();
  }else if(r.key==="living"){
    ctx.fillStyle=woodD;ctx.fillRect(at(.30)-M*.9,fy-M*.46,M*1.8,M*.16);
    ctx.fillStyle="rgb(96,86,80)";ctx.fillRect(at(.30)-M*.9,fy-M*.62,M*1.8,M*.18);
    ctx.fillStyle="rgba(226,220,206,.5)";ctx.fillRect(at(.30)-M*.86,fy-M*.66,M*.5,M*.14);
    ctx.fillStyle=woodD;ctx.fillRect(at(.30)+M*.8,fy-M*1.0,M*.14,M*1.0);
    ctx.fillStyle=wood;ctx.fillRect(at(.70)-M*.7,fy-M*.6,M*1.4,M*.12);
    ctx.fillStyle=woodD;
    ctx.fillRect(at(.70)-M*.6,fy-M*.48,M*.1,M*.48);
    ctx.fillRect(at(.70)+M*.5,fy-M*.48,M*.1,M*.48);
    for(const s of [-1,1]){
      ctx.fillStyle=woodD;
      ctx.fillRect(at(.70)+s*M*.9-M*.12,fy-M*.4,M*.24,M*.4);
      ctx.fillRect(at(.70)+s*M*.9-M*.12,fy-M*.72,M*.06,M*.34);
    }
  }else if(r.key==="dock"){
    ctx.fillStyle="rgb(70,78,86)";ctx.fillRect(at(.40)-M*.5,fy-M*.9,M*1.0,M*.9);
    ctx.fillStyle="rgba(20,26,32,.9)";ctx.fillRect(at(.40)-M*.4,fy-M*.8,M*.8,M*.34);
    ctx.fillStyle="rgba(127,230,216,.6)";
    for(let i=0;i<4;i++)ctx.fillRect(at(.40)-M*.34+i*M*.2,fy-M*.72,M*.12,M*.06);
    ctx.fillStyle="rgba(255,150,90,"+(.4+.5*Math.abs(Math.sin(G.t*.05))).toFixed(2)+")";
    ctx.beginPath();ctx.arc(at(.40)+M*.3,fy-M*.98,3,0,TAU);ctx.fill();
    /* причальные захваты: клешни на станинах, между ними трос и кнехт —
       две палки с перекладиной ни на что не были похожи (проход M170) */
    for(let i=0;i<2;i++){
      const px=at(.78)+i*M*.62;
      ctx.fillStyle="rgb(58,64,70)";
      ctx.fillRect(px-M*.16,fy-M*.16,M*.32,M*.16);
      ctx.fillStyle=metal;
      ctx.fillRect(px-M*.07,fy-M*.66,M*.14,M*.5);
      ctx.beginPath();                                  /* клешня */
      ctx.moveTo(px-M*.22,fy-M*.66);ctx.lineTo(px-M*.05,fy-M*.72);
      ctx.lineTo(px-M*.05,fy-M*.86);ctx.lineTo(px-M*.3,fy-M*.78);ctx.closePath();ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px+M*.22,fy-M*.66);ctx.lineTo(px+M*.05,fy-M*.72);
      ctx.lineTo(px+M*.05,fy-M*.86);ctx.lineTo(px+M*.3,fy-M*.78);ctx.closePath();ctx.fill();
      ctx.fillStyle="rgba(226,178,92,.5)";
      ctx.fillRect(px-M*.05,fy-M*.5,M*.1,M*.06);
    }
    ctx.strokeStyle="rgba(90,80,70,.9)";ctx.lineWidth=2.2;   /* трос между ними */
    ctx.beginPath();
    ctx.moveTo(at(.78),fy-M*.62);
    ctx.quadraticCurveTo(at(.78)+M*.31,fy-M*.34,at(.78)+M*.62,fy-M*.62);
    ctx.stroke();
  }
  ctx.restore();
  void ceil;
}
/* ── человек в доме ──
   Тот же язык, что у жителей посёлка (12tb): плечи, руки при деле, ноги в
   шаге. Здесь он крупнее, поэтому есть голова с затылком и наклон корпуса. */
function hinFigure(x,fy,col,face,pose,walk,name,look){
  const M=HIN_MAN;
  const c="rgb("+col.map(v=>v|0).join(",")+")";
  const dark="rgb("+col.map(v=>v*.55|0).join(",")+")";
  const sit=pose==="sit";
  const h=sit?M*.76:M;
  ctx.save();
  ctx.translate(x,fy);
  ctx.fillStyle="rgba(0,0,0,.32)";
  ctx.beginPath();ctx.ellipse(0,0,M*.34,M*.09,0,0,TAU);ctx.fill();
  ctx.scale(face<0?-1:1,1);
  const hipY=-h*.46,shY=-h*.80;
  ctx.strokeStyle=dark;ctx.lineWidth=M*.10;ctx.lineCap="round";
  if(sit){
    ctx.beginPath();ctx.moveTo(0,hipY);ctx.lineTo(M*.26,hipY+M*.02);ctx.lineTo(M*.3,0);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,hipY);ctx.lineTo(M*.2,hipY+M*.04);ctx.lineTo(M*.22,0);ctx.stroke();
  }else{
    /* Стоящий человек стоит НА ДВУХ НОГАХ: при нулевом шаге обе линии ложились
       одна на другую и получалась одна толстая палка — пешка, а не человек
       (самокритика M170). Ноги врозь, колено согнуто, ступня своя у каждой. */
    const st=pose==="walk"?Math.sin(walk)*M*.20:M*.07;
    for(const s of [1,-1]){
      const foot=s>0?st:-st;
      ctx.beginPath();
      ctx.moveTo(s*M*.05,hipY);
      ctx.lineTo(foot*.6+s*M*.04,-M*.22);
      ctx.lineTo(foot,0);
      ctx.stroke();
      ctx.fillStyle=dark;                            /* ступня */
      ctx.fillRect(foot-M*.03,-M*.04,M*.13,M*.05);
    }
  }
  /* корпус с плечами и шеей; рука темнее корпуса, иначе она в нём тонет.
     У кого платье (Вега) — юбка от пояса: силуэт узнаётся раньше лица */
  ctx.fillStyle=c;
  ctx.beginPath();
  ctx.moveTo(-M*.155,shY+M*.02);ctx.quadraticCurveTo(0,shY-M*.06,M*.155,shY+M*.02);
  if(look&&look.skirt){
    ctx.lineTo(M*.22,hipY+M*.16);ctx.lineTo(-M*.22,hipY+M*.16);
  }else{
    ctx.lineTo(M*.12,hipY);ctx.lineTo(-M*.12,hipY);
  }
  ctx.closePath();ctx.fill();
  ctx.fillStyle="rgba(0,0,0,.22)";ctx.fillRect(-M*.12,hipY-M*.05,M*.24,M*.05);
  ctx.fillStyle="rgba(0,0,0,.16)";                 /* ворот */
  ctx.beginPath();
  ctx.moveTo(-M*.06,shY);ctx.lineTo(M*.06,shY);ctx.lineTo(0,shY+M*.07);ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgb("+col.map(v=>v*.78|0).join(",")+")";ctx.lineWidth=M*.075;
  if(pose==="work"){
    ctx.beginPath();ctx.moveTo(M*.1,shY+M*.06);ctx.lineTo(M*.3,shY+M*.3);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-M*.1,shY+M*.06);ctx.lineTo(M*.22,shY+M*.34);ctx.stroke();
  }else if(sit){
    ctx.beginPath();ctx.moveTo(M*.1,shY+M*.06);ctx.lineTo(M*.24,hipY-M*.02);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-M*.1,shY+M*.06);ctx.lineTo(-M*.16,hipY-M*.04);ctx.stroke();
  }else{
    const sw=pose==="walk"?Math.sin(walk+Math.PI)*M*.16:M*.04;
    ctx.beginPath();ctx.moveTo(M*.1,shY+M*.06);ctx.lineTo(sw+M*.06,shY+M*.34);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-M*.1,shY+M*.06);ctx.lineTo(-sw-M*.06,shY+M*.34);ctx.stroke();
  }
  /* шея и голова. Голова была в четверть роста — кукольная (самокритика M170):
     теперь одна восьмая с небольшим, как у человека, и стоит на шее */
  ctx.fillStyle="rgb("+col.map(v=>v*.8|0).join(",")+")";
  ctx.fillRect(-M*.025,shY-M*.05,M*.05,M*.06);
  ctx.fillStyle=look&&look.skin?"rgb("+look.skin.join(",")+")"
    :"rgb("+col.map(v=>Math.min(255,v*1.05+18)|0).join(",")+")";
  ctx.beginPath();ctx.arc(M*.015,shY-M*.115,M*.093,0,TAU);ctx.fill();
  ctx.fillStyle=(look&&look.scarf)||"rgba(26,22,20,.82)";
  if(look&&look.scarf){                            /* косынка над лбом, как на портрете */
    ctx.beginPath();
    ctx.moveTo(M*.015-M*.095,shY-M*.135);
    ctx.quadraticCurveTo(M*.015,shY-M*.245,M*.015+M*.095,shY-M*.135);
    ctx.lineTo(M*.015+M*.075,shY-M*.115);ctx.lineTo(M*.015-M*.075,shY-M*.115);
    ctx.closePath();ctx.fill();
  }else{
    ctx.beginPath();ctx.arc(M*.015,shY-M*.13,M*.093,Math.PI*1.02,Math.PI*1.98);ctx.fill();
  }
  ctx.fillStyle="rgba(20,18,16,.75)";
  ctx.fillRect(M*.05,shY-M*.12,M*.024,M*.024);
  ctx.restore();
  if(name&&G.hin&&Math.abs(G.hin.x-x)<44){
    ctx.fillStyle="rgba(214,226,232,.55)";
    ctx.font=Math.round(M*.22)+"px ui-monospace,monospace";
    ctx.textAlign="center";
    ctx.fillText(name,x,fy-M*1.3);
  }
}
