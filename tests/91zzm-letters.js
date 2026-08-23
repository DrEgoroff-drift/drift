/* ══════════════ автотесты: последний рейс и письма (M158) ══════════════ */
TEST_SUITES.push(()=>suite("последний рейс: объявлен на 40-й день циркуляра, после него Жестянка закрыта",()=>{
  resetWorld();
  G.exp={phase:1,day0:celDay(),coll:{},gone:[],gave:0,pax:null,lastDay:celDay()};G.things=[];G.log=[];
  eq(lastRunDay(),celDay()+LAST_RUN_DAY,"день последнего рейса");
  ok(!tinClosed(),"пока открыта");
  G.t+=CEL_DAY*(LAST_RUN_DAY-3);lastRunTick();
  ok(G.log.some(x=>x.k==="ether"&&x.s.indexOf("Последний рейс")>=0),"объявлено за три дня");
  G.t+=CEL_DAY*4;lastRunTick();
  ok(tinClosed(),"закрыта");
  ok(G.log.some(x=>x.s.indexOf("Жестянка закрыта")===0),"строка о закрытии");
  ok(/ЗАКРЫТА/.test(tinLine({run:0,fed:0,seed:1})),"железо встало");
  G.exp=null;
}));

TEST_SUITES.push(()=>suite("письма: взять у стойки, не читать, адресат читает вслух; на Жестянку — опоздал",()=>{
  resetWorld();
  G.exp={phase:1,day0:celDay(),coll:{},gone:[],gave:0,pax:null,lastDay:celDay()};G.letters={};G.things=[];G.log=[];
  eq(LETTERS.length,10,"десять писем");
  ok(LETTERS.filter(l=>l.to.kind==="tin").length===3,"три — на Жестянку");
  ok(LETTERS.every(l=>l.text.length>60),"у каждого есть содержание");
  const S=G.sys.station?G.sys:null;ok(!!S,"станция есть");
  G.ship.x=S.station.x+40;G.ship.y=S.station.y;openStation();
  const l=LETTERS.find(x=>x.to.kind==="stype"&&x.to.v==="sci");
  ok(letterTake(l),"взяли");
  const th=G.things.find(t=>t.letter===l.id);
  ok(th&&th.k==="letter"&&th.note.indexOf(l.text)<0,"конверт на столе, текста в нём не видно");
  ok(!letterDeliver(l),"не у адресата — не отдаётся");
  closeStation();
  /* у адресата */
  let T=null;for(let x=-14;x<=14&&!T;x++)for(let y=-14;y<=14&&!T;y++){if(starAt(x,y)){const q=getSystem(x,y);if(q&&q.station&&q.station.stype==="sci")T=q;}}
  ok(!!T,"научная станция есть");
  G.sx=T.sx;G.sy=T.sy;G.sys=T;G.ship.x=T.station.x+40;G.ship.y=T.station.y;openStation();
  G.log=[];
  ok(letterDeliver(l),"адресат принял");
  ok(G.log.some(x=>x.k==="talk"&&x.s.indexOf(l.text)>=0),"и прочитал вслух — в ЛЮДИ");
  ok(th.k==="paper"&&th.note===l.text,"на столе письмо развёрнуто");
  closeStation();
  /* на Жестянку после закрытия — адресат выбыл */
  const lt=LETTERS.find(x=>x.to.kind==="tin");
  letterTake(lt);
  G.t+=CEL_DAY*(LAST_RUN_DAY+2);
  ok(tinClosed(),"Жестянка закрыта");
  ok(!letterDeliver(lt),"не доставлено");
  eq(letterState(lt.id).late,1,"адресат выбыл");
  const s=snapshot();G.letters={};applySave(JSON.parse(JSON.stringify(s)));
  eq(letterState(l.id).done,1,"письма пережили сохранение");
  G.exp=null;
}));
