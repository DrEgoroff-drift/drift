/* ══════════════ облик туманности «смело» (26.09, docs/DESIGN-gpu.md) ══════════════
   Куски шейдеров 16gb, вынесены сюда: 16gb у предела размера. Склеивается раньше 16gb —
   его строки берут эти куски при загрузке. Четыре приёма, одна ручка силы GNB_SS:
   — глубина: дальний слой темнее и крутится к тону СВОЕЙ тени (палитра c), ближний — теплее;
     общей сирени нет. Поворот по кругу YIQ — линейная смесь дополнительных тонов дала бы серое;
   — зоны ионизации: у звезды газ и зарево — к холодному тону своей палитры, светлее,
     дальше — к тёплому своему; середина перехода светлее, а не тусклее;
   — доля у звезды (её автор выбрал в круге 2): у тёплых систем газ смешивается к лавандовой тени (lav);
     слабее у FILL и у палитр со своей бирюзой — иначе сиренью залито всё поле;
   — любой поворот — коротким путём, не дальше 45° и только к близкому тону; холодный газ к тёплому
     не крутится
     (круг 2 гнал лёд через зелень и красил синюю долю дыры в бурое);
   — объём: газ между точкой и звездой гасит её свет — сторона массы к звезде светлее;
   — пряди: светлые, вдоль изолиний яркости газа (свёртка по линиям тока), направление —
     тензор структуры: на гребнях не скачет, где поток неоднозначен — прядей нет.
   Автор выбрал «смело» (ss 1.6) из трёх сил; мягко .5, средне 1 */
const GNB_SS=1.6,GNB_S=GNB_SS.toFixed(3);
/* поворот тона в YIQ к углу ang на долю k пути — кратчайшим путём и не дальше mx радиан, и только
   к близкому тону: к тону дальше ~135° не крутится (оранжевый к бирюзе шёл через оливу, к синей
   тени — через малину); cs — множитель цвета. Пик канала не растёт: синий той же яркости иначе выбивает белое */
/* лаванда у звезды (lav): смесь в OKLab к тону тени на яркости пикселя — середина пыльная, а не пурпур
   (поворот оранжевого к синему шёл через малину); хрома не ниже 85 % промежуточной — иначе серо;
   светлота не ниже исходной; пик канала не растёт */
