from pathlib import Path
from playwright.sync_api import sync_playwright
import json
out=Path(__file__).resolve().parent.parent/'artifacts/dream'
out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True);page=b.new_page();page.goto('http://127.0.0.1:4349/dream');page.wait_for_load_state('networkidle');samples=[]
 for dark in [False,True]:
  if dark:page.get_by_role('button',name='Switch to dark mode').click()
  for name in ['Classic DMG','Amber terminal','Cyan matrix','Purple haze','Orange sunset','SNES','Red alert','Blue steel','Monochrome']:
   page.get_by_role('button',name=name,exact=True).click()
   colors=page.evaluate('''() => {
     const shell=document.querySelector('.dream-shell'), style=getComputedStyle(shell);
     const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=canvas.height=1;
     function rgb(s){ctx.clearRect(0,0,1,1);ctx.fillStyle=s;ctx.fillRect(0,0,1,1);return Array.from(ctx.getImageData(0,0,1,1).data).slice(0,3)};
     const p=rgb(style.getPropertyValue('--paper')), ink=rgb(style.getPropertyValue('--ink')),accent=rgb(style.getPropertyValue('--accent'));
     const mix=(a,b,t)=>a.map((v,i)=>v*t+b[i]*(1-t));
     return [
       {kind:'heading on paper',fg:ink,bg:p},
       {kind:'heading at accent gradient endpoint',fg:ink,bg:mix(accent,p,0.32)},
       {kind:'heading at white gradient endpoint',fg:ink,bg:mix([255,255,255],p,document.querySelector('.is-dark')?0:0.333)},
       {kind:'output characters',fg:ink,bg:mix(p,accent,0.83)},
       {kind:'output symbols',fg:mix(ink,p,0.92),bg:mix(p,accent,0.83)},
       {kind:'settings button at bright backdrop endpoint',fg:ink,bg:mix([255,255,255],mix(accent,p,document.querySelector('.is-dark')?0.13:0.32),0.133)},
       {kind:'resting button',fg:ink,bg:mix(p,[255,255,255],0.89)},
       {kind:'active button background',fg:p,bg:ink},
       {kind:'active button dot endpoint',fg:p,bg:mix(p,ink,0.12)},
     ];
   }''')
   for c in colors:
    def lum(rgb):
     return sum(w*(v/255/12.92 if v/255<=.04045 else ((v/255+.055)/1.055)**2.4) for w,v in zip([.2126,.7152,.0722],rgb))
    a,z=sorted([lum(c['fg']),lum(c['bg'])]);c['ratio']=round((z+.05)/(a+.05),2);c['palette']=name;c['dark']=dark;samples.append(c)
 result={'method':'sRGB luminance; conservative whole-page gradient endpoints and opaque output/button colors, including the lightest dotted interaction state; no text-shadow credit.','minimum':min(s['ratio'] for s in samples),'samples':samples,'below_4_5':[s for s in samples if s['ratio']<4.5]};(out/'contrast.json').write_text(json.dumps(result,indent=2));print('samples',len(samples),'minimum',result['minimum'],'failures',result['below_4_5']);b.close()
