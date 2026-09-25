/* ══════════════ база на видеокарте (G11) ══════════════
   Разрез базы был самой тяжёлой сценой игры: гора, порода, выработка, стены,
   мебель и свет — всё кистями 2D, шестьдесят раз в секунду, и потом ещё
   загрузка всего холста в видеокарту. Здесь кадр собран иначе:

   ВЫПЕЧКИ в мировых координатах, по одной на слой, печёт видеохолст (08ca)
   один раз и заново — только когда база изменилась (ключ: отсеки, их целость,
   ступень света):
     небо + дальняя гряда   — полоса с параллаксом .3
     ближняя гряда          — полоса с параллаксом .6
     задник                 — гора, порода, наземное, выработка, стволы
     отсеки                 — плиты перекрытий и оболочки комнат
     передний план          — настилы, переборки, кабель-каналы
     маска                  — порода и выработка, в полразмера, для поля света
   Кадром: клети и огни — фигуры (`gpuShapes`), станки и люди — кисти 2D,
   свет и воздух — два поля.

   СВЕТ — не наклейка. Раньше у каждой лампы была трапеция «lighter», у каждого
   отсека — круглый ореол в породу: свет лежал ПОВЕРХ картинки ровной плёнкой и
   ничего не освещал. Теперь поле УМНОЖАЕТ кадр: под лампой пятно на полу, к
   углам комнаты свет гаснет, стена у потолка светлее у самой лампы. Порода
   вокруг — холодная и в зерне материала планеты, а у кромки выработки в неё
   сочится тёплый свет жилых отсеков: тепло против холода, как на образце.
   Второе поле ПРИБАВЛЯЕТ воздух: пыль в конусах ламп, медленно всплывающая и
   гаснущая без мигания, едва видимый столб света, синь мороза и марево жары. */
const BASE_BK=new Map();   /* имя слоя → {key,B,R,k,w,h} */
/* выпечка слоя: R — мировой прямоугольник, k — пикселей выпечки на пиксель CSS */
function baseBake(name,key,R,k,paint){
  let E=BASE_BK.get(name);
  if(E&&E.key===key&&E.B&&E.B.tex&&E.B.dev===GPU.dev)return E;
  if(E&&E.B)gpuBakeDrop(E.B);
  const tw=Math.max(1,Math.ceil((R.x1-R.x0)*k)),th=Math.max(1,Math.ceil((R.y1-R.y0)*k));
  const B=gpuBake(tw,th,g=>{g.setTransform(k,0,0,k,-R.x0*k,-R.y0*k);paint(g);},{ss:1,mips:false});
  E={key,B,R,k,w:tw/k,h:th/k};BASE_BK.set(name,E);
  return E;
}
/* вышли из базы — отдаём видеопамять: на двойной плотности это десятки мегабайт */
function baseBakeFree(){for(const E of BASE_BK.values())if(E.B)gpuBakeDrop(E.B);BASE_BK.clear();}
function baseBakeShow(pass,E,dx,dy,cubic){
  if(!E||!E.B)return;
  gpuImage(pass,E.B,[{x:E.R.x0-dx+E.w/2,y:E.R.y0-dy+E.h/2,w:E.w,h:E.h,cubic}]);
}
/* всё, что камера базы вообще может показать (baseCam), с запасом */
function baseWorldRect(B){
  const cx0=BASE_OX-BCELL_W-60, cx1=BASE_OX+BASE_COLS*BCELL_W+90-W;
  const cy0=-120, cy1=baseRows(B)*BCELL_H+260-H;
  return {x0:Math.floor(Math.min(cx0,cx1))-4, y0:Math.floor(Math.min(cy0,cy1))-4,
          x1:Math.ceil(Math.max(cx0,cx1)+W)+4, y1:Math.ceil(Math.max(cy0,cy1)+H)+4};
}
/* полоса гряды в координатах параллакса: u = экран + камера × par */
function baseParRect(R,par){
  return {x0:Math.floor((R.x0+4)*par)-4, x1:Math.ceil((R.x1-4-W)*par+W)+4,
          y0:R.y0, y1:Math.min(R.y1,BASE_GY+26)};
}
/* подпись базы для ключа выпечек: что построено, что цело, сколько ярусов */
function baseSig(B){
  let s=(B.idx|0)+"|"+baseRows(B)+"|";
  for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
    const x=baseCell(B,c,r);s+=x?(x.k+(x.hp>0?"":"!"))+",":".,";
  }
  return s;
}
function baseBakeK(){return Math.min(2,DPR||1);}
/* что ещё читают тела станков, кроме отсеков и света: полки склада по запасу,
   жар бани в банный вечер, зверь фермы, машина базы. Сменилось — перепекаем */