const GNB_HTO=`
fn hto(c:vec3f,ang:f32,k:f32,cs:f32,mx:f32)->vec3f{
  let y=dot(c,vec3f(.299,.587,.114));let i=dot(c,vec3f(.596,-.274,-.322));let q=dot(c,vec3f(.211,-.523,.312));
  var d=ang-atan2(q,i);d=d-6.2832*floor(d/6.2832+.5);let a=clamp(d,-mx,mx)*k*smoothstep(.0,.04,length(vec2f(i,q)))*smoothstep(2.4,1.2,abs(d));
  let i2=(i*cos(a)-q*sin(a))*cs;let q2=(i*sin(a)+q*cos(a))*cs;
  let r=max(vec3f(y+.956*i2+.621*q2,y-.272*i2-.647*q2,y-1.106*i2+1.703*q2),vec3f(0.));
  return r*min(1.,max(c.r,max(c.g,c.b))*1.08/max(max(r.r,max(r.g,r.b)),1e-4));}
fn yan(c:vec3f)->f32{return atan2(dot(c,vec3f(.211,-.523,.312)),dot(c,vec3f(.596,-.274,-.322)));}
/* холод: синее и бирюзовое — 1, тёплое — 0 */
fn okl(c:vec3f)->vec3f{let l=pow(max(vec3f(dot(c,vec3f(.4122,.5363,.0514)),dot(c,vec3f(.2119,.6807,.1074)),dot(c,vec3f(.0883,.2817,.63))),vec3f(0.)),vec3f(1./3.));
  return vec3f(dot(l,vec3f(.2105,.7936,-.0041)),dot(l,vec3f(1.978,-2.4286,.4506)),dot(l,vec3f(.0259,.7828,-.8087)));}
fn lin(o:vec3f)->vec3f{let l=vec3f(dot(o,vec3f(1.,.3963,.2158)),dot(o,vec3f(1.,-.1056,-.0639)),dot(o,vec3f(1.,-.0895,-1.2915)));let m=l*l*l;
  return max(vec3f(dot(m,vec3f(4.0767,-3.3077,.231)),dot(m,vec3f(-1.2684,2.6098,-.3413)),dot(m,vec3f(-.0042,-.7034,1.7076))),vec3f(0.));}
fn lav(c:vec3f,ang:f32,t:f32)->vec3f{
  let y=dot(c,vec3f(.299,.587,.114));let r=length(vec2f(dot(c,vec3f(.596,-.274,-.322)),dot(c,vec3f(.211,-.523,.312))))*1.2;
  let i=r*cos(ang);let q=r*sin(ang);let s=max(vec3f(y+.956*i+.621*q,y-.272*i-.647*q,y-1.106*i+1.703*q),vec3f(0.));
  let a=okl(c);let b=okl(s);let ab=mix(a.yz,b.yz,t);let o=lin(vec3f(max(a.x,mix(a.x,b.x,t)),ab*max(1.,mix(length(a.yz),length(b.yz),t)*.85/max(length(ab),1e-5))));
  return o*min(1.,max(c.r,max(c.g,c.b))*1.08/max(max(o.r,max(o.g,o.b)),1e-4));}
fn cld(c:vec3f)->f32{return smoothstep(.02,.25,(c.b-max(c.r,c.g*.8))/max(c.b,.05));}`;
/* угол тона тени палитры в YIQ — в пустое место униформы (u.j.w) */
function gnbDeep(pl){const [r,g,b]=pl.c;return Math.atan2(.211*r-.523*g+.312*b,.596*r-.274*g-.322*b);}
/* пересчёт, тон слоя fl (0 — дальний): глубина к своей тени, затем зоны от звезды (sd — в высотах
   кадра). Холодная палитра (лёд) почти не крутится: tw; холодный пиксель не греется: cw */
const GNB_TONE=`
    let fz=(1.-fl*.5)*${GNB_S};let tw=1.-.75*cld(mix(A,B,.5));let cw=1.-.9*cld(col);
    let az=select(A,B,cld(B)>cld(A));let aw=select(B,A,cld(B)>cld(A));
    col=hto(col,u.j.w,clamp(.55*(1.-fl*.5)*${GNB_S},0.,1.)*tw,1.,.785)*(1.-.28*fz);
    col=hto(col,yan(aw),clamp(.4*max(fl-1.,0.)*${GNB_S},0.,1.)*cw,1.1,.785);
    let iz=clamp(son*(1.-smoothstep(.08,.7*sqrt(${GNB_S}),sd))*.85,0.,1.);
    col=hto(col,yan(az),iz,(1.-.2*iz)*(1.-.15*4.*iz*(1.-iz)),.785)*(1.+.1*iz+.25*4.*iz*(1.-iz));
    col=lav(col,clamp(u.j.w,2.3,2.6),clamp(son*(1.-smoothstep(.05,.65,sd))*.85,0.,1.)*1.15*(1.-.7*fill)*(1.-.5*max(cld(A),cld(B)))*(1.-cld(mix(A,B,.5))));
    col=hto(col,yan(aw),clamp(son*smoothstep(.35,1.1,sd)*.45*${GNB_S},0.,1.)*cw,1.+.15*${GNB_S},.785);`;
/* пересчёт: широкое зарево звезды — той же зоны, у звезды — к холодному своему */
const GNB_WC=`
  let izw=clamp(son*(1.-smoothstep(.08,.7*sqrt(${GNB_S}),sd))*.85,0.,1.);
  let wc0=hto(mix(sw,gc*max(sc.r,max(sc.g,sc.b)),.8),yan(select(A,B,cld(B)>cld(A))),izw*.7,1.-.25*izw,.785);
  let wc=lav(wc0,clamp(u.j.w,2.3,2.6),clamp(son*(1.-smoothstep(.05,.65,sd))*.85,0.,1.)*.7*1.15*(1.-.7*fill)*(1.-.5*max(cld(A),cld(B)))*(1.-cld(mix(A,B,.5))));`;
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
