/* ══════════════ облик туманности «смело» (26.09, docs/DESIGN-gpu.md) ══════════════
   Куски шейдеров 16gb, вынесены сюда: 16gb у предела размера. Склеивается раньше 16gb —
   его строки берут эти куски при загрузке. Четыре приёма, одна ручка силы GNB_SS:
   — глубина: тон слоя крутится по кругу (YIQ) через пурпур к сине-фиолетовому, дальний слой
     темнее, ближний теплее; линейная смесь дополнительных тонов дала бы серое;
   — зоны ионизации: ближе к звезде газ и зарево — к лазури, светлее и с меньшим цветом,
     дальше — к оранжево-красному; середина перехода светлее, а не тусклее;
   — объём: газ между точкой и звездой гасит её свет — сторона массы к звезде светлее;
   — пряди: светлые, вдоль изолиний яркости газа (свёртка по линиям тока), направление —
     тензор структуры: на гребнях не скачет, где поток неоднозначен — прядей нет.
   Автор выбрал «смело» (ss 1.6) из трёх сил; мягко .5, средне 1 */
const GNB_SS=1.6,GNB_S=GNB_SS.toFixed(3);
/* поворот тона в YIQ к углу ang на долю k пути; sp=0 — только в плюс (оранжевый→пурпур→синий),
   1 — кратчайший и только для близких тонов (холодный газ к красному через зелень не идёт);
   cs — множитель цвета. Пик канала не растёт: синий той же яркости иначе выбивает белое */
const GNB_HTO=`
fn hto(c:vec3f,ang:f32,k:f32,cs:f32,sp:f32)->vec3f{
  let y=dot(c,vec3f(.299,.587,.114));let i=dot(c,vec3f(.596,-.274,-.322));let q=dot(c,vec3f(.211,-.523,.312));
  var d=ang-atan2(q,i);d=d-6.2832*floor(d/6.2832);d=d-6.2832*step(3.1416,d)*sp;let a=d*k*smoothstep(.0,.04,length(vec2f(i,q)))*mix(1.,smoothstep(2.2,1.,abs(d)),sp);
  let i2=(i*cos(a)-q*sin(a))*cs;let q2=(i*sin(a)+q*cos(a))*cs;
  let r=max(vec3f(y+.956*i2+.621*q2,y-.272*i2-.647*q2,y-1.106*i2+1.703*q2),vec3f(0.));
  return r*min(1.,max(c.r,max(c.g,c.b))*1.08/max(max(r.r,max(r.g,r.b)),1e-4));}`;
/* пересчёт, тон слоя fl (0 — дальний): глубина, затем зоны от звезды (sd — в высотах кадра) */
const GNB_TONE=`
    let fz=(1.-fl*.5)*${GNB_S};
    col=hto(col,2.14,clamp(.75*(1.-fl*.5)*(.6+.4*${GNB_S}),0.,1.),1.,0.)*(1.-.4*fz);
    col=hto(col,.25,clamp(.4*max(fl-1.,0.)*${GNB_S},0.,1.),1.1,1.);
    let iz=clamp(son*(1.-smoothstep(.08,.7*sqrt(${GNB_S}),sd))*.85,0.,1.);
    col=hto(col,3.,iz,(1.-.45*iz)*(1.-.35*4.*iz*(1.-iz)),0.)*(1.+.1*iz+.25*4.*iz*(1.-iz));
    col=hto(col,.25,clamp(son*smoothstep(.35,1.1,sd)*.45*${GNB_S},0.,1.),1.+.15*${GNB_S},1.);`;
/* пересчёт: широкое зарево звезды — той же зоны, у звезды холоднее */
const GNB_WC=`
  let izw=clamp(son*(1.-smoothstep(.08,.7*sqrt(${GNB_S}),sd))*.85,0.,1.);
  let wc=hto(mix(sw,gc*max(sc.r,max(sc.g,sc.b)),.8),3.,izw*.7,1.-.4*izw,0.);`;
/* сведение: пряди. Область шума повёрнута — решётка шума не ложится вдоль потока прямой складкой */
const GNB_FIL=`
fn filE(p:vec2f,uv:vec2f)->f32{
  let H=fu.res.w;let o=4./vec2f(textureDimensions(t0));let lum=vec3f(.3,.5,.2);
  var L:array<f32,9>;for(var j=0;j<9;j++){L[j]=dot(textureSampleLevel(t0,smp,uv+o*vec2f(f32(j%3-1),f32(j/3-1)),0.).rgb,lum);}
  var J=vec3f(0.);for(var j=0;j<4;j++){let a=(j&1)+(j>>1)*3;
    let gg=vec2f(L[a+1]+L[a+4]-L[a]-L[a+3],L[a+3]+L[a+4]-L[a]-L[a+1])*.5;J=J+vec3f(gg.x*gg.x,gg.y*gg.y,gg.x*gg.y);}
  let th=.5*atan2(2.*J.z,J.x-J.y);let tg=vec2f(-sin(th),cos(th));
  let jm=length(vec2f(J.x-J.y,2.*J.z));let s=smoothstep(.00002,.0004,jm)*smoothstep(.4,.9,jm/max(J.x+J.y,1e-9));
  let R=mat2x2f(.82,.57,-.57,.82);
  let q=R*(((p-fu.res.zw*.5)+fu.v[0].xy*.09)/H*88.)+fu.v[0].w+vec2f(17.,3.);
  let dq=R*(tg*7./H*88.);var a=0.;
  for(var k=-7;k<=7;k++){let w=1.-abs(f32(k))/8.;a=a+w*gnt(q+dq*f32(k)+vec2f(gnt(q*.07),gnt(q*.07+4.))*3.);}
  a=a/8.;let v=clamp((a-.5)*2.6+.5,0.,1.);
  return 1.+.45*${GNB_S}*pow(v,3.)*s;}`;
/* сведение: пряди только в ярком газе, не у самой звезды и не у белого */
const GNB_FILC=`
  let bw=smoothstep(.06,.3,l0);if(bw>0.){c=c*mix(1.,filE(p,uv),bw*.9*(1.-smoothstep(.45,.85,max(c.r,max(c.g,c.b))))*smoothstep(.1,.35,length(p-fu.v[1].xy)/H-fu.v[1].z));}`;
/* сведение: объём — отношение плотностей к звезде и здесь, а не разность: одинаково для тусклого
   и яркого газа; подсветка гаснет у звезды и у белого */
const GNB_VOL=`
  {let tz=-dir/fu.res.zw;let lm=vec3f(.3,.5,.2);
   let oc=.45*dot(textureSampleLevel(t0,smp,uv+tz*22.,0.).rgb,lm)+.35*dot(textureSampleLevel(t0,smp,uv+tz*60.,0.).rgb,lm)+.2*dot(textureSampleLevel(t0,smp,uv+tz*130.,0.).rgb,lm);
   let rel=clamp((oc-l0)/(oc+l0+.04),-1.,1.);let vw=fu.v[1].w/(1.+sq(sd/.8));
   let sh=exp(-.5*${GNB_S}*rel);let hb=1.-smoothstep(.45,.85,max(c.r,max(c.g,c.b)));
   c=c*mix(1.,select(sh,1.+(sh-1.)*hb*smoothstep(.1,.35,sd),sh>1.),vw*smoothstep(.02,.12,l0));}`;
