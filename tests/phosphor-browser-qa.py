from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import json,os
out=Path(__file__).resolve().parent.parent/'artifacts/phosphor';out.mkdir(parents=True,exist_ok=True);checks=[];errors=[];external=[]
def passed(s):checks.append(s);print('PASS',s,flush=True)
wordlist=json.loads((Path(__file__).resolve().parent.parent/'src/words.json').read_text())
def six_words(value):
 for i in range(6):
  word=next((word for word in wordlist if value.startswith(word)),None)
  if word is None:return False
  value=value[len(word):]
  if i<5:
   if not value.startswith('-'):return False
   value=value[1:]
 return value==''
with sync_playwright() as p:
 webkit=bool(os.environ.get('WEBKIT'));engine=p.webkit if webkit else p.chromium;args={'headless':True}
 if webkit and os.environ.get('PLAYWRIGHT_WEBKIT_EXECUTABLE'):args['executable_path']=os.environ['PLAYWRIGHT_WEBKIT_EXECUTABLE']
 b=engine.launch(**args);options={'viewport':{'width':1200,'height':1000}}
 if not webkit:options['permissions']=['clipboard-read','clipboard-write']
 c=b.new_context(**options);page=c.new_page();page.set_default_timeout(4000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:external.append(r.url) if not r.url.startswith(('http://127.0.0.1:4349','data:','blob:')) else None)
 page.goto('http://127.0.0.1:4349/phosphor');page.wait_for_load_state('networkidle');page.evaluate('document.fonts.ready');expect(page.locator('.phosphor-shell')).to_be_visible()
 modes={'grouped':'Safari-style','random':'Random','memorable':'Word-based'}
 def values():return {m:page.get_by_test_id('password-'+m).inner_text() for m in modes}
 before=values();assert all(before.values());assert page.locator('canvas,img').count()==0;assert page.evaluate('document.fonts.check(\'48px "Keymaker Phosphor"\')');assert len(before['grouped'])==19 and len(before['random'])==16 and six_words(before['memorable']);passed('Real opening values, native font and no raster lettering')
 if not webkit:
  for m,label in modes.items():
   page.get_by_role('button',name=f'Copy {label} password',exact=True).click();assert page.evaluate('navigator.clipboard.readText()')==before[m];assert values()==before
  passed('All three Copy actions copy exactly the visible value without replacing it')
 page.get_by_role('button',name='Generate Random password').click();expect(page.get_by_test_id('password-random')).not_to_have_text(before['random']);assert values()['grouped']==before['grouped'];passed('Click regenerates only the chosen output')
 before=values();page.get_by_test_id('password-grouped').dblclick();assert page.evaluate('getSelection().toString()')==before['grouped'];page.wait_for_timeout(400);assert values()==before;passed('Double-click selects the exact original text without regeneration')
 page.evaluate('getSelection().removeAllRanges()');page.get_by_role('button',name='Generate Random password').focus();page.keyboard.press('Enter');expect(page.get_by_test_id('password-random')).not_to_have_text(before['random']);passed('Keyboard activation generates immediately')
 before=values();page.keyboard.press('r');assert all(values()[m]!=before[m] for m in modes);passed('R while a generator is focused refreshes all three')
 for width in [320,375,600,768,900,1280]:
  page.set_viewport_size({'width':width,'height':812});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  for m in modes:assert page.get_by_test_id('password-'+m).evaluate('e=>e.scrollWidth<=e.clientWidth+1'),(width,m)
 passed('Outputs wrap without overflow at320–1280')
 page.get_by_role('button',name='Help').focus();page.keyboard.press('Enter');expect(page.get_by_role('dialog')).to_be_visible();before=values();page.keyboard.press('r');assert values()==before;page.keyboard.press('Escape');expect(page.get_by_role('button',name='Help')).to_be_focused();passed('Help opens by keyboard, blocks shortcuts, closes with Escape and restores focus')
 page.evaluate("Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:async()=>{throw new DOMException('blocked','NotAllowedError')}})")
 page.get_by_role('button',name='Copy Random password').click();expect(page.get_by_role('dialog')).to_contain_text('Copy manually');field=page.get_by_role('textbox',name='Password to copy',include_hidden=True);assert field.input_value()==values()['random'];assert field.evaluate('e=>e.selectionEnd-e.selectionStart')==len(values()['random']);page.keyboard.press('Escape');expect(page.get_by_role('button',name='Copy Random password')).to_be_focused();assert field.input_value()=='';passed('Denied clipboard gives exact manual selection, clears on close and restores focus')
 page.evaluate("Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:()=>new Promise(resolve=>setTimeout(resolve,200))})")
 page.get_by_role('button',name='Copy Random password').click();page.get_by_role('button',name='Generate Random password').focus();page.keyboard.press('Enter');expect(page.get_by_role('status')).to_contain_text('previous value was copied');expect(page.get_by_role('button',name='Copy Random password')).to_have_text('COPY');passed('Async copy cannot mark a newer output as copied')
 c.set_offline(True);old=values();page.get_by_role('button',name='Generate Random password').focus();page.keyboard.press('Enter');assert values()['random']!=old['random'];c.set_offline(False);assert page.evaluate('Object.keys(localStorage).length')==0;passed('Generation works offline after load and stores no values or preferences')
 page.emulate_media(reduced_motion='reduce');assert page.locator('.copy-button').first.evaluate('e=>getComputedStyle(e).transitionDuration')=='0s';passed('Reduced motion disables transitions')
 for route,label in [('/dream','Dream'),('/horizon','Horizon'),('/','Studio')]:
  page.get_by_role('link',name=label,exact=True).click();page.wait_for_load_state('networkidle');assert page.url=='http://127.0.0.1:4349'+route;expect(page.get_by_role('link',name='Phosphor theme')).to_be_visible();page.goto('http://127.0.0.1:4349/phosphor');page.wait_for_load_state('networkidle')
 passed('Navigation opens all three preserved designs')
 un=b.new_context();un.add_init_script("Object.defineProperty(globalThis,'crypto',{value:undefined})");up=un.new_page();up.goto('http://127.0.0.1:4349/phosphor');expect(up.get_by_role('alert')).to_contain_text('unavailable');expect(up.get_by_role('button',name='Copy Random password')).to_be_disabled();passed('Unavailable randomness produces an error and disabled copy')
 fallback=b.new_page();fallback.route('**/fonts/phosphor-*.woff2',lambda route:route.abort());fallback.goto('http://127.0.0.1:4349/phosphor');fallback.wait_for_load_state('networkidle');assert fallback.get_by_test_id('password-random').inner_text();assert fallback.get_by_test_id('password-random').is_visible();passed('Blocked font retains readable native text')
 assert not errors,errors;assert not external,external;passed('No page errors or third-party requests')
 (out/('webkit.json' if webkit else 'browser-qa.json')).write_text(json.dumps({'passed':checks,'errors':errors,'external':external},indent=2));b.close()
