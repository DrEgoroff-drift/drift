import json,sys
sys.path.insert(0,r"C:\Users\user\AppData\Local\Temp\claude\C--Claude\b7d06a14-2cd9-49cd-bf67-437bbfa2a811\scratchpad")
import cdp
ws=cdp.WS(cdp.target_ws())
R=json.loads(cdp.evaluate(ws,"JSON.stringify(window.__pl||[])"))
print("frames",len(R))
# t,zoom,name,dist,rpx,sx,sy,calls,mode
prev=None
for r in R:
    drawn=bool(r[7])
    key=(r[2],drawn,round(r[1],1))
    if key!=prev:
        print(f"{r[0]/1000:5.1f}s z {r[1]:.2f} {r[2]} d {r[3]} r_px {r[4]} centre {r[5]},{r[6]} drawn={drawn} {r[7][:60]}")
        prev=key
