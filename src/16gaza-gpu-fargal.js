/* ДРЕЙФ — далёкие галактики на заднике системы (06.10, по пробе three.js в docs/three/space.html).
   Вместо спирали-громадины (вид 2 в gnbLandmark) — россыпь из восьми мелких и еле видных:
   спираль, эллипс, диск с ребра, неправильная. Рисуются в сведении туманности (GNB_EMI,
   полное разрешение), за газом: густой газ их закрывает, пыль приглушает. Шум gh/gn/fb и sq —
   из GNB_NOISE, fu — форма сведения: v[0] камера и зерно, v[1] звезда. Параллакс .004 —
   дальше всего в кадре. Яркость ×1.6 мерена: сведение жмёт, добавка .5 доходит до кадра ~100/255 */
const GNB_FGAL=`
fn fgx(q:vec2f,kind:f32,s:f32)->vec3f{
  let r=length(q);let th=atan2(q.y,q.x);
  let warm=vec3f(1.,.82,.6);let blue=vec3f(.62,.72,1.);
  if(kind<.5){
    let arm=.5+.5*cos(2.*(th-log(r+.02)*2.6+s));
    let disk=exp(-r/.3);let bul=exp(-r*r/.012);
    let knot=smoothstep(.62,.9,gn(q*9.+s))*disk*arm;
    return warm*bul*1.3+mix(warm,blue,smoothstep(.05,.5,r))*disk*(.25+.75*arm*arm)+vec3f(1.,.45,.6)*knot*.6;}
  if(kind<1.5){return warm*min(exp(-7.7*(pow(max(r/.35,1e-3),.25)-1.)),40.)*.02;}
  if(kind<2.5){
    let disk=exp(-abs(q.x)/.35)*exp(-abs(q.y)/.06);let bul=exp(-r*r/.008);
    let lane=1.-.8*exp(-q.y*q.y/.0012)*smoothstep(.02,.12,abs(q.x));
    return (warm*bul*1.2+mix(warm,blue,.5)*disk*.9)*lane;}
  let m=smoothstep(.3,.78,fb(q*1.8+s,3))*exp(-r*r/.3);
  return mix(blue,vec3f(1.,.5,.65),smoothstep(.55,.8,gn(q*6.+s+3.)))*m*.5;}
fn fgal(p:vec2f)->vec3f{
  let W=fu.res.z;let H=fu.res.w;let sd=fu.v[0].w;
  var c=vec3f(0.);
  for(var i=0;i<8;i++){
    let s=f32(i)*13.7+sd;
    let sz=H*mix(.02,.05,sq(gh(vec2f(s,7.))));
    let o=vec2f(gh(vec2f(s,1.)),gh(vec2f(s,3.)))*vec2f(W,H)-fu.v[0].xy*.004;
    let d0=p-o;if(dot(d0,d0)>sz*sz*9.){continue;}
    let kind=floor(gh(vec2f(s,5.))*4.);
    let a=gh(vec2f(s,4.))*6.283;let ca=cos(a);let sa=sin(a);
    var q=vec2f(d0.x*ca+d0.y*sa,-d0.x*sa+d0.y*ca)/sz;
    q.y=q.y/select(mix(.3,1.,gh(vec2f(s,9.))),1.,kind>2.5);
    /* у звезды не видно ничего — её сияние засвечивает */
    let ks=smoothstep(.12,.35,max(length(o-fu.v[1].xy)/H-fu.v[1].z,0.)*fu.v[1].w+(1.-fu.v[1].w));
    c=c+fgx(q,kind,s)*mix(.45,1.,gh(vec2f(s,2.)))*ks;}
  return c*1.6;}
`;
