/* ══════════════ шум для полей комнат: хеш и гладкий шум значений (дом 29d) ══════════════ */
const ROOM_WGSL_NOISE=`
fn rh(p:vec2f)->f32{return fract(sin(dot(p,vec2f(127.1,311.7)))*43758.5453);}
fn rn(p:vec2f)->f32{let i=floor(p);let f=fract(p);let u=f*f*(3.-2.*f);
  return mix(mix(rh(i),rh(i+vec2f(1.,0.)),u.x),mix(rh(i+vec2f(0.,1.)),rh(i+vec2f(1.,1.)),u.x),u.y);}
fn rfbm(p:vec2f)->f32{return rn(p)*.5+rn(p*2.03+vec2f(1.7,9.2))*.3+rn(p*4.01+vec2f(8.3,2.8))*.2;}`;
