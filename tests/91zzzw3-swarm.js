/* ══════════════ рой: слово раньше укуса, авария не петля (0.493.3) ══════════════
   Живой сайт 09.10: свежий сейв в секторе 0:0 под роем гиб каждые 0.85 с —
   рой кусал стоящий корабль с первого кадра, авария ставила его стоящим в ту
   же систему. Закон: предупреждение через секунду, укус с пятой секунды, в
   полную силу к десятой; движение и авария сбрасывают счёт; первые десять
   минут свежего сейва рой не кусает. */
TEST_SUITES.push(() => suite("рой: предупреждает раньше, чем кусает, и не крутит аварию",{tier:"node"}, () => {
  resetWorld();
  const here0=natSwarmHere;natSwarmHere=()=>true;
  const wreck0=wreck;let wrecks=0;wreck=function(why){wrecks++;return wreck0(why);};
  try{
    G.mode="system";G.ship.vx=0;G.ship.vy=0;G.running=true;
    const st=stat();G.hull=st.hullMax;const h0=G.hull;
    /* свежий сейв: десять минут рой не кусает, но предупреждает */
    G.t=0;G.msg="";NAT_STAND=0;
    for(let i=0;i<60*12;i++){G.t+=1;natSwarmTick(1);}
    eq(G.hull,h0,"первые десять минут свежего сейва корпус цел");
    ok(/РОЙ/.test(G.msg||""),"но слово сказано: "+G.msg);
    /* после льготы: пять секунд стоя — цел, потом укус, к десятой в полную силу */
    G.t=NAT_SWARM_GRACE+1;NAT_STAND=0;G.msg="";
    for(let i=0;i<NAT_SWARM_BITE-1;i++){G.t+=1;natSwarmTick(1);}
    eq(G.hull,h0,"до пятой секунды стоя корпус цел");
    ok(/РОЙ/.test(G.msg||""),"предупреждение прозвучало до укуса");
    for(let i=0;i<60;i++){G.t+=1;natSwarmTick(1);}
    ok(G.hull<h0&&h0-G.hull<NAT_SWARM_DMG*60,"шестая секунда — укус вполсилы: −"+(h0-G.hull).toFixed(1));
    /* движение сбрасывает счёт */
    G.ship.vx=6;natSwarmTick(1);eq(NAT_STAND,0,"ход сбросил счёт");
    G.ship.vx=0;const h1=G.hull;
    for(let i=0;i<NAT_SWARM_BITE-1;i++){G.t+=1;natSwarmTick(1);}
    eq(G.hull,h1,"после хода снова пять секунд льготы");
    /* авария: после неё корабль стоит, и рой обязан дать те же пять секунд */
    G.hull=.5;NAT_STAND=NAT_SWARM_FULL;G.t+=1;natSwarmTick(1);
    eq(wrecks,1,"разбит один раз");
    ok(G.hull>0,"авария собрала корпус: "+G.hull);
    const h2=G.hull;
    for(let i=0;i<NAT_SWARM_BITE-1;i++){G.t+=1;natSwarmTick(1);}
    eq(wrecks,1,"вторая авария не наступила за пять секунд стоя");
    eq(G.hull,h2,"после аварии корпус цел пять секунд");
  }finally{natSwarmHere=here0;wreck=wreck0;NAT_STAND=0;}
}));
