/* ══════════════ плоскость краски объёмного корпуса (22.10, «двойной корпус») ══════════════ */
/* 17c2a кладёт выпечку вида сверху на плоскость посередине высоты. Под частью, построенной объёмом вне
   уровня плоскости (пара икс-крыла с подъёмом, тарелка на штанге) и под воротником стыковки, плоскости
   быть не должно: её плоская копия при наклоне камеры дороги выглядывала из-под объёма вторым крылом,
   второй тарелкой и серпом воротника. Остальная плоскость на месте: вынос радиатора, стойки, крюк
   живут только на ней. Сетка без видеокарты. */
TEST_SUITES.push(()=>suite("корпус: плоскость краски без двойников",()=>{
  resetWorld();
  const ids=[...Object.keys(SHIPS),...(typeof FLEET!=="undefined"?Object.keys(FLEET):[]),...Object.keys(NPC_SHIPS)];
  const z0=Math.fround(-.05);
  const rects=m=>{const R=[];for(let i=0;i+71<m.v.length;i+=12){if(m.v[i+11]!==-1||m.v[i+2]!==z0)continue;
    R.push([m.v[i],m.v[i+1],m.v[i+24],m.v[i+25]]);i+=60;}return R;};
  const on=(R,x,y)=>R.some(r=>x>=Math.min(r[0],r[2])&&x<=Math.max(r[0],r[2])&&y>=Math.min(r[1],r[3])&&y<=Math.max(r[1],r[3]));
  let nx=0,nd=0,nk=0,maxq=0,bad=[];
  for(const id of ids){const h=hullOf(id),M=h.mark||{},m=h3dMesh(h,null),R=rects(m),E=m.E;
    maxq=Math.max(maxq,R.length);
    if(!on(R,-E*.97,-E*.97)||!on(R,E*.97,E*.97))bad.push(id+": угол плоскости пуст");
    if(h.form==="xwing"){nx++;h.wings.forEach((W,wi)=>{const c=[0,0];for(const p of W){c[0]+=p[0]/W.length;c[1]+=p[1]/W.length;}
      for(const s of [1,-1])if(on(R,c[0],c[1]*s))bad.push(id+": под крылом "+wi+" плоскость");});}
    if(M.dish){nd++;const d=M.dish;if(on(R,d.x-d.boom*.4,-h.bw-d.boom))bad.push(id+": под тарелкой плоскость");}
    if(M.dock){nk++;const D2=M.dock,y=profW(h.prof,D2.x)*.86*D2.s,R0=D2.r*1.15*1.1;
      if(on(R,D2.x,y+Math.sign(y)*R0*.8))bad.push(id+": под свесом воротника плоскость");}
    /* вынос радиатора живёт на плоскости: середина плиты за бортом — на ней */
    if(M.rad)for(const Rd of M.rad)if(!on(R,Rd.x,Rd.w+Rd.th*.5)&&!on(R,Rd.x,-(Rd.w+Rd.th*.5)))bad.push(id+": радиатор без плоскости");}
  ok(bad.length===0,"двойников нет и плоскость на месте: "+(bad.slice(0,4).join("; ")||"все "+ids.length));
  ok(nx>0&&nd>0&&nk>0,"проверены икс-крыло ("+nx+"), тарелка ("+nd+"), воротник ("+nk+")");
  ok(maxq<4000,"плоскость — полосы, не клетки: "+maxq+" прямоугольников у самой дырявой");
  /* у тел без деталей (станция) плоскость прежняя — один квадрат */
  const st=h3dStationMesh({by:"gt"},ST_TYPES[0].id,"gt",7);
  ok(rects(st).length===1,"у станции плоскость краски — один квадрат, как была");
}));
