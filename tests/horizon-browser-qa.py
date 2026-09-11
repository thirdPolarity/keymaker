from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import json
out=Path(__file__).resolve().parent.parent/'artifacts/horizon'
out.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];failed=[];external=[]
def passed(s):checks.append(s);print('PASS',s,flush=True)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True);c=b.new_context(viewport={'width':1280,'height':900},permissions=['clipboard-read','clipboard-write']);page=c.new_page();page.set_default_timeout(5000)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:failed.append([r.status,r.url]) if r.status>=400 else None);page.on('request',lambda r:external.append(r.url) if not r.url.startswith(('http://127.0.0.1:4349','data:','blob:')) else None)
 page.goto('http://127.0.0.1:4349/horizon');page.wait_for_load_state('networkidle');page.evaluate('document.fonts.ready')
 modes={'grouped':'Safari-style','random':'Random','memorable':'Memorable'}
 def values():return {m:page.get_by_test_id('password-'+m).inner_text() for m in modes}
 assert all(values().values());assert page.locator('.horizon-shell.is-dark').count()==1;passed('Horizon loads its landscape, real outputs and default dark panel')
 assert page.locator('.horizon-shell').evaluate("e=>getComputedStyle(e,'::before').backgroundImage.includes('horizon-landscape')")
 for m,name in modes.items():page.get_by_role('button',name=f'Copy {name} password').click();assert page.evaluate('navigator.clipboard.readText()')==values()[m]
 passed('Three exact copy actions')
 before=values();page.get_by_role('button',name='Generate Random password').click();after=values();assert before['random']!=after['random'];assert before['grouped']==after['grouped'] and before['memorable']==after['memorable'];passed('Individual generation preserves other outputs')
 page.get_by_role('button',name='Settings',exact=True).click();page.get_by_role('slider',name='Length').fill('64');page.get_by_role('button',name='Apply & generate').click();assert len(values()['random'])==64
 page.get_by_role('button',name='Memorable',exact=True).click();page.get_by_role('slider',name='Words').fill('8');page.get_by_label('Separator',exact=True).select_option('_');page.get_by_role('checkbox',name='Add a number').check();page.get_by_role('button',name='Apply & generate').click();assert len(values()['memorable'].split('_'))==9
 page.screenshot(path=str(out/'v2-horizon-settings.png'),full_page=True);page.keyboard.press('Escape');expect(page.get_by_role('button',name='Settings',exact=True)).to_be_focused();passed('Settings apply, long outputs, Escape and focus restoration')
 for width in [320,375,600,768,900,1280]:
  page.set_viewport_size({'width':width,'height':812});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  for mode in modes:assert page.get_by_test_id('password-'+mode).evaluate('e=>e.scrollWidth<=e.clientWidth+1'),(mode,width)
 passed('Long outputs and layout contained at320–1280')
 page.set_viewport_size({'width':375,'height':812});page.get_by_role('button',name='Pause cube animation').click();page.evaluate('scrollTo(0,0)');page.screenshot(path=str(out/'v2-horizon-long-mobile.png'),full_page=True)
 page.evaluate("Object.defineProperty(navigator.clipboard,'writeText',{value:async()=>{throw new DOMException('blocked','NotAllowedError')},configurable:true})");page.get_by_role('button',name='Copy Random password').click();expect(page.get_by_role('alert')).to_contain_text('Clipboard blocked');page.get_by_role('button',name='Select password text').click();assert page.evaluate('getSelection().toString()')==values()['random'];passed('Denied clipboard and exact manual-selection recovery')
 page.screenshot(path=str(out/'v2-horizon-copy-denied.png'),full_page=True)
 before=values()
 for name in ['Classic DMG','Amber terminal','Cyan matrix','Purple haze','Orange sunset','SNES','Red alert','Blue steel','Monochrome']:
  page.get_by_role('button',name=name,exact=True).click();assert values()==before
 page.get_by_role('button',name='SNES',exact=True).click();page.get_by_role('button',name='Switch to light mode').click();page.screenshot(path=str(out/'v2-horizon-light-mobile.png'),full_page=True);passed('Nine palettes and light/dark switch preserve values')
 c.set_offline(True);before=values()['random'];page.get_by_role('button',name='Generate Random password').click();assert before!=values()['random'];c.set_offline(False);passed('Offline-after-load generation')
 page.emulate_media(reduced_motion='reduce');assert page.locator('.cube').evaluate('e=>getComputedStyle(e).animationName')=='none';passed('Reduced motion honored')
 page.get_by_role('button',name='About Keymaker').click();expect(page.get_by_role('dialog')).to_contain_text('Passwords aren’t saved');page.keyboard.press('Escape');passed('About details accessible')
 page.get_by_role('link',name='Dream',exact=True).click();assert not page.locator('.horizon-shell').count();assert page.locator('.dream-shell').count()==1;expect(page.get_by_role('button',name='Switch to dark mode')).to_be_visible();passed('Dream remains separate with its own theme preferences')
 page.set_viewport_size({'width':900,'height':700});assert abs(page.get_by_test_id('password-random').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')-42)<.1;passed('Dream retains its larger42px desktop/window output font')
 page.get_by_role('link',name='Studio theme').click();expect(page.locator('.instrument')).to_be_visible();expect(page.get_by_role('heading',name='Passwords, made your way.')).to_be_visible();page.set_viewport_size({'width':1280,'height':1100});assert page.evaluate('document.body.getBoundingClientRect().height>=innerHeight');page.get_by_role('button',name='Switch to obsidian finish').click();assert page.evaluate('document.body.getBoundingClientRect().height>=innerHeight');passed('Studio copy and tall-window background coverage in both finishes')
 page.get_by_role('link',name='Horizon theme').click();expect(page.get_by_role('button',name='Switch to dark mode')).to_be_visible();passed('All three pages navigate and restore preferences')
 blocked=b.new_context();blocked.add_init_script("Storage.prototype.getItem=()=>{throw new Error('blocked')};Storage.prototype.setItem=()=>{throw new Error('blocked')}");bp=blocked.new_page();bp.goto('http://127.0.0.1:4349/horizon');expect(bp.get_by_test_id('password-random')).not_to_have_text('—');passed('Blocked storage does not break Horizon')
 un=b.new_context();un.add_init_script("Object.defineProperty(globalThis,'crypto',{value:undefined})");up=un.new_page();up.goto('http://127.0.0.1:4349/horizon');expect(up.get_by_role('alert')).to_contain_text('Password generation is unavailable');expect(up.get_by_role('button',name='Copy Random password')).to_be_disabled();passed('Unavailable randomness error and disabled copy')
 assert not errors,errors;assert not failed,failed;assert not external,external;passed('No page errors, failed assets, or third-party requests')
 (out/'browser-qa.json').write_text(json.dumps({'passed':checks,'errors':errors,'failed_requests':failed,'external':external},indent=2));b.close()
