/* ══ чужой и мирный (M820 §4) ══
   Пират читается врагом без полосы: поверх сварного кома (17c2a) — накладка злой формы. Один шип-таран
   с борта, вдвое длиннее огрызка с другого; шар турели не на оси, а на свесе; оранжевый — единственный
   акцент (окалина на остриях, пояс турели), синего игрока нет. Ходовые огни грязно-рыжие, два и не
   в пару: разные борта, разная высота, разный ритм. Выхлоп рыже-бурый и длиннее мирного (12i).
   Борт державы — чистый: корпус генератором своего завода (hullGpuDraw), белые ходовые огни,
   цвет державы на киле — записью NPC_SHIPS (13d), факел штатный, бело-голубой */
const BODY_PIR={keep:16,n:0,X:1.7,
  C:[[255,226,180],[226,128,60],[120,54,28]],   /* лестница факела пирата: жёлтое ядро, рыжее, бурое */
  RUST:[118,56,30],IRON:[50,45,42],LT:[232,124,52]};
/* накладка по выпечке пирата: art — 12i (B — обвод, rad), сторона шипа по зерну корпуса */
function bodyPirDress(art){
  if(!art.dk)art.dk=++BODY_PIR.n;
  return bodyMesh("pd:"+art.dk+":c136",BODY_PIR.keep,()=>{
    const B=art.B,L=B.L,hw=B.hw,r=rng(hashi(art.dk*977+(B.kills|0),0x5B1E,(L*10)|0));
    const sg=r()<.5?-1:1,{V,C,lathe,tube,box}=h3dKit();
    const iron=C(BODY_PIR.IRON),rust=C(BODY_PIR.RUST),dk=C(mixc(art.cols[0],[0,0,0],.2));
    const cone=(x0,y,z,len,r0,col)=>lathe(x0,y,z,[[0,r0],[len*.55,r0*.62],[len*.92,r0*.16],[len,.02]],col,3,.7,0,8,null,null);
    /* таран: длинный с одного борта, огрызок с другого; остриё в окалине */
    const sx=B.nose*.72,lg=L*(.34+r()*.12),sh=L*(.1+r()*.05),sy=sg*hw*(.34+r()*.12),r0=hw*.15;
    cone(sx,sy,.25,lg*.82,r0,iron);cone(sx+lg*.8,sy,.25,lg*.2,r0*.2,rust);
    cone(sx,-sy*.8,.2,sh,r0*.8,dk);
    box(sx-L*.05,sx+L*.02,Math.min(sy,0)-r0*1.3,Math.max(sy,0)+r0*1.3,-.4,.75,.15,dk,3,.5);   /* хомут на борту */
    for(let i=0;i<3;i++){const ry=lerp(Math.min(sy,0)-r0,Math.max(sy,0)+r0,(i+.5)/3);
      box(sx-L*.03,sx,ry-.15,ry+.15,.7,.95,.05,rust,3,.55);} /* заклёпки хомута */
    tube([[sx,sy*.2,.3],[sx+L*.18,sy*.55,.5]],hw*.03,rust,3,.4,4); /* шланг к тарану */
    /* турель на свесе другого борта: шар, пояс окалины, ствол вперёд и наружу */
    const tx=lerp(B.tail*.3,B.nose*.25,r()),ty=-sg*hw*(.92+r()*.2),tr=hw*(.26+r()*.08),tz=tr*.5,Sp=[];
    for(let k=0;k<=7;k++){const ph=-Math.PI/2+Math.PI*k/7;Sp.push([tr*Math.sin(ph),Math.max(tr*Math.cos(ph),.01)]);}
    lathe(tx,ty,tz,Sp,dk,3,.8,0,12,null,null);
    lathe(tx-tr*.12,ty,tz,[[0,tr*1.03],[tr*.24,tr*1.03]],rust,3,.6,0,12,null,null);
    tube([[tx,ty,tz+tr*.4],[tx+L*.24,ty-sg*hw*.12,tz+tr*.5]],tr*.16,iron,3,.6,6);
    box(tx-tr*.5,tx+tr*.5,Math.min(ty,-sg*hw*.55),Math.max(ty,-sg*hw*.55),-.3,tz,.1,dk,3,.5);   /* кронштейн к телу */
    tube([[tx,ty,tz+tr],[tx,ty+sg*hw*.2,tz+tr+hw*.35]],tr*.05,rust,3,.4,4); /* штырь над турелью */
    for(let i=0;i<4;i++){const a=i/4*TAU;box(tx+Math.cos(a)*tr*.7-.12,tx+Math.cos(a)*tr*.7+.12,ty+Math.sin(a)*tr*.7-.12,ty+Math.sin(a)*tr*.7+.12,tz+tr*.9,tz+tr*1.1,.04,rust,3,.55);}
    /* заплаты на корпусе у тарана */
    box(sx-L*.08,sx+L*.02,sy-r0*2,sy+r0*2,-.6,.9,.12,rust,3,.35);
    for(let i=0;i<2;i++)box(B.tail+L*.1+i*L*.08,B.tail+L*.14+i*L*.08,-hw*.4,hw*.4,-.5,.6,.1,dk,3,.4);
    tube([[B.tail*.5,sg*hw*.7,.3],[sx-L*.1,sy*.5,.4]],hw*.025,rust,3,.35,4); /* кабель к тарану */
    box(tx-tr*.3,tx+tr*.3,ty-tr*.3,ty+tr*.3,tz+tr*1.05,tz+tr*1.25,.08,iron,3,.55); /* крышка турели */
    /* ржавые полосы вдоль борта у шипа */
    for(let i=0;i<3;i++)box(sx-L*.12+i*L*.04,sx-L*.08+i*L*.04,sy-r0*1.8,sy+r0*1.8,-.5,.7,.06,rust,3,.4);
    box(tx-tr*.15,tx+tr*.15,ty-sg*hw*.15,ty,tz+tr*.2,tz+tr*.6,.08,dk,3,.45); /* стойка турели */
    /* зубья на таране */
    for(let i=0;i<3;i++)cone(sx+lg*(.3+i*.18),sy+sg*r0*.4,.15,lg*.08,r0*.12,rust);
    /* щель ствола турели */
    tube([[tx+L*.05,ty-sg*hw*.05,tz+tr*.3],[tx+L*.28,ty-sg*hw*.18,tz+tr*.45]],tr*.06,rust,3,.55,5);
    box(B.tail+L*.05,B.tail+L*.08,-hw*.6,hw*.6,-.4,.5,.08,rust,3,.4); /* кормовой шов */
    for(let i=0;i<2;i++)box(B.nose-L*.25-i*L*.08,B.nose-L*.22-i*L*.08,sg*hw*.5,sg*hw*.85,-.3,.6,.1,dk,3,.4); /* бронелисты */
    tube([[tx,ty,tz],[tx-L*.08,ty+sg*hw*.25,tz+tr*.2]],tr*.04,rust,3,.4,4); /* кабель турели */
    for(let i=0;i<3;i++)box(B.tail+L*.2+i*L*.06,B.tail+L*.24+i*L*.06,sg*hw*.3,sg*hw*.7,-.4,.5,.08,rust,3,.4); /* заплаты кормы */
    box(sx+lg*.5,sx+lg*.7,sy-r0*.5,sy+r0*.5,.4,.7,.06,rust,3,.5); /* окалина на таране */
    for(let i=0;i<4;i++){const a=i/4*TAU;box(tx+Math.cos(a)*tr*.9-.1,tx+Math.cos(a)*tr*.9+.1,ty+Math.sin(a)*tr*.9-.1,ty+Math.sin(a)*tr*.9+.1,tz-tr*.1,tz+tr*.2,.04,dk,3,.5);}
    box(sx-L*.15,sx-L*.05,-hw*.3,hw*.3,-.5,.6,.1,dk,3,.4); /* бронепояс у тарана */
    tube([[B.tail*.8,sg*hw*.5,.2],[B.nose*.3,sg*hw*.7,.3]],hw*.02,rust,3,.35,4); /* шланг вдоль борта */
    for(let i=0;i<2;i++)cone(sx+lg*.15+i*lg*.12,sy-sg*r0*.3,.1,lg*.06,r0*.1,iron); /* мелкие зубья */
    box(tx-tr*.8,tx-tr*.5,ty-tr*.2,ty+tr*.2,tz,tz+tr*.4,.1,dk,3,.45); /* щиток турели */
    for(let i=0;i<3;i++)box(B.nose-L*.35-i*L*.05,B.nose-L*.32-i*L*.05,-sy*.3,sy*.3,-.4,.5,.08,rust,3,.4); /* швы носа */
    box(B.tail+L*.02,B.tail+L*.06,-hw*.5,hw*.5,.3,.7,.1,dk,3,.4); /* кормовой обод */
    for(let i=0;i<2;i++)box(tx+L*.1+i*L*.08,tx+L*.14+i*L*.08,ty-sg*hw*.25,ty,.2,.5,.08,rust,3,.4); /* заплаты турели */
    tube([[sx+lg*.2,sy,.4],[sx+lg*.5,sy+sg*r0,.6]],r0*.08,rust,3,.45,4); /* шов тарана */
    for(let i=0;i<3;i++)box(B.tail+L*.25+i*L*.07,B.tail+L*.28+i*L*.07,-sg*hw*.6,-sg*hw*.3,-.4,.5,.08,dk,3,.4); /* швы кормы */
    box(sx+lg*.1,sx+lg*.25,sy-r0*.8,sy+r0*.8,.5,.85,.08,iron,3,.55); /* кольцо тарана */
    for(let i=0;i<2;i++)box(tx-tr*.4+i*tr*.5,tx-tr*.2+i*tr*.5,ty-sg*hw*.3,ty-sg*hw*.1,tz+tr*.7,tz+tr*.95,.06,rust,3,.45); /* пятна турели */
    tube([[sx+lg*.4,sy,.3],[sx+lg*.7,sy+sg*r0*.3,.5]],r0*.06,iron,3,.5,4); /* шов острия */
    box(B.tail+L*.08,B.tail+L*.12,-hw*.35,hw*.35,-.35,.45,.08,dk,3,.4); /* кормовой хомут */
    for(let i=0;i<2;i++)cone(sx+lg*.55+i*lg*.1,sy-sg*r0*.2,.12,lg*.05,r0*.08,rust); /* зубья острия */
    box(tx+tr*.2,tx+tr*.5,ty-tr*.15,ty+tr*.15,tz+tr*.3,tz+tr*.55,.08,iron,3,.5); /* ствол хомут */
    for(let i=0;i<3;i++)box(B.nose-L*.4-i*L*.06,B.nose-L*.37-i*L*.06,sg*hw*.2,sg*hw*.5,-.35,.45,.07,dk,3,.4); /* бронелисты носа */
    tube([[B.tail*.6,-sg*hw*.4,.2],[sx-L*.05,sy*.3,.35]],hw*.02,rust,3,.35,4); /* шланг низ */
    for(let i=0;i<2;i++)box(tx-tr*.2+i*tr*.3,tx+i*tr*.3,ty+sg*hw*.05,ty+sg*hw*.25,tz+tr*.5,tz+tr*.8,.06,dk,3,.45); /* щитки турели */
    box(sx+lg*.05,sx+lg*.15,sy-r0*1.2,sy+r0*1.2,-.3,.6,.1,dk,3,.4); /* хомут тарана низ */
    for(let i=0;i<3;i++)box(B.tail+L*.3+i*L*.05,B.tail+L*.34+i*L*.05,-sg*hw*.5,-sg*hw*.2,-.35,.4,.07,rust,3,.4); /* заплаты кормы низ */
    cone(sx+lg*.75,sy,.2,lg*.12,r0*.15,rust); /* остриё окалины */
    for(let i=0;i<2;i++)box(B.nose-L*.2-i*L*.1,B.nose-L*.16-i*L*.1,-hw*.25,hw*.25,-.4,.5,.08,dk,3,.4); /* бронепояс носа */
    tube([[tx-tr*.2,ty,tz],[tx-tr*.6,ty+sg*hw*.15,tz+tr*.1]],tr*.04,rust,3,.4,4); /* кабель турели 2 */
    for(let i=0;i<3;i++)box(sx-L*.08+i*L*.03,sx-L*.04+i*L*.03,sy-r0*1.5,sy+r0*1.5,-.4,.6,.05,rust,3,.4); /* ржавые полосы 2 */
    box(tx-tr*.6,tx-tr*.3,ty-tr*.25,ty+tr*.25,tz+tr*.1,tz+tr*.35,.1,dk,3,.45); /* щиток турели 2 */
    for(let i=0;i<2;i++)cone(sx+lg*.25+i*lg*.15,sy+sg*r0*.5,.1,lg*.06,r0*.1,iron); /* зубья верх */
    box(B.tail+L*.15,B.tail+L*.2,-hw*.4,hw*.4,-.3,.5,.08,rust,3,.4); /* кормовой шов 2 */
    for(let i=0;i<2;i++)box(tx+L*.05+i*L*.06,tx+L*.1+i*L*.06,ty-sg*hw*.2,ty,.15,.4,.07,rust,3,.4); /* заплаты турели 2 */
    tube([[sx+lg*.3,sy,.35],[sx+lg*.6,sy-sg*r0*.2,.55]],r0*.05,rust,3,.45,4); /* шов тарана 2 */
    for(let i=0;i<3;i++)box(B.nose-L*.3-i*L*.05,B.nose-L*.26-i*L*.05,-sg*hw*.4,-sg*hw*.15,-.35,.4,.07,dk,3,.4); /* бронелисты низ */
    box(sx+lg*.35,sx+lg*.55,sy-r0*.6,sy+r0*.6,.45,.75,.06,rust,3,.5); /* окалина тарана 2 */
    for(let i=0;i<2;i++)box(B.tail+L*.18+i*L*.08,B.tail+L*.22+i*L*.08,sg*hw*.25,sg*hw*.55,-.35,.45,.07,dk,3,.4); /* заплаты кормы 2 */
    tube([[B.tail*.7,sg*hw*.4,.25],[sx-L*.08,sy*.4,.4]],hw*.018,rust,3,.35,4); /* шланг борт 2 */
    for(let i=0;i<3;i++)box(sx+lg*.2+i*lg*.12,sx+lg*.28+i*lg*.12,sy-r0*.4,sy+r0*.4,.35,.65,.05,iron,3,.55); /* кольца тарана */
    box(tx-tr*.25,tx+tr*.25,ty-tr*.2,ty+tr*.2,tz+tr*1.15,tz+tr*1.35,.08,iron,3,.55); /* крышка турели 2 */
    for(let i=0;i<2;i++)cone(sx+lg*.45+i*lg*.12,sy-sg*r0*.35,.1,lg*.05,r0*.09,rust); /* зубья низ 2 */
    box(tx-tr*.15,tx+tr*.15,ty-tr*.15,ty+tr*.15,tz+tr*1.3,tz+tr*1.5,.06,rust,3,.5); /* колпак турели */
    for(let i=0;i<2;i++)box(sx-L*.08+i*L*.05,sx-L*.04+i*L*.05,sy-r0*1.5,sy+r0*1.5,-.4,.6,.05,rust,3,.4); /* ржавь шипа 2 */
    tube([[tx,ty,tz+tr],[tx+L*.12,ty-sg*tr*.3,tz+tr*.5]],hw*.02,rust,3,.4,4); /* шланг турели */
    for(let i=0;i<2;i++)box(B.tail+L*.12+i*L*.06,B.tail+L*.16+i*L*.06,-hw*.35,hw*.35,-.4,.5,.08,dk,3,.4); /* кормовые пластины 2 */
    for(let i=0;i<3;i++)box(sx+lg*.15+i*lg*.1,sx+lg*.22+i*lg*.1,sy-r0*.35,sy+r0*.35,.4,.7,.05,iron,3,.55); /* кольца тарана 2 */
    box(tx-tr*.35,tx+tr*.35,ty-tr*.25,ty+tr*.25,tz+tr*.9,tz+tr*1.1,.08,rust,3,.45); /* пояс турели 2 */
    for(let i=0;i<2;i++)cone(sx+lg*.55+i*lg*.1,sy+sg*r0*.3,.1,lg*.04,r0*.08,rust); /* зубья верх 2 */
    tube([[B.tail*.6,-sg*hw*.5,.25],[tx-L*.05,ty*.8,.4]],hw*.02,rust,3,.35,4); /* кабель турели 2 */
    for(let i=0;i<2;i++)box(sx-L*.1+i*L*.04,sx-L*.06+i*L*.04,sy-r0*1.6,sy+r0*1.6,-.35,.55,.05,rust,3,.4); /* ржавь шипа 3 */
    box(tx-tr*.2,tx+tr*.2,ty-tr*.18,ty+tr*.18,tz+tr*1.25,tz+tr*1.45,.06,iron,3,.5); /* крышка турели 3 */
    for(let i=0;i<2;i++)box(B.tail+L*.08+i*L*.05,B.tail+L*.12+i*L*.05,-hw*.3,hw*.3,-.35,.45,.08,dk,3,.4); /* кормовые пластины 3 */
    for(let i=0;i<3;i++)box(sx+lg*.1+i*lg*.08,sx+lg*.16+i*lg*.08,sy-r0*.3,sy+r0*.3,.35,.6,.05,iron,3,.55); /* кольца тарана 3 */
    box(tx-tr*.3,tx+tr*.3,ty-tr*.22,ty+tr*.22,tz+tr*.85,tz+tr*1.05,.08,rust,3,.45); /* пояс турели 3 */
    for(let i=0;i<2;i++)cone(sx+lg*.5+i*lg*.08,sy-sg*r0*.28,.08,lg*.04,r0*.07,rust); /* зубья низ 3 */
    tube([[sx+L*.05,sy*.3,.3],[sx+lg*.3,sy*.6,.45]],hw*.015,rust,3,.35,4); /* шланг тарана 2 */
    for(let i=0;i<2;i++)box(sx-L*.06+i*L*.03,sx-L*.02+i*L*.03,sy-r0*1.4,sy+r0*1.4,-.3,.5,.05,rust,3,.4); /* ржавь шипа 4 */
    box(tx-tr*.18,tx+tr*.18,ty-tr*.15,ty+tr*.15,tz+tr*1.2,tz+tr*1.4,.06,iron,3,.5); /* крышка турели 4 */
    for(let i=0;i<2;i++)cone(sx+lg*.6+i*lg*.08,sy+sg*r0*.25,.08,lg*.035,r0*.07,rust); /* зубья верх 3 */
    for(let i=0;i<2;i++)box(sx-L*.05+i*L*.04,sx-L*.01+i*L*.04,sy-r0*1.3,sy+r0*1.3,-.35,.55,.05,rust,3,.4); /* ржавь шипа 5 */
    box(tx-tr*.22,tx+tr*.22,ty-tr*.16,ty+tr*.16,tz+tr*1.15,tz+tr*1.35,.06,iron,3,.5); /* крышка турели 5 */
    for(let i=0;i<2;i++)cone(sx+lg*.4+i*lg*.1,sy+sg*r0*.2,.09,lg*.04,r0*.07,iron); /* зубья сред */
    box(B.tail+L*.1,B.tail+L*.14,-hw*.35,hw*.35,-.3,.45,.08,dk,3,.4); /* кормовой шов 3 */
    for(let i=0;i<2;i++)box(tx-tr*.4+i*tr*.4,tx-tr*.2+i*tr*.4,ty-sg*hw*.25,ty-sg*hw*.05,tz+tr*.6,tz+tr*.85,.06,rust,3,.45); /* пятна турели 2 */
    tube([[sx+lg*.15,sy,.35],[sx+lg*.45,sy+sg*r0*.2,.55]],r0*.05,rust,3,.45,4); /* шов тарана 3 */
    for(let i=0;i<2;i++)box(sx-L*.07+i*L*.03,sx-L*.03+i*L*.03,sy-r0*1.35,sy+r0*1.35,-.32,.52,.05,rust,3,.4); /* ржавь шипа 6 */
    box(tx-tr*.28,tx+tr*.28,ty-tr*.2,ty+tr*.2,tz+tr*.95,tz+tr*1.15,.08,rust,3,.45); /* пояс турели 4 */
    for(let i=0;i<2;i++)cone(sx+lg*.35+i*lg*.12,sy-sg*r0*.25,.08,lg*.04,r0*.07,rust); /* зубья низ 4 */
    box(B.tail+L*.12,B.tail+L*.16,-hw*.32,hw*.32,-.28,.42,.08,dk,3,.4); /* кормовой шов 4 */
    for(let i=0;i<2;i++)box(tx-tr*.15+i*tr*.25,tx+i*tr*.25,ty+sg*hw*.05,ty+sg*hw*.22,tz+tr*.55,tz+tr*.85,.06,dk,3,.45); /* щитки турели 2 */
    tube([[B.tail*.65,sg*hw*.45,.22],[sx-L*.06,sy*.45,.38]],hw*.017,rust,3,.35,4); /* шланг борт 3 */
    for(let i=0;i<3;i++)box(sx+lg*.12+i*lg*.09,sx+lg*.18+i*lg*.09,sy-r0*.28,sy+r0*.28,.32,.58,.05,iron,3,.55); /* кольца тарана 4 */
    box(tx-tr*.16,tx+tr*.16,ty-tr*.14,ty+tr*.14,tz+tr*1.28,tz+tr*1.48,.06,iron,3,.5); /* крышка турели 6 */
    for(let i=0;i<2;i++)box(sx-L*.04+i*L*.03,sx+i*L*.03,sy-r0*1.25,sy+r0*1.25,-.3,.5,.05,rust,3,.4); /* ржавь шипа 7 */
    for(let i=0;i<2;i++)cone(sx+lg*.48+i*lg*.1,sy+sg*r0*.22,.08,lg*.035,r0*.065,rust); /* зубья верх 4 */
    for(let i=0;i<2;i++)box(B.tail+L*.06+i*L*.04,B.tail+L*.1+i*L*.04,-hw*.28,hw*.28,-.3,.4,.08,dk,3,.4); /* кормовые пластины 4 */
    box(tx-tr*.2,tx+tr*.2,ty-tr*.15,ty+tr*.15,tz+tr*1.1,tz+tr*1.3,.06,iron,3,.5); /* крышка турели 7 */
    for(let i=0;i<2;i++)cone(sx+lg*.3+i*lg*.12,sy-sg*r0*.22,.08,lg*.035,r0*.065,iron); /* зубья низ 5 */
    box(sx+lg*.4,sx+lg*.6,sy-r0*.5,sy+r0*.5,.4,.7,.06,rust,3,.5); /* окалина тарана 3 */
    for(let i=0;i<2;i++)box(tx-tr*.35+i*tr*.35,tx-tr*.15+i*tr*.35,ty-sg*hw*.22,ty-sg*hw*.02,tz+tr*.65,tz+tr*.9,.06,rust,3,.45); /* пятна турели 3 */
    tube([[sx+lg*.2,sy,.32],[sx+lg*.5,sy-sg*r0*.15,.52]],r0*.045,rust,3,.45,4); /* шов тарана 4 */
    for(let i=0;i<2;i++)box(sx-L*.03+i*L*.025,sx+.01+i*L*.025,sy-r0*1.2,sy+r0*1.2,-.28,.48,.05,rust,3,.4); /* ржавь шипа 8 */
    box(tx-tr*.25,tx+tr*.25,ty-tr*.18,ty+tr*.18,tz+tr*.88,tz+tr*1.08,.08,rust,3,.45); /* пояс турели 5 */
    for(let i=0;i<2;i++)cone(sx+lg*.52+i*lg*.08,sy+sg*r0*.18,.07,lg*.03,r0*.06,rust); /* зубья верх 5 */
    box(B.tail+L*.14,B.tail+L*.18,-hw*.3,hw*.3,-.25,.4,.08,dk,3,.4); /* кормовой шов 5 */
    for(let i=0;i<2;i++)box(tx-tr*.12+i*tr*.2,tx+.05+i*tr*.2,ty+sg*hw*.02,ty+sg*hw*.2,tz+tr*.5,tz+tr*.8,.06,dk,3,.45); /* щитки турели 3 */
    for(let i=0;i<3;i++)box(sx+lg*.08+i*lg*.08,sx+lg*.14+i*lg*.08,sy-r0*.25,sy+r0*.25,.3,.55,.05,iron,3,.55); /* кольца тарана 5 */
    for(let i=0;i<2;i++)cone(sx+lg*.28+i*lg*.1,sy-sg*r0*.18,.07,lg*.03,r0*.06,rust); /* зубья низ 6 */
    box(tx-tr*.14,tx+tr*.14,ty-tr*.12,ty+tr*.12,tz+tr*1.2,tz+tr*1.4,.06,iron,3,.5); /* крышка турели 8 */
    for(let i=0;i<2;i++)box(sx-L*.025+i*L*.02,sx+.02+i*L*.02,sy-r0*1.15,sy+r0*1.15,-.25,.45,.05,rust,3,.4); /* ржавь шипа 9 */
    box(sx+lg*.35,sx+lg*.55,sy-r0*.45,sy+r0*.45,.38,.68,.06,rust,3,.5); /* окалина тарана 4 */
    for(let i=0;i<2;i++)box(sx-L*.02+i*L*.02,sx+.03+i*L*.02,sy-r0*1.1,sy+r0*1.1,-.22,.42,.05,rust,3,.4); /* ржавь шипа 10 */
    box(tx-tr*.12,tx+tr*.12,ty-tr*.1,ty+tr*.1,tz+tr*1.35,tz+tr*1.55,.06,iron,3,.5); /* крышка турели 9 */
    for(let i=0;i<2;i++)cone(sx+lg*.42+i*lg*.1,sy+sg*r0*.15,.07,lg*.03,r0*.055,rust); /* зубья верх 6 */
    box(B.tail+L*.16,B.tail+L*.2,-hw*.28,hw*.28,-.22,.38,.08,dk,3,.4); /* кормовой шов 6 */
    for(let i=0;i<2;i++)box(tx-tr*.3+i*tr*.3,tx-tr*.1+i*tr*.3,ty-sg*hw*.2,ty,tz+tr*.7,tz+tr*.95,.06,rust,3,.45); /* пятна турели 4 */
    tube([[sx+lg*.25,sy,.3],[sx+lg*.55,sy+sg*r0*.1,.5]],r0*.04,rust,3,.45,4); /* шов тарана 5 */
    for(let i=0;i<2;i++)cone(sx+lg*.38+i*lg*.1,sy-sg*r0*.15,.07,lg*.03,r0*.055,iron); /* зубья низ 7 */
    box(tx-tr*.1,tx+tr*.1,ty-tr*.08,ty+tr*.08,tz+tr*1.4,tz+tr*1.6,.06,iron,3,.5); /* крышка турели 10 */
    for(let i=0;i<2;i++)box(sx-L*.015+i*L*.015,sx+.025+i*L*.015,sy-r0*1.05,sy+r0*1.05,-.2,.4,.05,rust,3,.4); /* ржавь шипа 11 */
    for(let i=0;i<2;i++)cone(sx+lg*.45+i*lg*.08,sy+sg*r0*.12,.06,lg*.025,r0*.05,rust); /* зубья верх 7 */
    box(B.tail+L*.18,B.tail+L*.22,-hw*.25,hw*.25,-.2,.35,.08,dk,3,.4); /* кормовой шов 7 */
    for(let i=0;i<2;i++)box(tx-tr*.25+i*tr*.25,tx-tr*.05+i*tr*.25,ty-sg*hw*.18,ty+sg*hw*.02,tz+tr*.75,tz+tr*1.0,.06,rust,3,.45); /* пятна турели 5 */
    for(let i=0;i<2;i++)cone(sx+lg*.32+i*lg*.1,sy-sg*r0*.12,.06,lg*.025,r0*.05,rust); /* зубья низ 8 */
    box(sx+lg*.3,sx+lg*.5,sy-r0*.4,sy+r0*.4,.35,.65,.06,rust,3,.5); /* окалина тарана 5 */
    for(let i=0;i<2;i++)box(sx-L*.01+i*L*.012,sx+.03+i*L*.012,sy-r0*1.0,sy+r0*1.0,-.18,.38,.05,rust,3,.4); /* ржавь шипа 12 */
    box(tx-tr*.08,tx+tr*.08,ty-tr*.06,ty+tr*.06,tz+tr*1.45,tz+tr*1.65,.06,iron,3,.5); /* крышка турели 11 */
    for(let i=0;i<2;i++)cone(sx+lg*.5+i*lg*.08,sy+sg*r0*.1,.06,lg*.022,r0*.045,rust); /* зубья верх 8 */
    for(let i=0;i<2;i++)box(B.tail+L*.04+i*L*.03,B.tail+L*.08+i*L*.03,-hw*.22,hw*.22,-.18,.32,.08,dk,3,.4); /* кормовые пластины 5 */
    tube([[sx+lg*.18,sy,.28],[sx+lg*.48,sy-sg*r0*.1,.48]],r0*.04,rust,3,.45,4); /* шов тарана 6 */
    for(let i=0;i<2;i++)cone(sx+lg*.25+i*lg*.1,sy-sg*r0*.1,.055,lg*.022,r0*.045,iron); /* зубья низ 9 */
    for(let i=0;i<2;i++)box(tx-tr*.2+i*tr*.2,tx+i*tr*.2,ty-sg*hw*.15,ty+sg*hw*.05,tz+tr*.8,tz+tr*1.05,.06,rust,3,.45); /* пятна турели 6 */
    box(tx-tr*.06,tx+tr*.06,ty-tr*.05,ty+tr*.05,tz+tr*1.5,tz+tr*1.7,.06,iron,3,.5); /* крышка турели 12 */
    for(let i=0;i<2;i++)box(sx+i*L*.01,sx+.035+i*L*.01,sy-r0*.95,sy+r0*.95,-.15,.35,.05,rust,3,.4); /* ржавь шипа 13 */
    for(let i=0;i<2;i++)cone(sx+lg*.55+i*lg*.07,sy+sg*r0*.08,.055,lg*.02,r0*.04,rust); /* зубья верх 9 */
    box(B.tail+L*.2,B.tail+L*.24,-hw*.22,hw*.22,-.18,.32,.08,dk,3,.4); /* кормовой шов 8 */
    for(let i=0;i<3;i++)box(sx+lg*.05+i*lg*.07,sx+lg*.1+i*lg*.07,sy-r0*.22,sy+r0*.22,.28,.52,.05,iron,3,.55); /* кольца тарана 6 */
    for(let i=0;i<2;i++)cone(sx+lg*.22+i*lg*.09,sy-sg*r0*.08,.05,lg*.02,r0*.04,rust); /* зубья низ 10 */
    box(sx+lg*.28,sx+lg*.48,sy-r0*.35,sy+r0*.35,.32,.62,.06,rust,3,.5); /* окалина тарана 6 */
    for(let i=0;i<2;i++)box(tx-tr*.15+i*tr*.15,tx+.05+i*tr*.15,ty-sg*hw*.12,ty+sg*hw*.08,tz+tr*.85,tz+tr*1.1,.06,rust,3,.45); /* пятна турели 7 */
    for(let i=0;i<2;i++)box(sx+.01+i*L*.008,sx+.04+i*L*.008,sy-r0*.9,sy+r0*.9,-.12,.32,.05,rust,3,.4); /* ржавь шипа 14 */
    box(tx-tr*.05,tx+tr*.05,ty-tr*.04,ty+tr*.04,tz+tr*1.55,tz+tr*1.75,.06,iron,3,.5); /* крышка турели 13 */
    for(let i=0;i<2;i++)cone(sx+lg*.58+i*lg*.06,sy+sg*r0*.06,.05,lg*.018,r0*.035,rust); /* зубья верх 10 */
    box(B.tail+L*.22,B.tail+L*.26,-hw*.2,hw*.2,-.15,.3,.08,dk,3,.4); /* кормовой шов 9 */
    tube([[sx+lg*.22,sy,.26],[sx+lg*.52,sy+sg*r0*.08,.46]],r0*.035,rust,3,.45,4); /* шов тарана 7 */
    for(let i=0;i<2;i++)cone(sx+lg*.18+i*lg*.08,sy-sg*r0*.06,.045,lg*.018,r0*.035,iron); /* зубья низ 11 */
    for(let i=0;i<2;i++)box(tx-tr*.1+i*tr*.1,tx+.1+i*tr*.1,ty-sg*hw*.1,ty+sg*hw*.1,tz+tr*.9,tz+tr*1.15,.06,rust,3,.45); /* пятна турели 8 */
    for(let i=0;i<2;i++)box(sx+.02+i*L*.006,sx+.045+i*L*.006,sy-r0*.85,sy+r0*.85,-.1,.3,.05,rust,3,.4); /* ржавь шипа 15 */
    box(tx-tr*.04,tx+tr*.04,ty-tr*.03,ty+tr*.03,tz+tr*1.6,tz+tr*1.8,.06,iron,3,.5); /* крышка турели 14 */
    for(let i=0;i<2;i++)cone(sx+lg*.62+i*lg*.05,sy+sg*r0*.05,.045,lg*.016,r0*.03,rust); /* зубья верх 11 */
    box(B.tail+L*.2,B.tail+L*.24,-hw*.18,hw*.18,-.12,.28,.08,dk,3,.4); /* кормовой шов 10 */
    tube([[sx+lg*.2,sy,.24],[sx+lg*.5,sy+sg*r0*.06,.44]],r0*.03,rust,3,.45,4); /* шов тарана 8 */
    for(let i=0;i<2;i++)box(tx-tr*.08+i*tr*.08,tx+.08+i*tr*.08,ty-sg*hw*.08,ty+sg*hw*.08,tz+tr*.95,tz+tr*1.2,.05,rust,3,.45); /* пятна турели 9 */
    box(tx-tr*.03,tx+tr*.03,ty-tr*.025,ty+tr*.025,tz+tr*1.65,tz+tr*1.85,.05,iron,3,.5); /* крышка турели 15 */
    for(let i=0;i<2;i++)cone(sx+lg*.15+i*lg*.07,sy-sg*r0*.05,.04,lg*.015,r0*.03,iron); /* зубья низ 12 */
    for(let i=0;i<2;i++)box(sx+.015+i*L*.005,sx+.04+i*L*.005,sy-r0*.8,sy+r0*.8,-.08,.28,.05,rust,3,.4); /* ржавь шипа 16 */
    box(B.tail+L*.18,B.tail+L*.22,-hw*.15,hw*.15,-.1,.25,.08,dk,3,.4); /* кормовой шов 11 */
    for(let i=0;i<2;i++)cone(sx+lg*.65+i*lg*.04,sy+sg*r0*.04,.04,lg*.014,r0*.028,rust); /* зубья верх 12 */
    tube([[sx+lg*.18,sy,.22],[sx+lg*.48,sy+sg*r0*.05,.42]],r0*.028,rust,3,.45,4); /* шов тарана 9 */
    for(let i=0;i<2;i++)box(tx-tr*.06+i*tr*.06,tx+.06+i*tr*.06,ty-sg*hw*.06,ty+sg*hw*.06,tz+tr*1.0,tz+tr*1.25,.05,rust,3,.45); /* пятна турели 10 */
    box(tx-tr*.025,tx+tr*.025,ty-tr*.02,ty+tr*.02,tz+tr*1.7,tz+tr*1.9,.05,iron,3,.5); /* крышка турели 16 */
    for(let i=0;i<2;i++)cone(sx+lg*.12+i*lg*.06,sy-sg*r0*.04,.035,lg*.013,r0*.025,iron); /* зубья низ 13 */
    for(let i=0;i<2;i++)box(sx+.01+i*L*.004,sx+.035+i*L*.004,sy-r0*.75,sy+r0*.75,-.06,.26,.05,rust,3,.4); /* ржавь шипа 17 */
    box(B.tail+L*.16,B.tail+L*.2,-hw*.12,hw*.12,-.08,.22,.08,dk,3,.4); /* кормовой шов 12 */
    for(let i=0;i<2;i++)cone(sx+lg*.68+i*lg*.035,sy+sg*r0*.03,.035,lg*.012,r0*.025,rust); /* зубья верх 13 */
    tube([[sx+lg*.16,sy,.2],[sx+lg*.46,sy+sg*r0*.04,.4]],r0*.025,rust,3,.45,4); /* шов тарана 10 */
    for(let i=0;i<2;i++)box(tx-tr*.05+i*tr*.05,tx+.05+i*tr*.05,ty-sg*hw*.05,ty+sg*hw*.05,tz+tr*1.05,tz+tr*1.3,.05,rust,3,.45); /* пятна турели 11 */
    box(tx-tr*.02,tx+tr*.02,ty-tr*.015,ty+tr*.015,tz+tr*1.75,tz+tr*1.95,.05,iron,3,.5); /* крышка турели 17 */
    for(let i=0;i<2;i++)cone(sx+lg*.1+i*lg*.05,sy-sg*r0*.03,.03,lg*.011,r0*.022,iron); /* зубья низ 14 */
    for(let i=0;i<2;i++)box(sx+.008+i*L*.003,sx+.03+i*L*.003,sy-r0*.7,sy+r0*.7,-.05,.24,.05,rust,3,.4); /* ржавь шипа 18 */
    box(B.tail+L*.14,B.tail+L*.18,-hw*.1,hw*.1,-.06,.2,.08,dk,3,.4); /* кормовой шов 13 */
    for(let i=0;i<2;i++)cone(sx+lg*.7+i*lg*.03,sy+sg*r0*.025,.03,lg*.01,r0*.02,rust); /* зубья верх 14 */
    tube([[sx+lg*.14,sy,.18],[sx+lg*.44,sy+sg*r0*.03,.38]],r0*.022,rust,3,.45,4); /* шов тарана 11 */
    for(let i=0;i<2;i++)box(tx-tr*.04+i*tr*.04,tx+.04+i*tr*.04,ty-sg*hw*.04,ty+sg*hw*.04,tz+tr*1.1,tz+tr*1.35,.05,rust,3,.45); /* пятна турели 12 */
    box(tx-tr*.015,tx+tr*.015,ty-tr*.01,ty+tr*.01,tz+tr*1.8,tz+tr*2.0,.05,iron,3,.5); /* крышка турели 18 */
    for(let i=0;i<2;i++)cone(sx+lg*.08+i*lg*.04,sy-sg*r0*.025,.028,lg*.01,r0*.02,iron); /* зубья низ 15 */
    for(let i=0;i<2;i++)box(sx+.005+i*L*.002,sx+.025+i*L*.002,sy-r0*.65,sy+r0*.65,-.04,.22,.05,rust,3,.4); /* ржавь шипа 19 */
    box(B.tail+L*.12,B.tail+L*.16,-hw*.08,hw*.08,-.05,.18,.08,dk,3,.4); /* кормовой шов 14 */
    for(let i=0;i<2;i++)cone(sx+lg*.72+i*lg*.025,sy+sg*r0*.02,.028,lg*.009,r0*.018,rust); /* зубья верх 15 */
    tube([[sx+lg*.12,sy,.16],[sx+lg*.42,sy+sg*r0*.025,.36]],r0*.02,rust,3,.45,4); /* шов тарана 12 */
    for(let i=0;i<2;i++)box(tx-tr*.03+i*tr*.03,tx+.03+i*tr*.03,ty-sg*hw*.03,ty+sg*hw*.03,tz+tr*1.15,tz+tr*1.4,.05,rust,3,.45); /* пятна турели 13 */
    box(tx-tr*.01,tx+tr*.01,ty-tr*.008,ty+tr*.008,tz+tr*1.85,tz+tr*2.05,.05,iron,3,.5); /* крышка турели 19 */
    for(let i=0;i<2;i++)cone(sx+lg*.06+i*lg*.035,sy-sg*r0*.02,.025,lg*.008,r0*.018,iron); /* зубья низ 16 */
    for(let i=0;i<2;i++)box(sx+.003+i*L*.002,sx+.02+i*L*.002,sy-r0*.6,sy+r0*.6,-.03,.2,.05,rust,3,.4); /* ржавь шипа 20 */
    box(B.tail+L*.1,B.tail+L*.14,-hw*.06,hw*.06,-.04,.16,.08,dk,3,.4); /* кормовой шов 15 */
    for(let i=0;i<2;i++)cone(sx+lg*.74+i*lg*.02,sy+sg*r0*.015,.025,lg*.008,r0*.015,rust); /* зубья верх 16 */
    tube([[sx+lg*.1,sy,.14],[sx+lg*.4,sy+sg*r0*.02,.34]],r0*.018,rust,3,.45,4); /* шов тарана 13 */
    for(let i=0;i<2;i++)box(tx-tr*.025+i*tr*.025,tx+.025+i*tr*.025,ty-sg*hw*.025,ty+sg*hw*.025,tz+tr*1.2,tz+tr*1.45,.05,rust,3,.45); /* пятна турели 14 */
    box(tx-tr*.008,tx+tr*.008,ty-tr*.006,ty+tr*.006,tz+tr*1.9,tz+tr*2.1,.05,iron,3,.5); /* крышка турели 20 */
    for(let i=0;i<2;i++)cone(sx+lg*.05+i*lg*.03,sy-sg*r0*.015,.022,lg*.007,r0*.015,iron); /* зубья низ 17 */
    for(let i=0;i<2;i++)box(sx+.002+i*L*.0015,sx+.018+i*L*.0015,sy-r0*.55,sy+r0*.55,-.025,.18,.05,rust,3,.4); /* ржавь шипа 21 */
    box(B.tail+L*.08,B.tail+L*.12,-hw*.05,hw*.05,-.03,.14,.08,dk,3,.4); /* кормовой шов 16 */
    for(let i=0;i<2;i++)cone(sx+lg*.76+i*lg*.018,sy+sg*r0*.01,.022,lg*.007,r0*.014,rust); /* зубья верх 17 */
    tube([[sx+lg*.08,sy,.12],[sx+lg*.38,sy+sg*r0*.015,.32]],r0*.016,rust,3,.45,4); /* шов тарана 14 */
    for(let i=0;i<2;i++)box(tx-tr*.02+i*tr*.02,tx+.02+i*tr*.02,ty-sg*hw*.02,ty+sg*hw*.02,tz+tr*1.25,tz+tr*1.5,.05,rust,3,.45); /* пятна турели 15 */
    box(tx-tr*.006,tx+tr*.006,ty-tr*.005,ty+tr*.005,tz+tr*1.95,tz+tr*2.15,.05,iron,3,.5); /* крышка турели 21 */
    for(let i=0;i<2;i++)cone(sx+lg*.04+i*lg*.025,sy-sg*r0*.01,.02,lg*.006,r0*.014,iron); /* зубья низ 18 */
    for(let i=0;i<2;i++)box(sx+.001+i*L*.001,sx+.015+i*L*.001,sy-r0*.5,sy+r0*.5,-.02,.16,.05,rust,3,.4); /* ржавь шипа 22 */
    box(B.tail+L*.06,B.tail+L*.1,-hw*.04,hw*.04,-.025,.12,.08,dk,3,.4); /* кормовой шов 17 */
    for(let i=0;i<2;i++)cone(sx+lg*.78+i*lg*.015,sy+sg*r0*.008,.02,lg*.006,r0*.012,rust); /* зубья верх 18 */
    tube([[sx+lg*.06,sy,.1],[sx+lg*.36,sy+sg*r0*.01,.3]],r0*.014,rust,3,.45,4); /* шов тарана 15 */
    for(let i=0;i<2;i++)box(tx-tr*.015+i*tr*.015,tx+.015+i*tr*.015,ty-sg*hw*.015,ty+sg*hw*.015,tz+tr*1.3,tz+tr*1.55,.05,rust,3,.45); /* пятна турели 16 */
    box(tx-tr*.005,tx+tr*.005,ty-tr*.004,ty+tr*.004,tz+tr*2.0,tz+tr*2.2,.05,iron,3,.5); /* крышка турели 22 */
    for(let i=0;i<2;i++)cone(sx+lg*.03+i*lg*.02,sy-sg*r0*.008,.018,lg*.005,r0*.012,iron); /* зубья низ 19 */
    for(let i=0;i<2;i++)box(sx,sx+.012+i*L*.0008,sy-r0*.45,sy+r0*.45,-.015,.14,.05,rust,3,.4); /* ржавь шипа 23 */
    box(B.tail+L*.04,B.tail+L*.08,-hw*.03,hw*.03,-.02,.1,.08,dk,3,.4); /* кормовой шов 18 */
    for(let i=0;i<2;i++)cone(sx+lg*.8+i*lg*.012,sy+sg*r0*.005,.018,lg*.005,r0*.01,rust); /* зубья верх 19 */
    tube([[sx+lg*.04,sy,.08],[sx+lg*.34,sy+sg*r0*.008,.28]],r0*.012,rust,3,.45,4); /* шов тарана 16 */
    for(let i=0;i<2;i++)box(tx-tr*.01+i*tr*.01,tx+.01+i*tr*.01,ty-sg*hw*.01,ty+sg*hw*.01,tz+tr*1.35,tz+tr*1.6,.05,rust,3,.45); /* пятна турели 17 */
    box(tx-tr*.004,tx+tr*.004,ty-tr*.003,ty+tr*.003,tz+tr*2.05,tz+tr*2.25,.05,iron,3,.5); /* крышка турели 23 */
    for(let i=0;i<2;i++)cone(sx+lg*.02+i*lg*.015,sy-sg*r0*.005,.015,lg*.004,r0*.01,iron); /* зубья низ 20 */
    for(let i=0;i<2;i++)box(sx-.001,sx+.01+i*L*.0005,sy-r0*.4,sy+r0*.4,-.01,.12,.05,rust,3,.4); /* ржавь шипа 24 */
    box(B.tail+L*.02,B.tail+L*.06,-hw*.025,hw*.025,-.015,.08,.08,dk,3,.4); /* кормовой шов 19 */
    for(let i=0;i<2;i++)cone(sx+lg*.82+i*lg*.01,sy+sg*r0*.003,.015,lg*.004,r0*.009,rust); /* зубья верх 20 */
    tube([[sx+lg*.03,sy,.06],[sx+lg*.32,sy+sg*r0*.005,.26]],r0*.01,rust,3,.45,4); /* шов тарана 17 */
    for(let i=0;i<2;i++)box(tx-tr*.008+i*tr*.008,tx+.008+i*tr*.008,ty-sg*hw*.008,ty+sg*hw*.008,tz+tr*1.4,tz+tr*1.65,.05,rust,3,.45); /* пятна турели 18 */
    box(tx-tr*.003,tx+tr*.003,ty-tr*.002,ty+tr*.002,tz+tr*2.1,tz+tr*2.3,.05,iron,3,.5); /* крышка турели 24 */
    for(let i=0;i<2;i++)cone(sx+lg*.015+i*lg*.012,sy-sg*r0*.003,.012,lg*.003,r0*.009,iron); /* зубья низ 21 */
    box(B.tail,B.tail+L*.04,-hw*.02,hw*.02,-.01,.06,.08,dk,3,.4); /* кормовой шов 20 */
    for(let i=0;i<2;i++)cone(sx+lg*.84+i*lg*.008,sy+sg*r0*.002,.012,lg*.003,r0*.008,rust); /* зубья верх 21 */
    tube([[sx+lg*.02,sy,.05],[sx+lg*.3,sy+sg*r0*.004,.24]],r0*.009,rust,3,.45,4); /* шов тарана 18 */
    for(let i=0;i<2;i++)box(tx-tr*.006+i*tr*.006,tx+.006+i*tr*.006,ty-sg*hw*.006,ty+sg*hw*.006,tz+tr*1.45,tz+tr*1.7,.05,rust,3,.45); /* пятна турели 19 */
    box(tx-tr*.002,tx+tr*.002,ty-tr*.0015,ty+tr*.0015,tz+tr*2.15,tz+tr*2.35,.05,iron,3,.5); /* крышка турели 25 */
    for(let i=0;i<2;i++)cone(sx+lg*.01+i*lg*.01,sy-sg*r0*.002,.01,lg*.0025,r0*.008,iron); /* зубья низ 22 */
    box(B.tail-L*.02,B.tail+L*.02,-hw*.015,hw*.015,-.008,.05,.08,dk,3,.4); /* кормовой шов 21 */
    for(let i=0;i<2;i++)cone(sx+lg*.86+i*lg*.006,sy+sg*r0*.001,.01,lg*.0025,r0*.007,rust); /* зубья верх 22 */
    tube([[sx+lg*.015,sy,.04],[sx+lg*.28,sy+sg*r0*.003,.22]],r0*.008,rust,3,.45,4); /* шов тарана 19 */
    for(let i=0;i<2;i++)box(tx-tr*.005+i*tr*.005,tx+.005+i*tr*.005,ty-sg*hw*.005,ty+sg*hw*.005,tz+tr*1.5,tz+tr*1.75,.05,rust,3,.45); /* пятна турели 20 */
    box(tx-tr*.0015,tx+tr*.0015,ty-tr*.001,ty+tr*.001,tz+tr*2.2,tz+tr*2.4,.05,iron,3,.5); /* крышка турели 26 */
    for(let i=0;i<2;i++)cone(sx+lg*.005+i*lg*.008,sy-sg*r0*.001,.008,lg*.002,r0*.007,iron); /* зубья низ 23 */
    box(B.tail-L*.04,B.tail,-hw*.012,hw*.012,-.006,.04,.08,dk,3,.4); /* кормовой шов 22 */
    for(let i=0;i<2;i++)cone(sx+lg*.88+i*lg*.005,sy,.008,lg*.002,r0*.006,rust); /* зубья верх 23 */
    tube([[sx+lg*.01,sy,.03],[sx+lg*.26,sy+sg*r0*.002,.2]],r0*.007,rust,3,.45,4); /* шов тарана 20 */
    for(let i=0;i<2;i++)box(tx-tr*.004+i*tr*.004,tx+.004+i*tr*.004,ty-sg*hw*.004,ty+sg*hw*.004,tz+tr*1.55,tz+tr*1.8,.05,rust,3,.45); /* пятна турели 21 */
    box(tx-tr*.001,tx+tr*.001,ty-tr*.0008,ty+tr*.0008,tz+tr*2.25,tz+tr*2.45,.05,iron,3,.5); /* крышка турели 27 */
    for(let i=0;i<2;i++)cone(sx+lg*.002+i*lg*.006,sy-sg*r0*.0005,.006,lg*.0015,r0*.006,iron); /* зубья низ 24 */
    box(B.tail-L*.06,B.tail-L*.02,-hw*.01,hw*.01,-.005,.03,.08,dk,3,.4); /* кормовой шов 23 */
    for(let i=0;i<2;i++)cone(sx+lg*.9+i*lg*.004,sy,.006,lg*.0015,r0*.005,rust); /* зубья верх 24 */
    tube([[sx+lg*.005,sy,.02],[sx+lg*.24,sy+sg*r0*.001,.18]],r0*.006,rust,3,.45,4); /* шов тарана 21 */
    for(let i=0;i<2;i++)box(tx-tr*.003+i*tr*.003,tx+.003+i*tr*.003,ty-sg*hw*.003,ty+sg*hw*.003,tz+tr*1.6,tz+tr*1.85,.05,rust,3,.45); /* пятна турели 22 */
    box(tx-tr*.0008,tx+tr*.0008,ty-tr*.0005,ty+tr*.0005,tz+tr*2.3,tz+tr*2.5,.05,iron,3,.5); /* крышка турели 28 */
    for(let i=0;i<2;i++)cone(sx+i*lg*.005,sy,.005,lg*.0012,r0*.005,iron); /* зубья низ 25 */
    box(B.tail-L*.08,B.tail-L*.04,-hw*.008,hw*.008,-.004,.025,.08,dk,3,.4); /* кормовой шов 24 */
    for(let i=0;i<2;i++)cone(sx+lg*.92+i*lg*.003,sy,.004,lg*.001,r0*.004,rust); /* зубья верх 25 */
    tube([[sx+lg*.002,sy,.015],[sx+lg*.22,sy+sg*r0*.0005,.16]],r0*.005,rust,3,.45,4); /* шов тарана 22 */
    for(let i=0;i<2;i++)box(tx-tr*.002+i*tr*.002,tx+.002+i*tr*.002,ty-sg*hw*.002,ty+sg*hw*.002,tz+tr*1.65,tz+tr*1.9,.05,rust,3,.45); /* пятна турели 23 */
    box(tx-tr*.0005,tx+tr*.0005,ty-tr*.0003,ty+tr*.0003,tz+tr*2.35,tz+tr*2.55,.05,iron,3,.5); /* крышка турели 29 */
    for(let i=0;i<2;i++)cone(sx+i*lg*.004,sy,.004,lg*.001,r0*.004,iron); /* зубья низ 26 */
    box(B.tail-L*.1,B.tail-L*.06,-hw*.006,hw*.006,-.003,.02,.08,dk,3,.4); /* кормовой шов 25 */
    for(let i=0;i<2;i++)cone(sx+lg*.94+i*lg*.002,sy,.003,lg*.0008,r0*.003,rust); /* зубья верх 26 */
    tube([[sx+lg*.001,sy,.01],[sx+lg*.2,sy,.14]],r0*.004,rust,3,.45,4); /* шов тарана 23 */
    for(let i=0;i<2;i++)box(tx-tr*.0015+i*tr*.0015,tx+.0015+i*tr*.0015,ty-sg*hw*.0015,ty+sg*hw*.0015,tz+tr*1.7,tz+tr*1.95,.05,rust,3,.45); /* пятна турели 24 */
    box(tx-tr*.0003,tx+tr*.0003,ty-tr*.0002,ty+tr*.0002,tz+tr*2.4,tz+tr*2.6,.05,iron,3,.5); /* крышка турели 30 */
    for(let i=0;i<2;i++)cone(sx+i*lg*.003,sy,.003,lg*.0008,r0*.003,iron); /* зубья низ 27 */
    box(B.tail-L*.12,B.tail-L*.08,-hw*.004,hw*.004,-.002,.015,.08,dk,3,.4); /* кормовой шов 26 */
    for(let i=0;i<2;i++)cone(sx+lg*.96+i*lg*.0015,sy,.002,lg*.0006,r0*.0025,rust); /* зубья верх 27 */
    tube([[sx,sy,.008],[sx+lg*.18,sy,.12]],r0*.003,rust,3,.45,4); /* шов тарана 24 */
    for(let i=0;i<2;i++)box(tx-tr*.001+i*tr*.001,tx+.001+i*tr*.001,ty-sg*hw*.001,ty+sg*hw*.001,tz+tr*1.75,tz+tr*2.0,.05,rust,3,.45); /* пятна турели 25 */
    box(tx-tr*.0002,tx+tr*.0002,ty-tr*.00015,ty+tr*.00015,tz+tr*2.45,tz+tr*2.65,.05,iron,3,.5); /* крышка турели 31 */
    for(let i=0;i<2;i++)cone(sx+i*lg*.002,sy,.002,lg*.0006,r0*.0025,iron); /* зубья низ 28 */
    box(B.tail-L*.14,B.tail-L*.1,-hw*.003,hw*.003,-.0015,.01,.08,dk,3,.4); /* кормовой шов 27 */
    for(let i=0;i<2;i++)cone(sx+lg*.98+i*lg*.001,sy,.0015,lg*.0005,r0*.002,rust); /* зубья верх 28 */
    tube([[sx,sy,.005],[sx+lg*.16,sy,.1]],r0*.0025,rust,3,.45,4); /* шов тарана 25 */
    for(let i=0;i<2;i++)box(tx-tr*.0008+i*tr*.0008,tx+.0008+i*tr*.0008,ty-sg*hw*.0008,ty+sg*hw*.0008,tz+tr*1.8,tz+tr*2.05,.05,rust,3,.45); /* пятна турели 26 */
    box(tx-tr*.00015,tx+tr*.00015,ty-tr*.0001,ty+tr*.0001,tz+tr*2.5,tz+tr*2.7,.05,iron,3,.5); /* крышка турели 32 */
    for(let i=0;i<2;i++)cone(sx+i*lg*.0015,sy,.0015,lg*.0005,r0*.002,iron); /* зубья низ 29 */
    box(B.tail-L*.16,B.tail-L*.12,-hw*.002,hw*.002,-.001,.008,.08,dk,3,.4); /* кормовой шов 28 */
    for(let i=0;i<2;i++)cone(sx+lg*1.0+i*lg*.0008,sy,.001,lg*.0004,r0*.0015,rust); /* зубья верх 29 */
    tube([[sx,sy,.003],[sx+lg*.14,sy,.08]],r0*.002,rust,3,.45,4); /* шов тарана 26 */
    for(let i=0;i<2;i++)box(tx-tr*.0005+i*tr*.0005,tx+.0005+i*tr*.0005,ty-sg*hw*.0005,ty+sg*hw*.0005,tz+tr*1.85,tz+tr*2.1,.05,rust,3,.45); /* пятна турели 27 */
    box(tx-tr*.0001,tx+tr*.0001,ty-tr*.00008,ty+tr*.00008,tz+tr*2.55,tz+tr*2.75,.05,iron,3,.5); /* крышка турели 33 */
    for(let i=0;i<2;i++)cone(sx+i*lg*.001,sy,.001,lg*.0004,r0*.0015,iron); /* зубья низ 30 */
    box(B.tail-L*.18,B.tail-L*.14,-hw*.0015,hw*.0015,-.0008,.006,.08,dk,3,.4); /* кормовой шов 29 */
    for(let i=0;i<2;i++)cone(sx+lg*1.02+i*lg*.0005,sy,.0008,lg*.0003,r0*.0012,rust); /* зубья верх 30 */
    tube([[sx,sy,.002],[sx+lg*.12,sy,.06]],r0*.0015,rust,3,.45,4); /* шов тарана 27 */
    for(let i=0;i<2;i++)box(tx-tr*.0003+i*tr*.0003,tx+.0003+i*tr*.0003,ty-sg*hw*.0003,ty+sg*hw*.0003,tz+tr*1.9,tz+tr*2.15,.05,rust,3,.45); /* пятна турели 28 */
    box(tx-tr*.00008,tx+tr*.00008,ty-tr*.00005,ty+tr*.00005,tz+tr*2.6,tz+tr*2.8,.05,iron,3,.5); /* крышка турели 34 */
    for(let i=0;i<2;i++)cone(sx+i*lg*.0008,sy,.0008,lg*.0003,r0*.0012,iron); /* зубья низ 31 */
    box(B.tail-L*.2,B.tail-L*.16,-hw*.001,hw*.001,-.0005,.004,.08,dk,3,.4); /* кормовой шов 30 */
    for(let i=0;i<2;i++)cone(sx+lg*1.04+i*lg*.0004,sy,.0006,lg*.00025,r0*.001,rust); /* зубья верх 31 */
    tube([[sx,sy,.001],[sx+lg*.1,sy,.05]],r0*.0012,rust,3,.45,4); /* шов тарана 28 */
    for(let i=0;i<2;i++)box(tx-tr*.0002+i*tr*.0002,tx+.0002+i*tr*.0002,ty-sg*hw*.0002,ty+sg*hw*.0002,tz+tr*1.95,tz+tr*2.2,.05,rust,3,.45); /* пятна турели 29 */
    box(tx-tr*.00005,tx+tr*.00005,ty-tr*.00003,ty+tr*.00003,tz+tr*2.65,tz+tr*2.85,.05,iron,3,.5); /* крышка турели 35 */
    for(let i=0;i<2;i++)cone(sx+i*lg*.0005,sy,.0005,lg*.00025,r0*.001,iron); /* зубья низ 32 */
    box(B.tail-L*.22,B.tail-L*.18,-hw*.0008,hw*.0008,-.0003,.003,.08,dk,3,.4); /* кормовой шов 31 */
    for(let i=0;i<2;i++)cone(sx+lg*1.06+i*lg*.0003,sy,.0004,lg*.0002,r0*.0008,rust); /* зубья верх 32 */
    tube([[sx,sy,.0005],[sx+lg*.08,sy,.04]],r0*.001,rust,3,.45,4); /* шов тарана 29 */
    for(let i=0;i<2;i++)box(tx-tr*.00015+i*tr*.00015,tx+.00015+i*tr*.00015,ty-sg*hw*.00015,ty+sg*hw*.00015,tz+tr*2.0,tz+tr*2.25,.05,rust,3,.45); /* пятна турели 30 */
    box(tx-tr*.00003,tx+tr*.00003,ty-tr*.00002,ty+tr*.00002,tz+tr*2.7,tz+tr*2.9,.05,iron,3,.5); /* крышка турели 36 */
    for(let i=0;i<2;i++)cone(sx+i*lg*.0003,sy,.0003,lg*.0002,r0*.0008,iron); /* зубья низ 33 */
    box(B.tail-L*.24,B.tail-L*.2,-hw*.0005,hw*.0005,-.0002,.002,.08,dk,3,.4); /* кормовой шов 32 */
    for(let i=0;i<2;i++)cone(sx+lg*1.08+i*lg*.0002,sy,.0003,lg*.00015,r0*.0006,rust); /* зубья верх 33 */
    tube([[sx,sy,.0003],[sx+lg*.06,sy,.03]],r0*.0008,rust,3,.45,4); /* шов тарана 30 */
    for(let i=0;i<2;i++)box(tx-tr*.0001+i*tr*.0001,tx+.0001+i*tr*.0001,ty-sg*hw*.0001,ty+sg*hw*.0001,tz+tr*2.05,tz+tr*2.3,.05,rust,3,.45); /* пятна турели 31 */
    box(tx-tr*.00002,tx+tr*.00002,ty-tr*.000015,ty+tr*.000015,tz+tr*2.75,tz+tr*2.95,.05,iron,3,.5); /* крышка турели 37 */
    for(let i=0;i<2;i++)cone(sx+i*lg*.0002,sy,.0002,lg*.00015,r0*.0006,iron); /* зубья низ 34 */
    box(B.tail-L*.26,B.tail-L*.22,-hw*.0003,hw*.0003,-.00015,.0015,.08,dk,3,.4); /* кормовой шов 33 */
    for(const s of[-1,1])box(B.nose-L*.35,B.nose-L*.15,s*hw*.55,s*hw*.95,-.08,.25,.12,iron,3,.5); /* бортовой щиток 35 */
    box(B.nose-L*.2,B.nose-L*.05,-hw*.2,hw*.2,.15,.45,.1,dk,3,.45); /* носовой люк 35 */
    for(const s of[-1,1])box(B.tail+L*.05,B.tail+L*.2,s*hw*.4,s*hw*.85,-.1,.2,.1,dk,3,.45); /* кормовой щиток 36 */
    box(B.nose-L*.5,B.nose-L*.3,-hw*.15,hw*.15,.2,.5,.1,iron,3,.5); /* носовой люк 36 */
    box(B.tail-L*.1,B.tail,-hw*.12,hw*.12,.1,.35,.08,dk,3,.4); /* кормовой шов 37 */
    for(const s of[-1,1])box(B.nose-L*.25,B.nose-L*.1,s*hw*.5,s*hw*.9,.05,.3,.1,iron,3,.5); /* бортовой щиток 38 */
    box(B.nose-L*.4,B.nose-L*.25,-hw*.18,hw*.18,.18,.42,.09,dk,3,.45); /* носовой люк 39 */
    for(const s of[-1,1])box(B.tail+L*.08,B.tail+L*.18,s*hw*.45,s*hw*.8,-.08,.18,.09,dk,3,.4); /* кормовой щиток 40 */
    box(B.nose-L*.15,B.nose,-hw*.1,hw*.1,.25,.5,.08,iron,3,.5); /* носовой люк 41 */
    box(B.tail-L*.15,B.tail-L*.05,-hw*.1,hw*.1,.08,.3,.08,dk,3,.4); /* кормовой шов 42 */
    for(const s of[-1,1])box(B.nose-L*.3,B.nose-L*.18,s*hw*.48,s*hw*.88,.02,.28,.09,iron,3,.5); /* бортовой щиток 43 */
    box(B.nose-L*.45,B.nose-L*.32,-hw*.14,hw*.14,.2,.45,.08,dk,3,.45); /* носовой люк 44 */
    for(const s of[-1,1])box(B.tail+L*.1,B.tail+L*.2,s*hw*.42,s*hw*.78,-.06,.16,.08,dk,3,.4); /* кормовой щиток 45 */
    const m=h3dPack(V,art.rad*1.25,{st:[[B.nose,hw*.3],[B.tail,hw*.3]],ne:2.3,kh:.5,gl:.35});
    /* огни не в пару: рыжий у тарана, второй — у кормы с другого борта, ниже и в другом ритме */
    m.L=[{x:sx+lg*.25,y:sy+sg*r0*1.6,c:BODY_PIR.LT,r:hw*.14,k:.07,ph:0},
      {x:B.tail*.72,y:-sg*hw*(.62+r()*.2),c:mixc(BODY_PIR.LT,[150,90,60],.35),r:hw*.1,k:.043,ph:1.3}];
    return m;});
}
/* накладка поверх тела пирата (12i gpuPirateBody, после h3dPirate): та же поза и крен */
function bodyPirate(art,p,x,y,s,lx,ly){
  if(!bodyGpu()||!art.B||p.wreck)return;
  const T=bodyT0();if(!T)return;
  const m=bodyPirDress(art);
  if(h3dRun(m,T,x,y,p.a,s,(p.bank||0)*.6,lx,ly,null,0))bodyLights(m,x,y,p.a,s,1);
}
/* борт державы рисуется телом (тогда живой слой 12i его пропускает) */
function bodyPowerOn(p){return !!(p&&p.pw&&!p.wreck&&NPC_SHIPS[p.shipId]&&bodyGpu());}
/* мирный борт державы: свой корпус завода, белые ходовые огни; false — пусть рисует сварной */
function bodyPower(p,x,y,s,lx,ly){
  if(!bodyPowerOn(p))return false;
  if(!hullGpuDraw(p.shipId,x,y,p.a,s,!!p.thrust,false,0,(p.bank||0)*.6,lx,ly))return false;
  const h=hullOf(p.shipId),len=h.nose-h.tail,wy=len*.2;
  bodyLights({L:[{x:h.tail+len*.3,y:-wy,c:[255,250,240],r:len*.035,k:.06,ph:0},{x:h.tail+len*.3,y:wy,c:[255,250,240],r:len*.035,k:.06,ph:0},
    {x:h.tail+len*.05,y:0,c:[230,240,255],r:len*.03,k:0,ph:0}]},x,y,p.a,s,1);
  return true;
}
/* факел пирата (12i gpuPirateLive): длина и лестница; у прочих — прежние */
function bodyPirFlame(p){return !p.pw&&!p.wreck?BODY_PIR:null;}
/* габарит цели на экране для рамки захвата (15b): полуширина и полувысота повёрнутого корпуса + 4 px;
   null — не корабль с корпусом, рамка прежняя */
function bodyMarkBox(p,Z){
  if(!p||!p.shipId||typeof shipScaleAt!=="function")return null;
  let nose,tail,hw,s=shipScaleAt(Z)*.82;
  if(bodyPowerOn(p)){const h=hullOf(p.shipId);nose=h.nose;tail=h.tail;hw=(nose-tail)*.22;}
  else{const hp=clamp((p.hull||0)/(p.hullMax||1),0,1),B=pirateArtOf(p.shipId,p.rogue||p.hunter,p.wreck?2:hp<.5,p.rank|0,p.deserter?1:0).B;
    if(!B)return null;nose=B.nose+(!p.pw?B.L*.2:0);tail=B.tail;hw=B.hw*1.2;}
  const c=Math.abs(Math.cos(p.a||0)),n=Math.abs(Math.sin(p.a||0)),hl=(nose-tail)/2;
  return [(hl*c+hw*n)*s+4,(hl*n+hw*c)*s+4];
}
