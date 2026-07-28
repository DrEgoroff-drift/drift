/* ══════════════ карта ══════════════ */
function wrapCenter(text,x,y,maxW,lh){
  const words=text.split(" ");let line="",ly=y;
  for(const w of words){
    const t=line?line+" "+w:w;
    if(ctx.measureText(t).width>maxW&&line){ctx.fillText(line,x,ly);line=w;ly+=lh;}
    else line=t;
  }
  if(line)ctx.fillText(line,x,ly);
}
function drawMap(){
  const st=stat();
  ctx.fillStyle="#05070c";ctx.fillRect(0,0,W,H);drawNebula(0,0,0);drawStars(0,0,0);
  const cell=Math.min(W,H)/9.2,R=5;
  ctx.strokeStyle="rgba(127,230,216,.16)";
  ctx.beginPath();ctx.arc(W/2,H/2,(st.jump+.02)*cell,0,TAU);ctx.stroke();
  const dsel=Math.hypot(G.sel.x-G.sx,G.sel.y-G.sy);
  const vis=[];
  for(let gy=G.sy-R;gy<=G.sy+R;gy++)for(let gx=G.sx-R;gx<=G.sx+R;gx++){
    if(!starAt(gx,gy))continue;
    const [jx,jy]=sysJitter(gx,gy);
    vis.push({gx,gy,s:getSystem(gx,gy),x:W/2+(gx-G.sx+jx)*cell,y:H/2+(gy-G.sy+jy)*cell});
  }
  /* разветвлённые линии к ближайшим соседям вместо квадратной решётки */
  ctx.strokeStyle="rgba(120,190,210,.14)";ctx.lineWidth=1;
  const drawnLane=new Set();
  for(const a of vis){
    const near=vis.filter(b=>b!==a).map(b=>({b,d:Math.hypot(a.x-b.x,a.y-b.y)}))
      .sort((p,q)=>p.d-q.d).slice(0,2);
    for(const{b}of near){
      const key=(a.gx*100000+a.gy)<(b.gx*100000+b.gy)?a.gx+","+a.gy+">"+b.gx+","+b.gy:b.gx+","+b.gy+">"+a.gx+","+a.gy;
      if(drawnLane.has(key))continue;drawnLane.add(key);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
  }
  let sel=null;
  for(const v of vis){
    const{gx,gy,s,x,y}=v,rr=3+s.cls.t*2.4;
    ctx.fillStyle=s.cls.col;ctx.globalAlpha=.9;
    ctx.beginPath();ctx.arc(x,y,rr,0,TAU);ctx.fill();ctx.globalAlpha=1;
    if(s.station){ctx.strokeStyle="rgba(242,178,92,.6)";ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(x,y,rr+5,0,TAU);ctx.stroke();}
    if(s.belt){ctx.strokeStyle="rgba(180,190,200,.35)";ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(x,y,rr+9,0,TAU);ctx.stroke();}
    if(gx===G.sx&&gy===G.sy){ctx.strokeStyle="#7fe6d8";ctx.lineWidth=1.2;
      ctx.beginPath();ctx.arc(x,y,rr+13,0,TAU);ctx.stroke();}
    if(gx===G.sel.x&&gy===G.sel.y)sel=v;
  }
  if(sel){
    const{s,x,y}=sel,rr=3+s.cls.t*2.4;
    ctx.strokeStyle="#f2b25c";ctx.lineWidth=1.4;
    ctx.strokeRect(x-rr-15,y-rr-15,(rr+15)*2,(rr+15)*2);
    ctx.fillStyle="#f2b25c";ctx.font="10px ui-monospace,monospace";ctx.textAlign="center";
    ctx.fillText(s.name.toUpperCase(),x,y+rr+28);
    ctx.fillStyle="rgba(127,230,216,.6)";
    ctx.fillText(s.cls.ru+" · "+s.planets.length+" планет"+(s.station?" · СТАНЦИЯ":"")+(s.belt?" · ПОЯС":""),x,y+rr+42);
    ctx.fillStyle="rgba(160,182,192,.65)";ctx.font="9px ui-monospace,monospace";
    wrapCenter(s.desc,x,y+rr+58,230,11);
  }
  const cost=Math.round(9+dsel*13);
  ctx.textAlign="left";ctx.font="10px ui-monospace,monospace";
  ctx.fillStyle="rgba(127,230,216,.55)";
  ctx.fillText("СЕКТОР "+G.sel.x+":"+G.sel.y,16,H-92);
  ctx.fillText("ДИСТАНЦИЯ "+dsel.toFixed(2)+" из "+st.jump.toFixed(2)+" пк",16,H-78);
  const bad=dsel>st.jump+.02||cost>G.fuel||dsel===0;
  ctx.fillStyle=bad?"rgba(255,107,87,.85)":"#f2b25c";
  ctx.fillText(dsel===0?"ТЕКУЩАЯ СИСТЕМА":("ПРЫЖОК: "+cost+" топлива"+(cost>G.fuel?" — НЕ ХВАТАЕТ":"")),16,H-64);
  if(dsel>st.jump+.02)ctx.fillText("ВНЕ РАДИУСА — НУЖЕН ГИПЕРДРАЙВ",16,H-50);
  ctx.fillStyle="rgba(93,115,130,.9)";ctx.textAlign="right";
  ctx.fillText("ТЕЛ ОТКРЫТО: "+G.found.size,W-16,H-78);
  ctx.fillText("ВИДОВ: "+G.species.size,W-16,H-64);
  ctx.fillText("КРЕДИТОВ: "+G.credits,W-16,H-50);
  G.prompt="ТАП ПО ЗВЕЗДЕ — ВЫБОР · ДЕЙСТВ — ПРЫЖОК";
  if(actEdge){
    if(!bad)jump(cost);
    else if(dsel>0)say("Прыжок невозможен");
  }
}
function jump(cost){
  G.fuel-=cost;G.sx=G.sel.x;G.sy=G.sel.y;G.sys=getSystem(G.sx,G.sy);G.ap=null;
  const a=Math.random()*TAU,r=1500;
  G.ship.x=Math.cos(a)*r;G.ship.y=Math.sin(a)*r;
  G.ship.vx=-Math.cos(a)*.7;G.ship.vy=-Math.sin(a)*.7;G.ship.a=a+Math.PI;
  G.mode="system";
  spawnPirates();spawnAllies();
  sfx("jump");
  saveGame(true);
  logAdd("dim","Прыжок в "+G.sys.name+" ("+G.sx+":"+G.sy+") · −"+cost+" топлива"+
    (G.pirates.length?" · чужих сигнатур: "+G.pirates.length:""));
  say("Прибытие: "+G.sys.name+"\n"+G.sys.cls.ru+
    (G.sys.station?"\nстанция":"")+(G.sys.belt?"\nпояс астероидов":"")+
    (G.pirates.length?"\nчужие сигнатуры: "+G.pirates.length:""));
}
