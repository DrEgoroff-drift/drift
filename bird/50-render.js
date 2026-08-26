/* ══════════════ проходы кадра ══════════════
   Порядок: тень → фон → твёрдое → перья → бусины поверх света → свечение →
   экран. Ни один проход не знает, что рисует птицу: он знает про сцену, а
   сцену собирает `drawScene`. Поэтому новая часть тела не трогает кадр.

   Весь свет считается в HDR (rgba16f) и сжимается один раз, в самом конце.
   Иначе бусины хохла и блик на клюве срезаются до тон-компрессии, и светиться
   им уже нечем. */

const R={W:0,H:0,dpr:1,shadowSize:1536,bloomN:5,exposure:0.55};
/* размеры целей приходят из QUAL (60-app): качество решается один раз */

function renderInit(){
  R.pSolid=glProg(VS_BODY,FS_SOLID,"твёрдое");
  R.pDepth=glProg(VS_DEPTH,FS_DEPTH,"глубина");
  R.pFea  =glProg(VS_FEATHER,FS_FEATHER,"перо");
  R.pFeaD =glProg(VS_FEATHER,FS_DEPTH,"перо·глубина");
  R.pBead =glProg(VS_BEAD,FS_BEAD,"бусина");
  R.pBg   =glProg(VS_FLAT,FS_BG,"фон");
  R.pDust =glProg(VS_DUST,FS_DUST,"пыль");
  R.pTone =glProg(VS_FLAT,FS_TONE,"экран");
  R.pBright=glProg(VS_FLAT,FS_BRIGHT,"яркое");
  R.pBlur =glProg(VS_FLAT,FS_BLUR,"размытие");
  R.shadowSize=QUAL.shadow||1536;R.bloomN=QUAL.bloomN||5;
  R.shadow=glTarget(R.shadowSize,R.shadowSize,"depth");
}
function renderSize(w,h){
  if(R.W===w&&R.H===h)return;
  R.W=w;R.H=h;
  const fmt=GLX.float?"rgba16f":"rgba8";
  R.hdr=glTarget(w,h,fmt);
  /* лестница свечения: каждая ступень вдвое меньше предыдущей. Пять ступеней
     дают ореол шириной в треть кадра при цене в один процент */
  R.bloom=[];
  let bw=Math.max(2,w>>1),bh=Math.max(2,h>>1);
  for(let i=0;i<R.bloomN;i++){
    R.bloom.push([glTarget(bw,bh,fmt,gl.LINEAR),glTarget(bw,bh,fmt,gl.LINEAR)]);
    bw=Math.max(2,bw>>1);bh=Math.max(2,bh>>1);
  }
}

/* ── свет сцены ──
   Тёплый ключ сверху-справа-спереди, холодный подбой слева (в игре это свет
   приборов), обвод сзади. Правило то же, что у двумерной птицы. */
const LIGHT={
  key:vNorm([0.55,0.80,0.45]), keyCol:[2.05,1.72,1.30],
  fill:vNorm([-0.85,0.12,-0.25]), fillCol:[0.115,0.235,0.310],
  rim:[0.150,0.360,0.460],
  sky:[0.085,0.115,0.165], gnd:[0.022,0.024,0.032]
};
function lightVP(){
  const c=[0,1.10,0],d=6.0;
  const eye=vAdd(c,vMul(LIGHT.key,d));
  return mMul(mOrtho(-2.0,2.0,-2.0,2.0,1.0,11.0),mLook(eye,c,[0,1,0]));
}
function bindLight(P){
  glSet(P,"uVP",R.VP);
  glSet(P,"uEye",R.eye);
  glSet(P,"uKeyDir",LIGHT.key);glSet(P,"uKeyCol",LIGHT.keyCol);
  glSet(P,"uFillDir",LIGHT.fill);glSet(P,"uFillCol",LIGHT.fillCol);
  glSet(P,"uRimCol",LIGHT.rim);
  glSet(P,"uSkyCol",LIGHT.sky);glSet(P,"uGndCol",LIGHT.gnd);
  glSet(P,"uLightVP",R.lightVP);
  glSet(P,"uShadowTexel",1/R.shadowSize);
  glTex(P,"uShadow",7,R.shadow.tex);
}
/* поза уходит во все программы одинаково: разошлась поза — перья съехали с
   птицы, и это видно сразу */
