/* Бой (M902c, DESIGN-game §8, §10.6): битый шакал рвёт дистанцию один раз и возвращается
   в бросок; ОТПУСТИТЬ — капсула по рангу, пират уходит, строка в книжке; дуэль на
   стрельбище — плата, настоящий бой, ни награды, ни гибели, лучшее время в записи. */
function ftFoe(rank,dist,ang){
  const R=PIRATE_RANKS[rank],sh=G.ship,hp=(26+.5*70)*R.hull,seed=hashi(11,rank,(dist|0)+1)>>>0;
  const a=ang==null?-Math.PI/2:ang;
  const p={x:sh.x+Math.cos(a)*dist,y:sh.y+Math.sin(a)*dist,vx:0,vy:0,a:a+Math.PI,
    hull:hp,hullMax:hp,name:(R.pre?R.pre+" ":"")+"Проба",rank,seed,shipId:pirateShipId(seed),
    cool:0,aware:true,thrust:false,shield:hp*R.shield,shieldMax:hp*R.shield,shieldHit:0,
    shieldType:(PIRATE_LOADOUT[rank].shield||"solid"),deserter:0};
  G.pirates.push(p);return p;
}
TEST_SUITES.push(()=>suite("бой: битый шакал рвёт дистанцию один раз и возвращается в бросок",()=>{
  resetWorld();
  const p={x:0,y:0,vx:0,vy:0,a:Math.PI,hull:10,hullMax:40,rank:0,seed:3,cool:99,stunT:0};
  /* игрок справа на 900 px — за порогом отхода; прежде битый уходил носом от него навсегда */
  for(let f=0;f<240;f++)pirateRoleTick(p,1,900,0);
  eq(p.rs.st,"dash","через 4 с — бросок, а не отход");
  ok(Math.abs(angDiff(p.a,0))<.3,"нос на вас: "+(angDiff(p.a,0)*57.3).toFixed(0)+"°");
  ok(p.rs.hurt===1,"разрыв под тридцатью процентами был, один раз");
}));
TEST_SUITES.push(()=>suite("бой: ОТПУСТИТЬ — капсула по рангу, пират уходит, книжка помнит",()=>{
  resetWorld();G.mode="system";G.pirates=[];G.marks=[];
  for(const k of RES_KEYS)G.cargo[k]=0;
  G.cargo.ice=5;G.cargo.iron=3;
  const ks=RES_KEYS.filter(k=>RES[k].price>RES.iron.price).slice(0,2);
  G.cargo[ks[0]]=2;G.cargo[ks[1]]=2;
  const val=k=>G.cargo[k]*RES[k].price;
  const order=RES_KEYS.filter(k=>G.cargo[k]>0).sort((a,b)=>val(a)-val(b));
  /* шакал — самое дешёвое место */
  const j=ftFoe(0,600);helmLock(j);
  const rec0=recordAll().e.length,cheap=order[0];
  ok(letGo(),"шакал отпущен");
  eq(G.cargo[cheap],0,"шакал взял самое дешёвое: "+cheap);
  ok(j.paid&&G.marks.indexOf(j)<0,"захват снят, он при капсуле");
  const R=recordAll().e.slice(rec0).find(e=>e.a===j.name);
  ok(R&&R.s===LETGO_SAY[0],"строка в книжке его голосом: "+(R?R.s:"—"));
  const h0=G.hull;
  for(let f=0;f<90&&G.pirates.indexOf(j)>=0&&j.hull>0;f++){stepWorld(1);G.t+=1;}
  ok(j.hull<=0&&j.fled,"прыгнул через секунду");
  eq(G.hull,h0,"при капсуле не стрелял");
  /* ветеран — самое дорогое */
  G.pirates=[];const v=ftFoe(1,600);helmLock(v);
  const left=RES_KEYS.filter(k=>G.cargo[k]>0).sort((a,b)=>val(b)-val(a));
  ok(letGo(v)&&G.cargo[left[0]]===0&&G.cargo[left[1]]>0,"ветеран взял самое дорогое: "+left[0]);
  /* капитан — два самых дорогих */
  G.cargo.ice=4;G.cargo.iron=4;G.cargo[ks[0]]=1;
  G.pirates=[];const c=ftFoe(2,600);helmLock(c);
  const top=RES_KEYS.filter(k=>G.cargo[k]>0).sort((a,b)=>val(b)-val(a));
  ok(letGo(c)&&G.cargo[top[0]]===0&&G.cargo[top[1]]===0&&G.cargo[top[2]]>0,"капитан взял два самых дорогих");
  /* кто не торгуется и когда нечего отдать */
  G.pirates=[];const b=ftFoe(3,600);helmLock(b);
  ok(!letGo(b)&&!b.paid,"барон не торгуется");
  G.pirates=[];const e=ftFoe(0,600);helmLock(e);for(const k of RES_KEYS)G.cargo[k]=0;
  ok(!letGo(e)&&!e.paid,"трюм пуст — отдать нечего");
  ok(!letGo(null)||G.marks.length>0,"без захвата — некого");
  /* клавиша X */
  G.cargo.ice=1;letGoKey({code:"KeyX",target:null});
  ok(e.paid&&G.cargo.ice===0,"X отпускает взятого в захват");
}));
TEST_SUITES.push(()=>suite("бой: дуэль на стрельбище — плата, настоящий бой, ни награды, ни гибели",()=>{
  resetWorld();G.flownMs=2*FIRST_HOUR_MS;
  const S=dispTestStations()[0];dispTestDock(S);
  G.credits=1000;
  eq(duelNext().rk,0,"первая дуэль — с шакалом");
  ok(duelStart(0),"дуэль началась");
  eq(G.credits,1000-DUEL_FEE,"плата "+DUEL_FEE+" кр");
  const p=duelFoe();
  ok(p&&p.spar&&G.marks[0]===p&&!G.pirates.some(q=>q.dummy),"напротив — настоящий шакал, в захвате, мишени нет");
  const hp0=p.hull,h0=G.hull;
  for(let f=0;f<60*12&&duelOn();f++){stepWorld(1);G.t+=1;}
  ok(!duelOn()||G.hull<h0||p.hull<hp0,"бой идёт: он "+Math.round(p.hull)+"/"+Math.round(hp0)+", вы "+Math.round(G.hull)+"/"+Math.round(h0));
  if(duelOn()){p.hull=p.hullMax*.2;stepWorld(1);G.t+=1;}
  ok(!duelOn()&&!G.range,"под четвертью — сдался, дуэль кончена");
  eq(G.credits,1000-DUEL_FEE,"награды за спарринг нет");
  ok(duelSt().best[0]>0,"лучшее время записано: "+duelSt().best[0]+" с");
  eq(duelNext().rk,1,"дальше — ветеран");
  eq(G.hull,stat().hullMax,"корпус вернули");
  /* сбит — не гибель */
  ok(duelStart(1),"вторая дуэль");
  const cr=G.credits,w0=G.mode;
  G.hull=0;wreck("сбит в бою");
  ok(!duelOn()&&G.hull===stat().hullMax&&G.credits===cr,"«сбит» кончает дуэль: корпус цел, денег не взяли");
  ok(G.mode==="dock","снова у причала (был "+w0+")");
  eq(duelSt().best[1],undefined,"проигрыш времени не пишет");
  G.credits=10;ok(!duelStart(0)&&!duelOn(),"без "+DUEL_FEE+" кр дуэли нет");
}));
/* M480: живой капитан стоит за автопушкой (~700+); spar должен держаться в 420–620 */
TEST_SUITES.push(()=>suite("бой: spar-капитан в полосе автопушки",()=>{
  resetWorld();G.flownMs=2*FIRST_HOUR_MS;
  const S=dispTestStations()[0];dispTestDock(S);
  G.credits=200;
  ok(duelStart(2),"дуэль с капитаном");
  const p=duelFoe();ok(p&&p.spar&&(p.rank|0)===2,"spar-капитан");
  for(let f=0;f<60*8&&duelOn();f++){stepWorld(1);G.t+=1;}
  const d=Math.hypot(p.x-G.ship.x,p.y-G.ship.y);
  ok(d>=360&&d<=700,"полоса spar 420–620 (±зазор), сейчас "+Math.round(d));
  ok((p.shieldMax||0)<p.hullMax*.55,"щит дуэли тоньше живого: "+Math.round(p.shieldMax)+" / корпус "+Math.round(p.hullMax));
  if(duelOn()){p.hull=p.hullMax*.2;stepWorld(1);G.t+=1;}
  ok(!duelOn(),"дуэль закрывается");
}));
TEST_SUITES.push(()=>suite("бой: лучшее время дуэлей переживает запись",()=>{
  resetWorld();
  G.duel={best:{0:14,2:33}};
  const s=JSON.parse(JSON.stringify(snapshot()));
  G.duel=null;ok(applySave(s),"запись читается");
  eq(JSON.stringify(duelSt().best),JSON.stringify({0:14,2:33}),"времена на месте");
  const o=JSON.parse(JSON.stringify(s));delete o.duel;
  ok(applySave(o)&&G.duel===null,"запись до M902c — пусто");
  const b=JSON.parse(JSON.stringify(s));b.duel={best:{0:"x",1:-5,2:20}};
  ok(applySave(b)&&JSON.stringify(duelSt().best)===JSON.stringify({2:20}),"битые времена отброшены");
}));
