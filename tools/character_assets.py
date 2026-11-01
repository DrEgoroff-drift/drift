"""Компактные встроенные модели из GLB. Исходники остаются вне git.
Python 3.12 + numpy; Blender нужен только для предварительного упрощения.
"""
import base64, json, struct, sys
from pathlib import Path
import numpy as np

NAMES=['pelvis','spine_02','head','thigh.L','shin.L','foot.L',
       'thigh.R','shin.R','foot.R','upper_arm.L','forearm.L','upper_arm.R','forearm.R']
TAILS=['spine_02','head','', 'shin.L','foot.L','toe.L',
       'shin.R','foot.R','toe.R','forearm.L','hand.L','forearm.R','hand.R']

def lz4(raw):
    raw=bytes(raw)
    # Стандартный блок LZ4: маленький синхронный декодер, без библиотек в игре.
    out=bytearray();seen={};anchor=0;i=0;n=len(raw)
    def length(x):
        while x>=255:out.append(255);x-=255
        out.append(x)
    while i+4<n:
        key=raw[i:i+4];at=seen.get(key);seen[key]=i
        if at is None or i-at>65535:i+=1;continue
        size=4
        while i+size<n and raw[at+size]==raw[i+size]:size+=1
        literals=i-anchor;out.append(min(15,literals)*16+min(15,size-4))
        if literals>=15:length(literals-15)
        out.extend(raw[anchor:i]);out.extend(struct.pack('<H',i-at))
        if size>=19:length(size-19)
        i+=size;anchor=i
    literals=n-anchor;out.append(min(15,literals)*16)
    if literals>=15:length(literals-15)
    out.extend(raw[anchor:]);return bytes(out)

def bone_id(name):
    n=name.lower()
    side= '.r' in n
    if any(x in n for x in ['upper_arm','forearm','hand','index_','middle_','ring_','little_','pinky_','thumb_']):
        return (11 if side else 9)+(0 if 'upper_arm' in n else 1)
    if 'thigh' in n:return 6 if side else 3
    if 'shin' in n:return 7 if side else 4
    if 'foot' in n or 'toe' in n:return 8 if side else 5
    if n in ('head','neck'):return 2
    if n in ('root','pelvis','spine_01'):return 0
    return 1

class GLB:
    def __init__(self,path):
        raw=Path(path).read_bytes(); assert raw[:4]==b'glTF'
        n,k=struct.unpack_from('<II',raw,12);self.d=json.loads(raw[20:20+n]);off=20+n
        size,kind=struct.unpack_from('<II',raw,off);self.buf=raw[off+8:off+8+size]
        self.world={};self.parents={c:i for i,n in enumerate(self.d['nodes']) for c in n.get('children',[])}
    def arr(self,i):
        a=self.d['accessors'][i];v=self.d['bufferViews'][a['bufferView']]
        typ={5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]
        cols={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']]
        dt=np.dtype(typ); stride=v.get('byteStride',dt.itemsize*cols)
        out=np.ndarray((a['count'],cols),dtype=dt,buffer=self.buf,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(stride,dt.itemsize)).copy()
        if a.get('normalized') and a['componentType']!=5126:out=out.astype(float)/np.iinfo(dt).max
        return out
    def matrix(self,i):
        if i in self.world:return self.world[i]
        n=self.d['nodes'][i]
        if 'matrix' in n:M=np.array(n['matrix']).reshape(4,4).T
        else:
            x,y,z,w=n.get('rotation',[0,0,0,1]);M=np.eye(4)
            M[:3,:3]=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],
                [2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],
                [2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])@np.diag(n.get('scale',[1,1,1]))
            M[:3,3]=n.get('translation',[0,0,0])
        if i in self.parents:M=self.matrix(self.parents[i])@M
        self.world[i]=M;return M

def quantize(P,N,C,J,W,I,bind,codes=None):
    # 20 байт на общую вершину, индексы uint16; ошибка координаты <= 0,122 мм.
    P=np.asarray(P);N=np.asarray(N);C=np.asarray(C);J=np.asarray(J);W=np.asarray(W)
    assert np.isfinite(P).all() and np.isfinite(N).all()
    assert abs(P).max()<7.99 and len(P)<65536
    nn=np.linalg.norm(N,axis=1,keepdims=True)
    bad=nn[:,0]<1e-6
    if bad.any():
        tri=np.asarray(I,dtype=int).reshape(-1,3);face=np.cross(P[tri[:,1]]-P[tri[:,0]],P[tri[:,2]]-P[tri[:,0]])
        summed=np.zeros_like(N,dtype=float)
        for k in range(3):np.add.at(summed,tri[:,k],face)
        N[bad]=summed[bad];nn=np.linalg.norm(N,axis=1,keepdims=True)
        N[nn[:,0]<1e-8]=[0,1,0];nn=np.linalg.norm(N,axis=1,keepdims=True)
    N=N/np.maximum(nn,1e-8)
    b=bytearray();lookup={};indices=[]
    for idx in np.asarray(I).reshape(-1):
        i=int(idx);w=np.maximum(0,W[i]);w=w/max(w.sum(),1e-8)
        qw=np.rint(w*255).astype(int);qw[qw.argmax()]+=255-int(qw.sum())
        row=struct.pack('<hhhbbbBBBBBBBBBBB',*np.rint(P[i]*4096).astype(int),
            *np.clip(np.rint(N[i]*127),-127,127).astype(int),
            *np.clip(np.rint(C[i,:3]*255),0,255).astype(int),*J[i].astype(int),*qw)
        if codes is not None:row+=bytes([int(codes[i])])
        at=lookup.get(row)
        if at is None:at=len(lookup);lookup[row]=at;b.extend(row)
        indices.append(at)
    ib=bytearray();prev=0
    for i in indices:
        delta=i-prev;prev=i;v=delta*2 if delta>=0 else -delta*2-1
        while v>=128:ib.append((v&127)|128);v>>=7
        ib.append(v)
    stride=21 if codes is not None else 20
    planar=np.frombuffer(b,dtype='u1').reshape(-1,stride).T.copy().tobytes()
    return {'n':len(lookup),'t':len(indices)//3,'s':stride,'z':1,'p':1,'d':len(ib),'b':np.round(bind,5).tolist(),
            'v':base64.b64encode(lz4(planar)).decode(),'i':base64.b64encode(lz4(ib)).decode()}

