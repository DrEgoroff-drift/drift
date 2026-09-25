/* ══════════════ ферма — одомашнивание (M496, PLAN st. 7, DESIGN-birchpunk §4.3) ══════════════
   Автор: «зверь планеты, успокоенный импульсом, живёт на базе с фермой,
   получает имя и клеймо ПАЛАТЫ, и медленно даёт своё — только пока с ним
   кто-то говорит».

   Как это работает. Импульс в шахте или пещере оглушает зверя; подойти к
   оглушённому — раньше всегда «образец» (углерод, ксенобиом). Теперь, если у
   игрока где-то есть база с ЖИВОЙ ФЕРМОЙ без зверя и клетка на корабле пуста,
   зверя берут живым (`G.beast`): вид, семя, откуда. Первый вход на базу с
   пустой фермой — зверь въезжает: имя из таблицы (Зорька, Пеструшка…), клеймо
   ПАЛАТЫ № Ф-xxxx, строка в журнале. Раз в смену ферма даёт единицу своего:
   органику (мягкие миры), углерод (камень), ксенобиом (чужие архетипы); зверь
   с дальнего мира (≥25 секторов от ядра) каждую третью смену — «Жемчуг
   пустоты» (у него в таблице verb:"fauna"), с дальнего джунглевого/земного —
   каждую вторую «Звёздный чернозём». Но ТОЛЬКО пока с ним говорят: садовод на
   ферме (JOB_ROLE) или сам игрок на этой базе. Никто не говорит — раз в
   двенадцать смен строка «скучает». Ферму выбило — зверь не пропадает
   («никогда не теряется»): ждёт в породе, а когда ферму отстроят — тоскует по
   старому месту FARM_HOME смен и даёт вполовину. Зверь — не множитель и не
   цифра: у него имя, и журнал зовёт его по имени. */
const FARM_NAMES=["Зорька","Пеструшка","Бурка","Марта","Ночка","Малыш","Шустрик","Дымка","Тихон","Ряба","Борька","Фрося","Кузя","Мотя"];
const FARM_HOME=12,FARM_FAR=25,FARM_LONELY=12,FARM_SAY=6;
const FARM_SOFT={terran:1,ocean:1,jungle:1,toxic:1};
BUILD.farm={ru:"Ферма",cost:{credits:1500,alloy:4},power:-4,
  note:"зверь с планеты живёт тут и даёт своё — пока с ним кто-то говорит"};
ROOM_FIN.farm={wall:"rock",tint:"52,46,36",lamp:"250,214,160",ln:2,dim:.95,floor:"dirt",warn:0,work:.26,bare:1,calm:1,
  dress:["stencil","hooks"],junk:["bag","drum"]};
