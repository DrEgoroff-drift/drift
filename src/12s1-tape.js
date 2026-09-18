/* ══════════════ изолента (M486, DESIGN-birchpunk §2) ══════════════
   Расходник за копейки: заматывает корпус до половины где угодно — в поясе,
   на орбите, посреди перегона. И оставляет след: серая полоса на корпусе
   видна в полёте, пока на верфи не починят как положено. Рассвет полосу не
   снимает — у них изолента считается отделкой.

   G.tapeRoll — рулонов в запасе; G.tapes[shipId] — полос на корпусе (до 6). */
const TAPE_PRICE=5,TAPE_MAX=6;
function tapeRolls(){return G.tapeRoll|0;}
function tapesOf(id){return (G.tapes&&G.tapes[id||G.shipId])|0;}
function tapeCan(){return tapeRolls()>0&&G.hull<stat().hullMax*.5-.5;}
function tapeUse(){
  if(!tapeCan())return false;
  G.tapeRoll=tapeRolls()-1;
  G.hull=Math.ceil(stat().hullMax*((typeof socIn==="function"&&socIn("kulib"))?.6:.5));   /* кулибины мотают крепче (M512) */
  if(typeof socCount==="function")socCount("tapes");
  G.tapes=G.tapes||{};G.tapes[G.shipId]=Math.min(TAPE_MAX,tapesOf()+1);
  logAdd("tech","Корпус замотан изолентой · до половины · рулонов осталось "+tapeRolls());
  say("Замотано\nкорпус 50 % · держится",100);
  if(typeof sfx==="function")sfx("ui",{f:420,to:380,d:.18,v:.2});
  return true;
}
function tapeBuy(){
  if(G.credits<TAPE_PRICE){say("Не хватает даже на изоленту",90);return false;}
  G.credits-=TAPE_PRICE;G.tapeRoll=tapeRolls()+1;
  logAdd("money","Изолента · −"+TAPE_PRICE+" кр · рулонов "+tapeRolls());
  return true;
}
/* ремонт на верфи снимает полосы; у Рассвета — нет */
function tapeYardRepaired(){
  const by=G.sys&&G.sys.station&&G.sys.station.by;
  if(by==="ra"||!tapesOf())return;
  G.tapes[G.shipId]=0;
  logAdd("dim","Изоленту сняли, заварили как положено");
}
/* серые полосы на корпусе — в координатах корпуса, рядом со швами */
function drawTapes(h,n){
  if(!n)return;
  const L=h.len,bw=h.bw;
  for(let i=0;i<n;i++){
    const r=rng(hashi(h.seed||1,0x7A9E,i));
    const x=h.tail+(.15+r()*.7)*L,y=(r()*2-1)*bw*.55,a=(r()-.5)*1.1,ln=L*(.07+r()*.05),w=Math.max(1.8,bw*.26);
    /* D15 (телефон 18.09): серая полоса на серой обшивке не читалась. Изолента —
       чёрная, глянцевая: тёмное тело, светлый блик по кромке и загнутый уголок */
    ctx.save();ctx.translate(x,y);ctx.rotate(a);
    ctx.fillStyle="rgba(0,0,0,.35)";ctx.fillRect(-ln/2+.4,-w/2+.5,ln,w);            /* тень под полосой */
    ctx.fillStyle="rgba(18,20,24,.97)";ctx.fillRect(-ln/2,-w/2,ln,w);
    ctx.fillStyle="rgba(200,206,214,.42)";ctx.fillRect(-ln/2,-w/2,ln,w*.22);         /* блик */
    ctx.fillStyle="rgba(120,126,134,.5)";ctx.fillRect(ln/2-w*.35,-w/2,w*.35,w);       /* загнутый кончик */
    ctx.restore();
  }
}