function baseRoomsKey(B){
  const P=basePower(B),fill=clamp(P.store?basePoolHeld(B)/P.store:0,0,1);
  const n=(typeof baseShift==="function")?baseShift():0;
  const F=(typeof farmOf==="function")?farmOf(B):null, v=(typeof vanOf==="function")?vanOf(B):null;
  return [Math.floor((fill+.15)*4),(typeof banyaWarm==="function"&&banyaWarm(B,n))?1:0,
    F?F.name+"#"+F.no:"",v?v.n+"."+v.q:"",Math.round(P.eff*20)].join("|");
}
/* ── под 2D: небо, гряды, задник, живое железо, отсеки ── */
function baseGpuUnder(S,B,pl,lit,camx,camy){
  const pass=gpuScene();if(!pass)return;
  const k=baseBakeK(),lq=Math.round(lit*40)/40,R=baseWorldRect(B),sig=baseSig(B);
  const sk=(pl?pl.seed|0:0)+"|"+W+"x"+H+"|"+k;
  const up=k<(DPR||1);   /* выпечка реже экрана (телефон 2.6): бикубика вместо мыла */
  const Rs=baseParRect(R,.3),Rn=baseParRect(R,.6);
  baseBakeShow(pass,baseBake("sky",sk+"|"+B.idx,Rs,k,()=>baseSkyPaint(B,pl,Rs)),camx*.3,camy,up);
  baseBakeShow(pass,baseBake("near",sk+"|"+B.idx,Rn,k,()=>baseRidgePaint(B,pl,Rn,1)),camx*.6,camy,up);
  const vk=(typeof vanOf==="function"&&vanOf(B))?"v":"";
  baseBakeShow(pass,baseBake("back",sk+"|"+sig+"|"+lq+vk,R,k,()=>{baseGroundPaint(B,pl,R);baseBackPaint(B,lq);}),camx,camy,up);
  const SH=[];
  baseGroundLive(SH,B,camx,camy);
  baseLiveShapes(SH,S,B,lit,camx,camy);
  gpuShapes(pass,SH);
  const Rr={x0:BASE_OX-10,y0:BASE_OY-4,x1:BASE_OX+BASE_COLS*BCELL_W+10,y1:BASE_OY+baseRows(B)*BCELL_H+6};
  baseBakeShow(pass,baseBake("rooms",sig+"|"+lq+"|"+k+"|"+baseRoomsKey(B),Rr,k,()=>baseRoomsPaint(B,lq)),camx,camy,up);
}
/* ── над 2D: передний план, иней, свет, воздух ── */
const BASE_FU=new Float32Array(60);
function baseGpuOver(S,B,pl,lit,camx,camy){
  const pass=gpuOver();if(!pass)return;
  const k=baseBakeK(),lq=Math.round(lit*40)/40,R=baseWorldRect(B),sig=baseSig(B);
  const up=k<(DPR||1);
  const Rf={x0:BASE_GATE_X+60,y0:BASE_OY-4,x1:BASE_OX+BASE_COLS*BCELL_W+10,y1:BASE_OY+baseRows(B)*BCELL_H+8};
  baseBakeShow(pass,baseBake("front",sig+"|"+lq+"|"+k,Rf,k,()=>baseFrontPaint(B,lq)),camx,camy,up);
  const bnd=(typeof baseHeatBand==="function")?baseHeatBand(B):0;
  const a2=bnd?Math.min(.3,Math.abs(bnd)*.09):0;
  /* иней по верхним кромкам отсеков — мороз виден не только цветом */
  if(bnd<0){
    const SH=[];
    for(let r=0;r<baseRows(B);r++)for(let c=0;c<BASE_COLS;c++){
      const cell=baseCell(B,c,r);if(!cell||cell.hp<=0)continue;
      const x=BASE_OX+c*BCELL_W+6-camx,y=BASE_OY+r*BCELL_H+6-camy;
      SH.push([0,x,y,x+BCELL_W-12,y+2,0,0,220,240,255,Math.min(1,a2*1.6)]);
    }
    gpuShapes(pass,SH);
  }
  /* поле: маска слоёв и материал планеты */
  const M=baseBake("mask",sig+"|"+R.x0+","+R.y0+","+R.x1+","+R.y1+"|"+lq+"|"+baseRoomsKey(B),R,.5,()=>baseMaskPaint(B,R));
  if(!M||!M.B)return;
  if(pl&&!pl.matCn&&typeof planetMat==="function"){planetMat(pl);if(typeof matTick==="function")matTick();}
  const U=BASE_FU;U.fill(0);
  const P=basePower(B);
  U[0]=camx;U[1]=camy;U[2]=lit;U[3]=G.t/60;
  U[4]=M.R.x0;U[5]=M.R.y0;U[6]=M.w;U[7]=M.h;
  U[8]=clamp((camy+H*.5)/2000,0,.42);U[9]=bnd<0?-a2:a2;U[10]=pl&&pl.matCn?1:0;U[11]=baseRows(B);
  const sh=baseShaftBox(B),cy=BASE_OY+(S.row|0)*BCELL_H+8;
  U[12]=sh.sx0+sh.sw/2;U[13]=cy+4;U[14]=cellX(Math.floor(BASE_COLS/2));U[15]=cy+BCELL_H-23;
  U[16]=BASE_GATE_X+34;U[17]=BASE_GY+4-40-11;U[18]=P.eff;U[19]=baseDeep(B);
  const TL=baseTunnelLamps();U[20]=TL[0];U[21]=TL[1];U[22]=TL[2];U[23]=BASE_GY-31;
  for(let r=0;r<Math.min(5,baseRows(B));r++)for(let c=0;c<BASE_COLS;c++){
    const cell=baseCell(B,c,r);
    U[24+r*BASE_COLS+c]=cell?(baseLampKind(cell.k)+1+(cell.hp>0?16:0)):0;
  }
  const tx=[M.B,pl&&pl.matCn?pl.matCn:null];
  gpuField(pass,"baselight",baseLightWgsl(),U,tx,{blend:"mul"});
  gpuField(pass,"baseair",baseAirWgsl(),U,tx,{blend:"add"});
}
/* вид отсека → строка таблицы ламп поля (порядок ROOM_FIN, последний — отделка по умолчанию) */
const BASE_LAMP_KEYS=Object.keys(ROOM_FIN);
function baseLampKind(k){const i=BASE_LAMP_KEYS.indexOf(k);return i<0?BASE_LAMP_KEYS.length:i;}
/* ── общая часть двух полей ──
   Числа сетки вписаны в текст: они постоянны, а в равномерном буфере и так
   тесно (ячейки базы занимают 25 из 60). Таблица ламп — из ROOM_FIN, та же,
   по которой оболочка рисует корпуса (baseLamps), так что свет падает из той
   лампы, что видна */
