/* ══════════════ дом снаружи на видеокарте (G15) ══════════════
   Всё неподвижное — полка, гараж, тело, крыша, окна, крыльцо, двор, мачта без
   растяжек — печётся раз на свет, ночь и состав дома (тем же drawHomeOut, что
   рисует 2D) и ложится в слой стоящего: падающая тень и свет мира от него, как от
   построек. Пятна теней и лампы выпечка не рисует, а пишет в приёмники (12tb,
   11va): пятна зависят от звезды, а лампы кадр заводит на месте. Живое — дым,
   растяжки и огонь маяка, бельё — каждый кадр фигурами через VSINK (08c). */
const HOME_OBK={key:"",B:null,A:null};
function homeOutGpu(tr,camx,camy,p,bx,sx){
  if(typeof GPU==="undefined"||!GPU.ok||!GPU.on||!GPU.enc||typeof SUN_DIR!=="object")return false;
  if(!GPU.overPass&&!standPass())return false;
  const nite=(typeof surfNight==="function")?surfNight(p):0;
  const plan=homePlan(p),M=HOME_MAN,w=M*plan.w;
  const has=["garage","living","case","dock","shop"].map(k=>homeHas(k)?1:0).join("");
  const beds=(typeof greenAll==="function")?JSON.stringify(greenAll().beds):"";
  const key=[p.seed,bx,DPR,SCK,"d"+dayKq(p),"a"+sunAzQ(p),"n"+Math.round(nite*8),G.home.tier|0,has,beds].join("|");
  if(HOME_OBK.key!==key){
    /* холст с запасом на любой состав: гараж слева, мачта с растяжками справа;
       bakeTrim (21bc) обрежет его по нарисованному */
    const hw=Math.ceil(w*1.9+M*2+40),top=Math.ceil(Math.max(M*(plan.wallH+plan.roofH+1),M*4.8)+40),bot=70;
    const gb=groundAt(tr,bx)+2,big=mkCanvas(hw*2,top+bot),t0=G.t;
    const A={sh:[],lamps:[],smoke:null,dock:null,wash:null};
    HOME_BAKING=A;SD_SHSINK=A.sh;PL_SINK=A.lamps;
    try{withCtx(big,hw*2,top+bot,0,0,()=>{G.t=0;drawHomeOut(tr,bx-hw,gb-top,p);});}
    finally{HOME_BAKING=null;SD_SHSINK=null;PL_SINK=null;G.t=t0;}
    /* приёмники писали в координатах холста: подножие дома там — (hw, top) */
    for(const s of A.sh){s[0]-=hw;s[1]-=top;}
    for(const l of A.lamps){l[0]-=hw;l[1]-=top;}
    HOME_OBK.key=key;HOME_OBK.B=bakeTrim(big,hw,top);HOME_OBK.A=A;
  }
  const B=HOME_OBK.B,A=HOME_OBK.A;if(!B)return false;
  const o=lifeHere(0,0),K=o.s,gy=groundAt(tr,bx)+2-camy;
  /* пятна теней — та же формула, что sdShadow, мягким пятном; в слое их даёт поле */
  const sx0=SUN_DIR.x,low=clamp(1-Math.abs(SUN_DIR.y),0,1),sh=[];
  for(const [x,y,ww,hh] of A.sh)
    sh.push({x:o.x+(sx+x-sx0*ww*(.18+low*.75))*K,y:o.y+(gy+y-1)*K,
      w:2.5*ww*(.62+low*.5)*K,h:3*Math.max(2.5,hh*.09)*K,a:.42*(1-low*.35)});
  const r={x:o.x+(sx+B.cx)*K,y:o.y+(gy+B.cy)*K,w:B.w*K,h:B.h*K};
  standAdd((ps,bl,layer)=>{
    if(!layer&&sh.length)gpuImage(ps,poiShadowTex(),sh);
    gpuImage(ps,B.cn,[r],{blend:bl});
  });
  for(const l of A.lamps)placeLamp(sx+l[0],gy+l[1],l[2],l[3],l[4],l[5]);
  /* живое — фигурами поверх выпечки */
  const S={o,SH:[]},pal=homeOutPal(p);
  VSINK=S;
  try{
    if(A.smoke)homeSmoke(sx+A.smoke[0],gy+A.smoke[1],(typeof WIND==="number")?WIND*2:0);
    if(A.dock)homeDock(sx+A.dock[0],gy+A.dock[1],M,pal);
    if(A.wash)homeWash(sx+A.wash[0],gy+A.wash[1],A.wash[2],A.wash[3],M,pal);
  }finally{VSINK=null;}
  if(S.SH.length)standAdd((ps,bl)=>gpuShapes(ps,S.SH,{blend:bl}));
  return true;
}
