/* ══════════════ WebGL2: контекст и обёртки ══════════════
   Тонкий слой, а не движок: программа, буфер, сетка, цель отрисовки. Всё
   остальное пишется прямо в проходах — так видно, что происходит с кадром.

   ПРАВИЛО ОШИБОК. Шейдер, который не собрался, не должен молчать: страница
   показывает лог компиляции на экране (60-app), иначе поиск опечатки в GLSL
   превращается в чёрный экран без единой зацепки. */
let gl=null,GLX={};
function glInit(cv){
  gl=cv.getContext("webgl2",{antialias:false,alpha:false,depth:true,stencil:false,
    powerPreference:"high-performance",preserveDrawingBuffer:false});
  if(!gl)return null;
  GLX.float=gl.getExtension("EXT_color_buffer_float");      /* HDR-цель */
  GLX.lin  =gl.getExtension("OES_texture_float_linear");    /* её же фильтрация */
  GLX.half =gl.getExtension("EXT_color_buffer_half_float");
  GLX.aniso=gl.getExtension("EXT_texture_filter_anisotropic");
  GLX.maxAniso=GLX.aniso?gl.getParameter(GLX.aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT):1;
  return gl;
}
/* ── программа ──
   Исходники хранятся без версии: `#version 300 es` подставляется здесь, чтобы
   его нельзя было забыть, и чтобы номера строк в логе совпадали с файлом. */
const GL_ERR=[];
function glProg(vs,fs,name){
  const sh=(type,src)=>{
    const s=gl.createShader(type);
    /* точность у сэмплеров обязана быть объявлена явно: во фрагментной
       программе есть умолчание только для float, а sampler2DShadow без
       precision — ошибка компиляции, и на этом кадр становится чёрным */
    gl.shaderSource(s,"#version 300 es\nprecision highp float;\nprecision highp int;\n"+
      "precision highp sampler2D;\nprecision highp sampler2DShadow;\n"+src);
    gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){
      GL_ERR.push((name||"?")+" "+(type===gl.VERTEX_SHADER?"vert":"frag")+": "+gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const v=sh(gl.VERTEX_SHADER,vs),f=sh(gl.FRAGMENT_SHADER,fs);
  if(!v||!f)return null;
  const p=gl.createProgram();
  gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);
  gl.deleteShader(v);gl.deleteShader(f);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)){
    GL_ERR.push((name||"?")+" link: "+gl.getProgramInfoLog(p));return null;
  }
  /* адреса uniform-ов достаются один раз: getUniformLocation в кадре — это
     обращение к драйверу на каждый вызов */
  const u={},n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);
  for(let i=0;i<n;i++){
    const nm=gl.getActiveUniform(p,i).name.replace(/\[0\]$/,"");
    u[nm]=gl.getUniformLocation(p,nm);
  }
  return {p,u,name};
}
/* установка uniform по типу значения: число, вектор, матрица */
function glSet(P,name,val){
  const l=P.u[name];if(l===undefined||l===null)return;
  if(typeof val==="number")gl.uniform1f(l,val);
  else if(val.length===16)gl.uniformMatrix4fv(l,false,val);
  else if(val.length===9)gl.uniformMatrix3fv(l,false,val);
  else if(val.length===4)gl.uniform4f(l,val[0],val[1],val[2],val[3]);
  else if(val.length===3)gl.uniform3f(l,val[0],val[1],val[2]);
  else if(val.length===2)gl.uniform2f(l,val[0],val[1]);
}
function glTex(P,name,unit,tex,target){
  const l=P.u[name];if(l===undefined||l===null)return;
  gl.activeTexture(gl.TEXTURE0+unit);
  gl.bindTexture(target||gl.TEXTURE_2D,tex);
  gl.uniform1i(l,unit);
}
/* ── сетка ──
   Атрибуты описываются одной таблицей: [имя, размер, смещение] в шаге stride.
   Инстансы (перья) идут отдельным буфером с divisor=1. */