def npc(path):
    g=GLB(path);d=g.d;pos=[];norm=[];col=[];joint=[];weight=[];inds=[];codes=[];offset=0
    sk=d['skins'][0];nodes={d['nodes'][i]['name']:i for i in sk['joints']}
    bind=[]
    for name,tail in zip(NAMES,TAILS):
        a=g.matrix(nodes[name])[:3,3]
        b=g.matrix(nodes[tail])[:3,3] if tail else a+np.array([0,.2,0])
        bind.append([*a,*b])
    mapping=np.array([bone_id(d['nodes'][i]['name']) for i in sk['joints']])
    for ni,node in enumerate(d['nodes']):
        if 'mesh' not in node:continue
        M=g.matrix(ni);NM=np.linalg.inv(M[:3,:3]).T
        for q in d['meshes'][node['mesh']]['primitives']:
            a=q['attributes'];P=g.arr(a['POSITION']);N=g.arr(a['NORMAL'])
            C=g.arr(a['COLOR_0']) if 'COLOR_0' in a else np.ones((len(P),4))
            mat=d.get('materials',[])[q.get('material',0)]
            C=C[:,:3]*np.array(mat.get('pbrMetallicRoughness',{}).get('baseColorFactor',[1,1,1,1]))[:3]
            name=mat.get('name','').lower()
            code=19 if 'lip' in name else 8 if 'skin' in name else 9 if 'hair' in name else 12 if 'eye' in name else 13 if 'leather' in name else 4 if 'metal' in name else 7 if 'cloth' in name else 0
            codes.extend([code]*len(P))
            J=mapping[g.arr(a['JOINTS_0']).astype(int)];W=g.arr(a['WEIGHTS_0'])
            # Объединяем веса пальцев и шеи, не выбрасывая плавные стыки.
            for k in range(4):
                for j in range(k+1,4):
                    same=J[:,k]==J[:,j];W[same,k]+=W[same,j];W[same,j]=0
            pos.extend(P@M[:3,:3].T+M[:3,3]);norm.extend(N@NM.T);col.extend(C);joint.extend(J);weight.extend(W)
            inds.extend(g.arr(q['indices']).reshape(-1)+offset);offset+=len(P)
    assert np.ptp(np.array(pos)[:,1])>1, 'Incomplete body: '+str(path)
    return quantize(pos,norm,col,joint,weight,inds,bind,codes)

def main():
    if sys.argv[1]=='--mechanic':
        d=json.loads(Path(sys.argv[2]).read_text());P=[];N=[];C=[];J=[];W=[];codes=[]
        for q in d['parts']:
            for v,n,c,code,weights in zip(q['v'],q['n'],q['rgb'],q['c'],q['w']):
                point=np.array(v)+d['bind'][q['bone']]
                if code==5:point[1]+=.11
                # Подол исходных брюк заходил внутрь снятого ботинка рваными лоскутами.
                if code==0 and point[1]<.26:point[1]=.26
                P.append(point);N.append(n);C.append(c);codes.append(code)
                items=weights+[(0,0)]*(4-len(weights));J.append([b for b,w in items]);W.append([w for b,w in items])
        data=quantize(P,N,C,J,W,np.arange(len(P)),d['bind'],codes);name='ART_MECH_SKIN'
    else:
        return main_npc()
    dst=Path(sys.argv[3]);dst.write_text('/* Компактная сетка с плавными весами. Генератор: tools/character_assets.py. */\nconst '+name+'='+json.dumps(data,separators=(',',':'))+';\n',encoding='utf-8')
    print(name,data['n'],'vertices',data['t'],'triangles',dst.stat().st_size,'bytes')

def main_npc():
    root=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
    total=0;tri=0
    for batch in range(10):
        records={}
        for id in range(batch*10+1,batch*10+11):
            # LOD3 исходного комплекта потерял тело, оставив глаза и уши.
            # LOD2 проверяется по росту: комплектный PASS эту поломку не ловил.
            name=f'NPC-{id:03}';lod=2
            q=npc(root/'Drift_NPC_100/models'/name/f'{name}_LOD{lod}.glb');records[id]=q;tri+=q['t']
        text='/* Жители из GLB: индексированная сетка, веса суставов, линейный цвет. Генератор: tools/character_assets.py. */\nObject.assign(NPC_ART_DATA,'+json.dumps(records,separators=(',',':'))+');\n'
        dst=out/f'27f3d{batch}-npc-art.js';dst.write_text(text,encoding='utf-8');total+=dst.stat().st_size
    print('NPC:',tri,'triangles;',total,'bytes inline; sources unchanged')
if __name__=='__main__':main()