let BASE_WGSL_HEAD=null;
function baseWgslHead(){
  if(BASE_WGSL_HEAD)return BASE_WGSL_HEAD;
  const f=v=>(+v).toFixed(4);
  const rows=BASE_LAMP_KEYS.map(k=>ROOM_FIN[k]).concat([FIN_DEF]).map(F=>{
    /* тон лампы отсека сохраняется, но сам свет теплее: холодное — снаружи */
    const c=F.lamp.split(",").map(Number).map((v,i)=>v*.5+[255,210,150][i]*.5),d=F.dim||1;
    return "vec4f("+f(c[0]/255*d)+","+f(c[1]/255*d)+","+f(c[2]/255*d)+","+f(Math.min(F.ln,3))+")";});
  BASE_WGSL_HEAD=`
const OX=${f(BASE_OX)};const OY=${f(BASE_OY)};const CW=${f(BCELL_W)};const CH=${f(BCELL_H)};
const COLS=${BASE_COLS};const GY=${f(BASE_GY)};const GATEX=${f(BASE_GATE_X)};
var<private> LC:array<vec4f,${rows.length}>=array<vec4f,${rows.length}>(${rows.join(",")});
fn hu(p:vec2i,s:u32)->u32{var h=(bitcast<u32>(p.x)*0x8da6b343u)^(bitcast<u32>(p.y)*0xd8163841u)^(s*0xcb1ab31fu);
  h=(h^(h>>13u))*0x5bd1e995u;return h^(h>>15u);}
fn h01(p:vec2i,s:u32)->f32{return f32(hu(p,s)&0xffffu)/65535.;}
fn cellCode(c:i32,r:i32)->f32{
  if(c<0||c>=COLS||r<0||f32(r)>=min(fu.v[2].w,5.)){return 0.;}
  let i=r*COLS+c;return fu.v[6+i/4][i%4];}
/* лампа под потолком: x — освещённость поверхностей, y — свет в воздухе конуса */
fn lampI(w:vec2f,lp:vec2f,fy:f32,spread:f32)->vec2f{
  let d=w-lp;let depth=clamp(d.y/max(fy-lp.y,1.),0.,1.);
  let hw=6.+spread*depth;
  let cone=smoothstep(-3.,4.,d.y)*(1.-smoothstep(hw-3.,hw+14.,abs(d.x)));
  let r2=dot(d,d);let fall=1./(1.+r2/4200.);
  let pool=exp(-d.x*d.x/(spread*spread*1.4))*exp(-(w.y-fy)*(w.y-fy)/36.);
  let halo=exp(-sqrt(r2)/9.);
  return vec2f(cone*fall*1.05+pool*.7+halo*.5+fall*.18,cone*fall);}
/* свет отсека в точке: x — множитель, w — воздух (для пыли) */
fn roomLight(w:vec2f,c:i32,r:i32,code:f32,lit:f32,ex:f32)->vec4f{
  if(code<16.){return vec4f(.50,.50,.56,0.);}            /* разбитый: ламп нет */
  let L=LC[u32(code)%16u-1u];let ln=i32(L.w);
  let x0=OX+f32(c)*CW+6.;let y0=OY+f32(r)*CH+6.;let ww=CW-12.;let fy=y0+CH-18.;
  var il=0.;var air=0.;
  for(var i=0;i<ln;i++){let lx=x0+ww*(f32(i)+.5)/f32(ln);let q=lampI(w,vec2f(lx,y0+6.),fy,18.);il+=q.x;air+=q.y;}
  /* свои лампы станка — из карты света (синий канал маски): тот же свет */
  il+=ex*1.5;air+=ex*.35;
  let g=.55+.6*lit;
  return vec4f(vec3f(.40,.40,.43)+L.rgb*min(il,3.)*g,air*g);}
/* тёплый свет, что сочится из выработки в породу: от кромки ближних отсеков */
fn spill(w:vec2f,lit:f32)->vec3f{
  let ci=i32(floor((w.x-OX)/CW));let ri=i32(floor((w.y-OY)/CH));var s=vec3f(0.);
  for(var dr=-1;dr<=1;dr++){for(var dc=-1;dc<=1;dc++){
    let c=ci+dc;let r=ri+dr;let code=cellCode(c,r);if(code<16.){continue;}
    let ctr=vec2f(OX+(f32(c)+.5)*CW,OY+(f32(r)+.5)*CH);let q=abs(w-ctr)-vec2f(CW*.5-4.,CH*.5-4.);
    let sd=length(max(q,vec2f(0.)))+min(max(q.x,q.y),0.);
    let col=mix(LC[u32(code)%16u-1u].rgb,vec3f(1.,.70,.40),.55);
    s+=col*exp(-max(sd,0.)/26.)*.55;}}
  return s*lit;}
/* материал планеты: плитка 256 по кругу, выборка руками (у общего сэмплера края — край) */
fn matL(q:vec2f)->f32{
  let n=vec2i(textureDimensions(t1));let p=q-.5;let i=vec2i(floor(p));let f=p-floor(p);
  let a=textureLoad(t1,((i%n)+n)%n,0).rgb;let b=textureLoad(t1,(((i+vec2i(1,0))%n)+n)%n,0).rgb;
  let c=textureLoad(t1,(((i+vec2i(0,1))%n)+n)%n,0).rgb;let d=textureLoad(t1,(((i+vec2i(1,1))%n)+n)%n,0).rgb;
  return dot(mix(mix(a,b,f.x),mix(c,d,f.x),f.y),vec3f(.3,.59,.11));}
/* зерно без материала (он ещё печётся): шум значений в два масштаба */
fn vn(q:vec2f,s:u32)->f32{let i=vec2i(floor(q));let f=q-floor(q);let u=f*f*(3.-2.*f);
  return mix(mix(h01(i,s),h01(i+vec2i(1,0),s),u.x),mix(h01(i+vec2i(0,1),s),h01(i+vec2i(1,1),s),u.x),u.y);}
/* порода: цвет камня (материал планеты, уведённый в бурое, как было у 2D) и зерно */
fn rockAlb(w:vec2f)->vec3f{
  let grit=.78+.44*vn(w/2.2,5u);let pch=.75+.5*vn(w/46.,9u);
  var a=vec3f(.55)*grit*pch;
  if(fu.v[2].z>.5){
    let n=vec2i(textureDimensions(t1));let q=vec2i(floor(w))%n;
    let m=textureLoad(t1,(q+n)%n,0).rgb;
    a=m*(.55+.9*matL((w+91.)/3.7))*grit;}
  return a*vec3f(.49,.37,.25);}
/* свет на породе: холодный воздух глубины и тепло из выработки */
fn rockLight(w:vec2f,lit:f32)->vec3f{
  var l=vec3f(.80,.88,1.02)+spill(w,lit)*1.4;
  if(w.y>GY){l*=(.66-fu.v[2].x)/.66;}
  return l;}
fn maskAt(w:vec2f)->vec4f{return textureSampleLevel(t0,smp,(w-fu.v[1].xy)/fu.v[1].zw,0.);}
/* фонарь над воротами: конус на порог */
fn gateI(w:vec2f)->vec2f{
  let e=fu.v[4].z;let q=lampI(w,fu.v[4].xy,GY+8.,40.);return q*(.35+e*.5)*vec2f(.55,1.);}
/* полость вне отсеков: тоннель, колонна лифта, ствол M396 */
fn shaftLight(w:vec2f,lit:f32)->vec4f{
  var il=0.;var air=0.;
  for(var i=0;i<3;i++){let q=lampI(w,vec2f(fu.v[5][i],fu.v[5].w),GY-2.,16.);il+=q.x*.9;air+=q.y;}
  let cg=lampI(w,fu.v[3].xy,fu.v[3].w,26.);il+=cg.x;air+=cg.y;
  let dx=abs(w.x-fu.v[3].z);
  if(w.y>OY&&w.y<OY+fu.v[4].w*CH){il+=exp(-dx/9.)*.55;}
  let g=.55+.6*lit;
  return vec4f(vec3f(.52,.53,.58)+vec3f(1.,.80,.56)*il*g,air*g);}
`;
  return BASE_WGSL_HEAD;
}
/* ── поле света: множитель кадра (смешение mul, сцена в плавающей точке — выше единицы можно) ── */
function baseLightWgsl(){
  return baseWgslHead()+`
fn field(p:vec2f,uv:vec2f)->vec4f{
  let w=p+fu.v[0].xy;let lit=fu.v[0].z;
  let m=maskAt(w);let rock=m.r;let cav=m.g;
  var f=vec3f(1.);
  if(rock>.004||cav>.004){
    /* порода: холодная, в зерне материала, тёплая у выработки */
    let fr=rockLight(w,lit)*(.9+.2*vn(w/2.2,5u));
    /* выработка: отсек под лампами или тоннель и стволы */
    let ci=i32(floor((w.x-OX)/CW));let ri=i32(floor((w.y-OY)/CH));
    let code=cellCode(ci,ri);
    var fc:vec3f;
    if(code>0.){fc=roomLight(w,ci,ri,code,lit,m.b).rgb;}else{fc=shaftLight(w,lit).rgb;}
    f=mix(mix(vec3f(1.),fr,rock),fc,cav);
  }
  f+=vec3f(1.,.84,.59)*gateI(w).x;
  /* мороз — синь по всему кадру, жара — без множителя (её марево в воздухе) */
  let hb=fu.v[2].y;if(hb<0.){f*=mix(vec3f(1.),vec3f(.84,.93,1.12),-hb*1.6);}
  return vec4f(f,1.);}`;
}
/* ── поле воздуха: пыль в свете ламп, столб света, мороз и марево (смешение add) ── */
function baseAirWgsl(){
  return baseWgslHead()+`
fn mote(w:vec2f,t:f32)->f32{
  let q=w+vec2f(sin(t*.13)*6.,-t*3.2);let id=floor(q/7.);let ii=vec2i(id);
  let h=h01(ii,3u);if(h>.30){return 0.;}
  let h2=h01(ii,11u);let h3=h01(ii,23u);
  let c=id*7.+vec2f(1.6+h2*3.8,1.6+h3*3.8)+vec2f(sin(t*.6+h*40.),cos(t*.45+h2*30.))*1.1;
  let tw=.5+.5*sin(t*.7+h3*6.283);
  return smoothstep(1.35,.25,length(q-c))*tw*tw;}
fn field(p:vec2f,uv:vec2f)->vec4f{
  let w=p+fu.v[0].xy;let lit=fu.v[0].z;let t=fu.v[0].w;
  let m=maskAt(w);var o=vec3f(0.);
  /* камень: материал под своим светом кладётся поверх нарисованных пластов и
     зерна — прежний материал шёл плёнкой ровного тона, этот видит свет */
  let rk=m.r*(1.-m.g);
  if(rk>.004){
    o+=rk*rockAlb(w)*rockLight(w,lit)*.42;
    /* тёплый воздух у выработки: свет, рассеянный в пыли у кромки, — то, что у
       2D было ореолом «lighter», только он гаснет с расстоянием от стены */
    o+=rk*spill(w,lit)*spill(w,lit)*.10;}
  if(m.g>.02){
    let ci=i32(floor((w.x-OX)/CW));let ri=i32(floor((w.y-OY)/CH));
    let code=cellCode(ci,ri);
    var air=0.;var col=vec3f(1.,.84,.6);
    if(code>=16.){air=roomLight(w,ci,ri,code,lit,m.b).w;col=LC[u32(code)%16u-1u].rgb;}
    else if(code<=0.){air=shaftLight(w,lit).w;}
    o+=col*air*m.g*(.075+.6*mote(w,t));
  }
  let gi=gateI(w).y;o+=vec3f(1.,.84,.59)*gi*(.03+.35*mote(w+37.,t));
  let hb=fu.v[2].y;
  if(hb<0.){o+=vec3f(.59,.80,1.)*(-hb)*.45;}
  else if(hb>0.){let top=OY;let bot=OY+fu.v[2].w*CH;
    o+=vec3f(1.,.59,.35)*hb*.9*clamp((w.y-top)/(bot-top),0.,1.)*(.8+.2*sin(w.x*.02+t*.4+w.y*.013));}
  return vec4f(o,0.);}`;
}
