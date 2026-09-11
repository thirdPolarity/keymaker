from pathlib import Path
from playwright.sync_api import sync_playwright
import json
out=Path(__file__).resolve().parent.parent/'artifacts/dream-refinement';out.mkdir(exist_ok=True,parents=True)
def luminance(rgb):
 return sum(w*(v/255/12.92 if v/255<=.04045 else ((v/255+.055)/1.055)**2.4) for w,v in zip([.2126,.7152,.0722],rgb))
with sync_playwright() as p:
 b=p.chromium.launch(headless=True);page=b.new_page();page.goto('http://127.0.0.1:4349/dream');page.wait_for_load_state('networkidle');samples=[]
 for dark in [False,True]:
  if bool(page.locator('.is-dark').count())!=dark:page.locator('.mode-button').click()
  for name in ['Classic DMG','Amber terminal','Cyan matrix','Purple haze','Orange sunset','SNES','Red alert','Blue steel','Monochrome']:
   page.get_by_role('button',name=name,exact=True).click()
   colors=page.evaluate('''dark => {
    const style=getComputedStyle(document.querySelector('.dream-shell')),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=canvas.height=1;
    const rgb=s=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=s;ctx.fillRect(0,0,1,1);return Array.from(ctx.getImageData(0,0,1,1).data).slice(0,3)};
    const paper=rgb(style.getPropertyValue('--paper')),ink=rgb(style.getPropertyValue('--ink')),accent=rgb(style.getPropertyValue('--accent'));
    const mix=(a,b,t)=>a.map((v,i)=>v*t+b[i]*(1-t));
    const field=rgb(getComputedStyle(document.querySelector('.password-frame')).backgroundColor),button=rgb(getComputedStyle(document.querySelector('.action-button')).backgroundColor);
    return [
     {kind:'heading, cube hint and icons on page',fg:ink,bg:paper},
     {kind:'light accent gradient endpoint',fg:ink,bg:dark?paper:mix(accent,paper,.32)},
     {kind:'light white gradient endpoint',fg:ink,bg:dark?paper:mix([255,255,255],paper,1/3)},
     {kind:'password characters',fg:ink,bg:field},
     {kind:'password symbols',fg:mix(ink,paper,.92),bg:field},
     {kind:'resting action',fg:ink,bg:button},
     {kind:'active action',fg:paper,bg:ink},
     {kind:'active dotted endpoint',fg:paper,bg:mix(paper,ink,.12)},
     {kind:'selected settings tab',fg:ink,bg:mix(ink,paper,.07)},
     {kind:'hovered settings',fg:ink,bg:dark?mix(paper,ink,.88):mix([255,255,255],paper,1/3)},
     {kind:'field border',fg:dark?mix(ink,paper,.64):ink,bg:field,threshold:3},
     {kind:'action border',fg:dark?mix(ink,paper,.58):ink,bg:button,threshold:3},
    ];
   }''',dark)
   for c in colors:
    low,high=sorted([luminance(c['fg']),luminance(c['bg'])]);c.update(ratio=round((high+.05)/(low+.05),2),dark=dark,palette=name);samples.append(c)
 result={'method':'Actual sRGB colors; conservative light gradient and dotted-state endpoints, opaque dark surfaces. Text requires4.5:1; component borders3:1.','minimum_text':min(s['ratio'] for s in samples if not s.get('threshold')),'minimum_border':min(s['ratio'] for s in samples if s.get('threshold')),'samples':samples,'failures':[s for s in samples if s['ratio']<s.get('threshold',4.5)]}
 (out/'contrast.json').write_text(json.dumps(result,indent=2));print({k:v for k,v in result.items() if k!='samples'});assert not result['failures'];b.close()