JOB_ROLE.farm="gardener";
BUILD_KEYS.push("farm");
Object.assign(BLOG,{
  farm_in:    (B,a)=>(a.who||"зверь")+" въехал"+(a.far?" — издалека, "+a.far+" секторов":"")+" · клеймо ПАЛАТЫ № Ф-"+(a.no||"0000")+" · «ласковый, только не кормите с руки»",
  farm_got:   (B,a)=>(a.who||"зверь")+" дал "+(a.q|0)+" ед · "+(a.what||"своё")+(a.home?" · тоскует, даёт вполовину":""),
  farm_lonely:(B,a)=>(a.who||"зверь")+" скучает: никто не заходит поговорить — и не даёт ничего",
  farm_wait:  (B,a)=>"ферма выбита · "+(a.who||"зверь")+" ждёт в породе, живой",
  farm_back:  (B,a)=>"ферма отстроена · "+(a.who||"зверь")+" вернулся и первое время тоскует"
});
function farmCell(B){
  for(const cell of (B&&B.cells)||[])if(cell&&cell.k==="farm"&&cell.hp>0)return cell;
  return null;
}
/* есть куда везти: где-то ждёт живая ферма без зверя */
function farmWanted(){
  for(const k in G.bases){const B=G.bases[k];if(!B.farm&&farmCell(B))return B;}
  return null;
}
/* взять живым — зовут шахта и пещера перед «образцом»; true — образец не берётся */
function beastTake(b,p){
  if(!b||!p||G.beast||!farmWanted())return false;
  G.beast={sx:G.sx,sy:G.sy,idx:p.idx|0,sp:b.name,seed:hashi(Math.round(b.x),Math.round(b.y),0xFA12)>>>0};
  const d=(typeof bioMark==="function")?bioMark(b.name,6):0;G.data+=d;
  tell("good","В клетку: "+b.name+" · живой, на ферму","В КЛЕТКУ\n"+b.name+"\nживой · везём на ферму"+(d?"\n+"+d+" данных":""));
  return true;
}
function farmOf(B){return (B&&B.farm)||null;}
/* сам зверь — заново из семени; кэш не в записи */
function farmBeast(F){
  if(!F)return null;
  if(F._b)return F._b;
  const sys=getSystem(F.sx,F.sy),p=sys&&sys.planets[F.idx|0];
  if(!p)return null;
  const list=faunaOf(p),sp=list.find(s=>s.name===F.sp)||list[0];
  if(!sp)return null;
  const b=specimenBeast(rng(F.seed>>>0),sp,0,0);b.face=1;b.stun=0;b.flee=0;
  if(b.hover)b.hover=Math.min(b.hover,7);          /* под потолком загона летун висит низко */
  F._b=b;return b;
}
function farmName(F){return F?F.name:"";}
/* что даёт зверь в эту смену: свой товар мира, дальний — жемчуг/чернозём */
function farmGood(F,n){
  const sys=getSystem(F.sx,F.sy),p=sys&&sys.planets[F.idx|0],type=p?p.type:"rocky";
  const r=Math.hypot(F.sx,F.sy),b=farmBeast(F);
  if(r>=FARM_FAR&&(n%3)===0)return "pearl";
  if(r>=FARM_FAR&&(type==="jungle"||type==="terran")&&(n%2)===1)return "chernozem";
  if(b&&b.alien)return "xeno";
  return FARM_SOFT[type]?"organics":"carbon";
}
function farmTalk(B,cell){
  if(typeof baseCellStaff==="function"&&baseCellStaff(B,cell).length>0)return true;
  return !!(G.mode==="base"&&G.base&&G.base.B===B);
}
/* въезд: зовёт enterBase */
function farmEnter(B){
  if(!G.beast||B.farm||!farmCell(B))return 0;
  const n=(typeof baseShift==="function")?baseShift():0;
  const r=rng(hashi(G.beast.seed,B.sx*31+B.sy,n));
  const F=Object.assign({},G.beast,{name:pick(FARM_NAMES,r),since:n,moved:0,wait:0,lonely:n,got:0,acc:0,no:1000+Math.floor(r()*9000)});
  delete F._b;
  B.farm=F;G.beast=null;
  const far=Math.round(Math.hypot(F.sx,F.sy));
  baseLog(B,"farm_in",n,{who:F.name,no:F.no,far:far>=FARM_FAR?far:0});
  tell("good","Ферма «"+B.name+"»: "+F.name+" въехал · клеймо № Ф-"+F.no,"ФЕРМА\n"+F.name+" въехал\nклеймо ПАЛАТЫ № Ф-"+F.no);
  return 1;
}
/* смена: зовёт baseShiftRun */
function farmStep(B,n){
  const F=farmOf(B);if(!F)return 0;
  const cell=farmCell(B);
  if(!cell){
    if(!F.wait){F.wait=n;baseLog(B,"farm_wait",n,{who:F.name});return 1;}
    return 0;
  }
  if(F.wait){F.wait=0;F.moved=n;baseLog(B,"farm_back",n,{who:F.name});return 1;}
  if(!farmTalk(B,cell)){
    if((n-(F.lonely|0))>=FARM_LONELY){F.lonely=n;baseLog(B,"farm_lonely",n,{who:F.name});return 1;}
    return 0;
  }
  F.lonely=n;
  const home=F.moved&&(n-F.moved)<FARM_HOME;
  if(home&&(n&1))return 0;                       /* тоскует: через смену */
  const k=farmGood(F,n);
  B.pool[k]=(B.pool[k]|0)+1;F.got=(F.got|0)+1;F.acc=(F.acc|0)+1;
  if((n%FARM_SAY)===0&&F.acc>0){
    baseLog(B,"farm_got",n,{who:F.name,q:F.acc,what:RES[k].ru.toLowerCase(),home:home?1:0});
    F.acc=0;return 1;
  }
  return 0;
}
/* ── ФЕРМА: разрез отсека ──
   Загон из жердей по пояс человеку, солома на грунте, кормушка и поилка,
   тюк сена у стены. Зверь стоит в загоне в свой рост — тот же drawBeast, что
   на поверхности: это он и есть, а не значок. На столбе — дощечка с именем и
   белое клеймо ПАЛАТЫ. Кто говорит — сидит на табурете у жерди. */