function bindPose(P){
  glSet(P,"uHeadYaw",POSE.yaw);glSet(P,"uHeadPitch",POSE.pitch);glSet(P,"uHeadRoll",POSE.roll);
  glSet(P,"uBreath",POSE.breath);glSet(P,"uPuff",POSE.puffShow||0);
  glSet(P,"uBlink",POSE.blinkNow||0);glSet(P,"uJaw",POSE.jaw);
  /* суставы: крыло, хвост, хохол, лапа, шаг, подскок, разворот, вис */
  glSet(P,"uFlap",POSE.flap);glSet(P,"uStretch",POSE.stretch);
  glSet(P,"uFan",POSE.fan);glSet(P,"uCrest",POSE.crest);
  glSet(P,"uTuck",POSE.tuck);glSet(P,"uStep",POSE.step);
  glSet(P,"uHop",POSE.hop);glSet(P,"uTurn",POSE.turn);
  glSet(P,"uFootUp",POSE.footUp);glSet(P,"uFootSide",POSE.footSide);
  glSet(P,"uPeck",POSE.peck);glSet(P,"uHang",POSE.hang||0);
  glSet(P,"uLean",POSE.lean);glSet(P,"uBow",POSE.bow);
  glSet(P,"uNeckP",[0,1.46,-0.04]);
  glSet(P,"uTime",POSE.t);
  glSet(P,"uRuffle",POSE.ruffle);
}
function drawSolid(P,VP){
  gl.useProgram(P.p);bindPose(P);
  if(VP)glSet(P,"uVP",VP);else bindLight(P);
  /* стенд: ?nobody=1 убирает кожу и части — видно ровно то, что закрывают
     перья, и ни одной догадки о том, чей это пиксель */
  if(!R.noBody){glDraw(MESH.body,0);glDraw(MESH.parts,0);}
}
function drawFeathers(P,VP){
  gl.useProgram(P.p);bindPose(P);
  if(VP)glSet(P,"uVP",VP);else bindLight(P);
  gl.disable(gl.CULL_FACE);          /* перо видно с обеих сторон */
  glDraw(MESH.coat);
  glDraw(MESH.plumes);
  gl.enable(gl.CULL_FACE);
}
function renderFrame(){
  R.lightVP=lightVP();
  /* ── тень ── */
  glUse(R.shadow);
  gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.CULL_FACE);gl.cullFace(gl.FRONT);
  drawSolid(R.pDepth,R.lightVP);
  drawFeathers(R.pFeaD,R.lightVP);
  gl.cullFace(gl.BACK);
  /* ── сцена ── */
  glUse(R.hdr);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.disable(gl.DEPTH_TEST);
  gl.useProgram(R.pBg.p);
  glSet(R.pBg,"uRes",[R.W,R.H]);glSet(R.pBg,"uTime",POSE.t);
  glSet(R.pBg,"uSkyCol",LIGHT.fillCol);glSet(R.pBg,"uKeyCol",LIGHT.keyCol);
  glDraw(glQuad(),0);
  gl.enable(gl.DEPTH_TEST);
  drawSolid(R.pSolid,null);
  drawFeathers(R.pFea,null);
  /* пыль и бусины: после всего света и аддитивно */
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.depthMask(false);
  if(MESH.dust){
    gl.useProgram(R.pDust.p);
    glSet(R.pDust,"uVP",R.VP);glSet(R.pDust,"uEye",R.eye);glSet(R.pDust,"uTime",POSE.t);
    glSet(R.pDust,"uCol",[0.42,0.52,0.62]);
    glDraw(MESH.dust);
  }
  gl.useProgram(R.pBead.p);bindPose(R.pBead);
  glSet(R.pBead,"uVP",R.VP);glSet(R.pBead,"uEye",R.eye);
  glSet(R.pBead,"uGlow",0.62+Math.sin(POSE.t*1.7)*0.09);
  glDraw(MESH.beads,0);
  gl.disable(gl.BLEND);gl.depthMask(true);
  /* ── свечение ── */
  gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);
  bloomPass();
  /* ── экран ── */
  glUse(null);
  gl.useProgram(R.pTone.p);
  glTex(R.pTone,"uSrc",0,R.hdr.tex);
  glTex(R.pTone,"uBloom",1,R.bloom[0][0].tex);
  glSet(R.pTone,"uExposure",R.exposure);
  glSet(R.pTone,"uBloomK",0.55);
  glSet(R.pTone,"uTime",POSE.t);
  glDraw(glQuad(),0);
}
/* ── свечение ──
   Порог → лестница вниз → сложение вверх. Ореол собирается из ступеней, а не
   одним большим размытием: широкий свет стоит копейки, если он низкого
   разрешения. */
function bloomPass(){
  glUse(R.bloom[0][0]);
  gl.useProgram(R.pBright.p);
  glTex(R.pBright,"uSrc",0,R.hdr.tex);
  glSet(R.pBright,"uTexel",[1/R.W,1/R.H]);
  glSet(R.pBright,"uThresh",1.55);
  glDraw(glQuad(),0);
  for(let i=1;i<R.bloomN;i++)blit(R.bloom[i-1][0],R.bloom[i][0],0.0);
  for(let i=R.bloomN-1;i>0;i--)blit(R.bloom[i][0],R.bloom[i-1][0],1.0);
}
function blit(src,dst,add){
  glUse(dst);
  if(add){gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);}
  gl.useProgram(R.pBlur.p);
  glTex(R.pBlur,"uSrc",0,src.tex);
  glSet(R.pBlur,"uTexel",[1/src.w,1/src.h]);
  glSet(R.pBlur,"uK",add?1.0:1.0);
  glDraw(glQuad(),0);
  if(add)gl.disable(gl.BLEND);
}
