/* ══════════════ проходы кадра ══════════════
   Порядок: тень → фон → птица в HDR → яркая часть → размытие → экран.
   Ни один проход не знает про птицу: они знают про сцену, а сцену собирает
   `sceneDraw` — так добавление части (клюв, перья, лапы) не трогает кадр. */

const R={W:0,H:0,dpr:1,shadowSize:1536};

function renderInit(){
  R.pBody =glProg(VS_BODY,FS_BODY,"тело");
  R.pDepth=glProg(VS_DEPTH,FS_DEPTH,"глубина");
  R.pBg   =glProg(VS_FLAT,FS_BG,"фон");
  R.pTone =glProg(VS_FLAT,FS_TONE,"экран");
  R.shadow=glTarget(R.shadowSize,R.shadowSize,"depth");
  R.black =gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,R.black);
  gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA8,1,1);
  gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
}
function renderSize(w,h){
  if(R.W===w&&R.H===h)return;
  R.W=w;R.H=h;
  /* HDR-цель: свет считается за пределами единицы, иначе бусины хохла и блик
     на клюве срезаются ещё до тон-компрессии и светиться им нечем */
  R.hdr=glTarget(w,h,GLX.float?"rgba16f":"rgba8");
}

/* ── свет сцены ──
   Тёплый ключ сверху-справа-спереди, холодный подбой слева (в игре это
   приборы), обвод сзади. Числа — те же по смыслу, что в двумерной птице. */
const LIGHT={
  key:vNorm([0.55,0.86,0.42]), keyCol:[3.10,2.62,1.98],
  fill:vNorm([-0.80,0.16,-0.30]), fillCol:[0.16,0.36,0.44],
  rim:[0.10,0.30,0.36],
  sky:[0.055,0.085,0.130], gnd:[0.014,0.016,0.022]
};
function lightVP(){
  const c=[0,1.15,0],d=6.0;
  const eye=vAdd(c,vMul(LIGHT.key,d));
  return mMul(mOrtho(-1.9,1.9,-1.9,1.9,1.0,11.0),mLook(eye,c,[0,1,0]));
}
function bindLight(P,VP,eye){
  glSet(P,"uVP",VP);
  glSet(P,"uEye",eye);
  glSet(P,"uKeyDir",LIGHT.key);glSet(P,"uKeyCol",LIGHT.keyCol);
  glSet(P,"uFillDir",LIGHT.fill);glSet(P,"uFillCol",LIGHT.fillCol);
  glSet(P,"uRimCol",LIGHT.rim);
  glSet(P,"uSkyCol",LIGHT.sky);glSet(P,"uGndCol",LIGHT.gnd);
  glSet(P,"uLightVP",R.lightVP);
  glSet(P,"uShadowTexel",1/R.shadowSize);
  glTex(P,"uShadow",7,R.shadow.tex);
}
/* поза передаётся всем программам одинаково: расхождение позы между телом и
   перьями — это перья, съехавшие с птицы */
function bindPose(P){
  glSet(P,"uHeadYaw",POSE.yaw);glSet(P,"uHeadPitch",POSE.pitch);glSet(P,"uHeadRoll",POSE.roll);
  glSet(P,"uBreath",POSE.breath);glSet(P,"uPuff",POSE.puff);
  glSet(P,"uLean",POSE.lean);glSet(P,"uBow",POSE.bow);
  glSet(P,"uNeckP",[0,1.46,-0.04]);
  glSet(P,"uTime",POSE.t);
}
function drawScene(depthOnly){
  if(depthOnly){
    gl.useProgram(R.pDepth.p);bindPose(R.pDepth);
    glSet(R.pDepth,"uVP",R.lightVP);
    glDraw(MESH.body,0);
  }else{
    gl.useProgram(R.pBody.p);bindPose(R.pBody);bindLight(R.pBody,R.VP,R.eye);
    glDraw(MESH.body,0);
  }
}
function renderFrame(){
  R.lightVP=lightVP();
  /* тень */
  glUse(R.shadow);
  gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.CULL_FACE);gl.cullFace(gl.FRONT);
  drawScene(true);
  gl.cullFace(gl.BACK);
  /* сцена */
  glUse(R.hdr);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.disable(gl.DEPTH_TEST);
  gl.useProgram(R.pBg.p);
  glSet(R.pBg,"uRes",[R.W,R.H]);glSet(R.pBg,"uTime",POSE.t);
  glSet(R.pBg,"uSkyCol",LIGHT.fillCol);glSet(R.pBg,"uKeyCol",LIGHT.keyCol);
  glDraw(glQuad(),0);
  gl.enable(gl.DEPTH_TEST);
  drawScene(false);
  /* экран */
  glUse(null);
  gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);
  gl.useProgram(R.pTone.p);
  glTex(R.pTone,"uSrc",0,R.hdr.tex);
  glTex(R.pTone,"uBloom",1,R.bloomTex||R.black);
  glSet(R.pTone,"uExposure",1.0);
  glSet(R.pTone,"uBloomK",R.bloomTex?1.0:0.0);
  glSet(R.pTone,"uTime",POSE.t);
  glDraw(glQuad(),0);
}