function glMesh(spec){
  const vao=gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vb=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,vb);
  gl.bufferData(gl.ARRAY_BUFFER,spec.verts,gl.STATIC_DRAW);
  let loc=0;
  for(const a of spec.attrs){
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc,a[1],gl.FLOAT,false,spec.stride*4,a[2]*4);
    loc++;
  }
  let ib=null,count=0;
  if(spec.index){
    ib=gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,spec.index,gl.STATIC_DRAW);
    count=spec.index.length;
  }else count=spec.verts.length/spec.stride;
  const M={vao,vb,ib,count,inst:0,ivb:null,type:spec.index instanceof Uint32Array?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT,
           mode:spec.mode===undefined?gl.TRIANGLES:spec.mode,base:loc};
  gl.bindVertexArray(null);
  return M;
}
/* поток инстансов: буфер переписывается каждый кадр (перья дышат), поэтому
   DYNAMIC_DRAW и bufferSubData вместо пересоздания */
function glInstances(M,data,attrs,stride){
  gl.bindVertexArray(M.vao);
  if(!M.ivb){M.ivb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,M.ivb);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);}
  else{gl.bindBuffer(gl.ARRAY_BUFFER,M.ivb);gl.bufferSubData(gl.ARRAY_BUFFER,0,data);}
  let loc=M.base;
  for(const a of attrs){
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc,a[1],gl.FLOAT,false,stride*4,a[2]*4);
    gl.vertexAttribDivisor(loc,1);
    loc++;
  }
  M.inst=data.length/stride;
  gl.bindVertexArray(null);
}
function glDraw(M,n){
  gl.bindVertexArray(M.vao);
  const inst=n===undefined?M.inst:n;
  if(M.ib){
    if(inst)gl.drawElementsInstanced(M.mode,M.count,M.type,0,inst);
    else gl.drawElements(M.mode,M.count,M.type,0);
  }else{
    if(inst)gl.drawArraysInstanced(M.mode,0,M.count,inst);
    else gl.drawArrays(M.mode,0,M.count);
  }
}
/* ── цель отрисовки ──
   fmt: "rgba16f" для света (в HDR считается всё), "depth" для карты теней. */
function glTarget(w,h,fmt,filter){
  const t={w,h,fmt};
  t.fb=gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER,t.fb);
  const F=filter===undefined?gl.LINEAR:filter;
  if(fmt==="depth"){
    t.tex=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,t.tex);
    gl.texStorage2D(gl.TEXTURE_2D,1,gl.DEPTH_COMPONENT24,w,h);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    /* сравнение прямо в железе: sampler2DShadow даёт мягкий край дешевле,
       чем сравнение вручную в шейдере */
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,t.tex,0);
    gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
  }else{
    const ifmt=fmt==="rgba16f"?gl.RGBA16F:(fmt==="r11f"?gl.R11F_G11F_B10F:gl.RGBA8);
    t.tex=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,t.tex);
    gl.texStorage2D(gl.TEXTURE_2D,1,ifmt,w,h);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,F);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,F);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t.tex,0);
    if(filter!==false){
      t.rb=gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER,t.rb);
      gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT24,w,h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,t.rb);
    }
  }
  const st=gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if(st!==gl.FRAMEBUFFER_COMPLETE)GL_ERR.push("цель "+fmt+" "+w+"×"+h+" не собралась: "+st.toString(16));
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  return t;
}
function glUse(t){
  if(t){gl.bindFramebuffer(gl.FRAMEBUFFER,t.fb);gl.viewport(0,0,t.w,t.h);}
  else{gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight);}
}
/* полноэкранный треугольник для проходов постобработки: один треугольник
   вместо двух — меньше перерисовки на диагонали */
let QUAD=null;
function glQuad(){
  if(!QUAD)QUAD=glMesh({verts:new Float32Array([-1,-1, 3,-1, -1,3]),stride:2,attrs:[["p",2,0]]});
  return QUAD;
}