BASE_ROOM.farm=function(x0,y0,w,h,cx,fy,lit,seed,B,P,c,r){
  const F=farmOf(B),b=F?farmBeast(F):null;
  const warm=.35+lit*.5,S=bS(),L=bL();
  /* солома на грунте загона */
  const px0=x0+w*.30,pw=w-(px0-x0)-10;
  const posts=[px0,px0+pw*.5,px0+pw];
  /* тело загона печётся; зверь, жерди перед ним, кормушка и садовод — кадром */
  if(S){
  const Rs=rng(seed+41);
  ctx.fillStyle="rgba(196,164,88,"+(.10+lit*.12).toFixed(3)+")";ctx.fillRect(px0-6,fy-5,pw+12,5);
  ctx.strokeStyle="rgba(222,190,110,"+(.25+lit*.25).toFixed(2)+")";ctx.lineWidth=1;
  for(let i=0;i<26;i++){const sx=px0-4+Rs()*(pw+8),sy=fy-1-Rs()*4,a=(Rs()-.5)*1.2;
    ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+Math.cos(a)*5,sy-Math.abs(Math.sin(a))*2);ctx.stroke();}
  /* тюк сена у левой стены и вилы */
  bBox(x0+8,fy-18,26,18,"rgba(176,146,76,.96)",lit,"rgba(0,0,0,.4)");
  ctx.strokeStyle="rgba(90,70,30,"+(.4+lit*.2).toFixed(2)+")";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(x0+8,fy-9);ctx.lineTo(x0+34,fy-9);ctx.moveTo(x0+16,fy-18);ctx.lineTo(x0+16,fy);ctx.moveTo(x0+26,fy-18);ctx.lineTo(x0+26,fy);ctx.stroke();
  ctx.strokeStyle="rgba(150,130,90,"+(.5+lit*.3).toFixed(2)+")";ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(x0+38,fy);ctx.lineTo(x0+44,fy-34);ctx.stroke();
  for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x0+36+i*2.6,fy-2);ctx.lineTo(x0+37+i*2.6,fy-8);ctx.stroke();}
  /* дощечка с именем и клеймо ПАЛАТЫ на левом столбе */
  {
    const nx=px0-16,ny=fy-42;
    bBox(nx,ny,32,9,"rgba(160,124,72,.97)",lit,"rgba(0,0,0,.45)");
    ctx.fillStyle="rgba(40,26,12,"+(.8+lit*.2).toFixed(2)+")";
    ctx.font="6px ui-monospace,monospace";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(F?F.name.toUpperCase():"ЖДЁМ",nx+16,ny+4.8);
    ctx.textBaseline="alphabetic";
    if(F){                                        /* клеймо: белая табличка с чёрным узором */
      const qx=nx+34,qy=ny-1,Rq=rng(F.no|0);
      ctx.fillStyle="rgba(236,236,230,"+(.85+lit*.15).toFixed(2)+")";ctx.fillRect(qx,qy,11,11);
      ctx.fillStyle="rgba(20,20,24,.95)";
      for(let i=0;i<5;i++)for(let j=0;j<5;j++)if(Rq()<.5||(i<2&&j<2))ctx.fillRect(qx+1+i*1.9,qy+1+j*1.9,1.6,1.6);
    }
  }
  bLamp(cx+6,y0+4,30,fy,"250,214,160",.28+lit*.38);
  }
  if(!L)return;
  /* зверь: в загоне, за задними жердями и перед передними */
  ctx.save();ctx.beginPath();ctx.rect(px0-4,y0,pw+8,fy-y0);ctx.clip();
  if(b){
    const bx=px0+pw*.55+Math.sin(G.t*.006+seed)*pw*.12;
    ctx.fillStyle="rgba(0,0,0,.32)";ctx.beginPath();ctx.ellipse(bx,fy-1,b.r*1.1,2.6,0,0,TAU);ctx.fill();
    drawBeast(b,bx,fy,false,0);
  }
  ctx.restore();
  /* жерди загона: три ряда на столбах, по пояс человеку */
  ctx.fillStyle="rgba(110,84,50,"+(.85+lit*.15).toFixed(2)+")";
  for(const x of posts)ctx.fillRect(x-2,fy-26,4,26);
  for(let i=0;i<3;i++){const y=fy-22+i*8;
    ctx.fillStyle="rgba(140,108,64,"+(.8+lit*.2).toFixed(2)+")";ctx.fillRect(px0-2,y,pw+4,3);
    ctx.fillStyle="rgba(255,230,180,"+(.10+lit*.10).toFixed(3)+")";ctx.fillRect(px0-2,y,pw+4,1);}
  /* кормушка и поилка у правого столба */
  bBox(px0+pw-30,fy-8,22,8,"rgba(120,96,58,.96)",lit,"rgba(0,0,0,.4)");
  ctx.fillStyle="rgba(196,164,88,"+(.5+lit*.3).toFixed(2)+")";ctx.fillRect(px0+pw-28,fy-9,18,2);
  bBox(px0+pw-52,fy-6,14,6,"rgba(80,90,100,.96)",lit,"rgba(0,0,0,.4)");
  ctx.fillStyle="rgba(150,200,230,"+(.35+lit*.3).toFixed(2)+")";ctx.fillRect(px0+pw-50,fy-5,10,1.6);
  /* кто говорит: садовод на табурете у жерди, и «…» над ним */
  if(F&&farmTalk(B,farmCell(B))){
    const tx=px0-12;
    bBox(tx-5,fy-9,10,3,"rgba(120,96,58,.96)",lit,"rgba(0,0,0,.4)");
    ctx.fillStyle="rgba(120,96,58,.96)";ctx.fillRect(tx-4,fy-6,2,6);ctx.fillRect(tx+2,fy-6,2,6);
    bWorker(tx,fy-1,lit,true,G.t*.03+seed,1,1);
    const dots=Math.floor((G.t*.02)%4);
    ctx.fillStyle="rgba(240,236,220,"+(.5+lit*.3).toFixed(2)+")";ctx.font="7px ui-monospace,monospace";ctx.textAlign="left";
    ctx.fillText("·".repeat(Math.max(1,dots)),tx+6,fy-30);
  }
};
