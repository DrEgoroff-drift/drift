/* ══════════════ батарея: оборона, которую строят ══════════════
   Не покупка и не перк: отсек в разрезе базы (21a), стоящий в общем балансе
   мощности. Он ест реактор, поэтому оборона конкурирует с добычей — и в этом
   вся суть. Батарея на верхнем ярусе, потому что бьёт с грунта: с орбиты видна
   линия от планеты, и понятно, кто стреляет.

   Она снимает МЕЛОЧЬ и только мелочь. Пираты как содержание в игру не входят:
   батарея нужна, чтобы игрок перестал летать домой из-за залётного шакала, а не
   чтобы система стала безопасной. По барону (ранг 3), охотнику (12o), ренегату
   (12g) и сопернику она не работает вовсе — правки, дающие ей держать систему,
   ломают замысел. */
const BATT_RANGE=3000;      // добивает не по всей системе, а вокруг своей планеты
const BATT_COOL=150;        // кадров между выстрелами при полной мощности
const BATT_DMG=14;          // за выстрел на одну батарею
/* сколько стволов в этой системе и с какой мощностью они работают: разбитый
   отсек не считается (это делает basePower), а обесточенная база бьёт реже */
function battAt(sx,sy){
  let n=0,eff=0,p=null;
  for(const key in G.bases){
    const B=G.bases[key];
    if(B.sx!==sx||B.sy!==sy)continue;
    const P=basePower(B);
    if(!P.guns||P.eff<=0)continue;              // обесточенная батарея молчит (21a пишет об этом в журнал)
    n+=P.guns;eff=Math.max(eff,P.eff);
    if(!p){
      const sys=getSystem(sx,sy);
      p=(sys&&sys.planets&&sys.planets[B.idx|0])||null;
    }
  }
  return n?{n,eff,p}:null;
}
/* кого она вообще берёт: залётный шакал без ранга и без особой роли */
function battTarget(p){
  return !!p&&!p.rogue&&!p.hunter&&!p.rival&&(p.rank|0)===0&&p.hull>0;
}
function battTick(dt){
  if(!G.battFx)G.battFx=[];
  for(let i=G.battFx.length-1;i>=0;i--){
    G.battFx[i].t-=dt;
    if(G.battFx[i].t<=0)G.battFx.splice(i,1);
  }
  const Bt=battAt(G.sx,G.sy);
  if(!Bt||!Bt.p){G.battCool=0;return;}
  G.battCool=(G.battCool||0)-dt*Math.max(.2,Bt.eff)*Bt.n;
  if(G.battCool>0)return;
  G.battCool=BATT_COOL;
  let tgt=null,td=1e9;
  for(const q of G.pirates||[]){
    if(!battTarget(q))continue;
    const d=Math.hypot(q.x-Bt.p.x,q.y-Bt.p.y);
    if(d<BATT_RANGE&&d<td){td=d;tgt=q;}
  }
  if(!tgt)return;
  tgt.hull-=BATT_DMG*Math.max(.2,Bt.eff);
  tgt.aware=true;                                   // по нему попали — он знает, где он
  G.battFx.push({x1:Bt.p.x,y1:Bt.p.y,x2:tgt.x,y2:tgt.y,t:14});
  /* голос батареи: тяжёлый низкий выстрел с грунта плюс прежний блип —
     с орбиты слышно, что стреляет не корабль (хвост M111) */
  if(G.mode==="system"){sfx("shot",{f:150,v:.3});sfx("ui",{f:280,to:90,d:.2,v:.16});}
  if(tgt.hull<=0){
    logAdd("kill","Батарея сбила «"+tgt.name+"»");
    killPirate(tgt);
    G.pirates=G.pirates.filter(q=>q.hull>0);
  }
}
/* линия с грунта: рисуется тем же проектором, что и весь бой (13-pirates) */
function battDraw(zx,zy,Z){
  for(const f of G.battFx||[]){
    const a=Math.max(0,f.t/14);
    ctx.strokeStyle="rgba(150,230,255,"+(a*.85).toFixed(2)+")";
    ctx.lineWidth=Math.max(1,2.4*a);
    ctx.beginPath();ctx.moveTo(zx(f.x1),zy(f.y1));ctx.lineTo(zx(f.x2),zy(f.y2));ctx.stroke();
    ctx.fillStyle="rgba(220,245,255,"+(a*.7).toFixed(2)+")";
    ctx.beginPath();ctx.arc(zx(f.x2),zy(f.y2),3+6*(1-a),0,TAU);ctx.fill();
  }
}
