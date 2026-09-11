from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import json
out=Path(__file__).resolve().parent.parent/'artifacts/dream'
out.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];external=[]
def passed(s):checks.append(s);print('PASS',s,flush=True)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True)
 c=b.new_context(viewport={'width':1280,'height':900},permissions=['clipboard-read','clipboard-write'])
 page=c.new_page();page.set_default_timeout(5000)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:external.append(r.url) if not r.url.startswith(('http://127.0.0.1:4349','data:','blob:')) else None)
 page.goto('http://127.0.0.1:4349/dream');page.wait_for_load_state('networkidle');page.evaluate('document.fonts.ready')
 modes={'grouped':'Safari-style','random':'Random','memorable':'Memorable'}
 def values():return {m:page.get_by_test_id('password-'+m).inner_text() for m in modes}
 def settings(mode):
  if not page.get_by_role('dialog').is_visible():page.get_by_role('button',name='Settings',exact=True).click()
  page.get_by_role('button',name=mode,exact=True).click()
 def close():page.get_by_role('button',name='Close settings').click()
 original=values();assert all(original.values());passed('Dream route renders three real outputs and source-specific Orbitron typography')
 assert 'Orbitron' in page.get_by_test_id('password-grouped').evaluate('e=>getComputedStyle(e).fontFamily')
 for mode,name in modes.items():
  page.get_by_role('button',name=f'Copy {name} password',exact=True).click();assert page.evaluate('navigator.clipboard.readText()')==values()[mode]
 passed('All three copy actions copy the exact displayed string')
 page.get_by_role('button',name='Generate Random password',exact=True).click();assert values()['random']!=original['random'];assert values()['grouped']==original['grouped'];assert values()['memorable']==original['memorable'];passed('Per-mode generation preserves other outputs')
 settings('Random');page.get_by_role('slider',name='Length').fill('64')
 page.get_by_role('button',name='Safari-style',exact=True).click();page.get_by_role('slider',name='Length').fill('32');page.get_by_role('button',name='Apply & generate').click();assert len(values()['grouped'].replace('-',''))==32
 page.get_by_role('button',name='Random',exact=True).click();expect(page.get_by_role('button',name='Apply & generate')).to_be_visible();page.get_by_role('button',name='Apply & generate').click();assert len(values()['random'])==64;passed('Per-mode pending settings remain independent and apply explicitly')
 for label in ['Uppercase','Lowercase','Symbols']:page.get_by_role('checkbox',name=label,exact=True).uncheck()
 expect(page.get_by_role('checkbox',name='Numbers',exact=True)).to_be_disabled();page.get_by_role('button',name='Apply & generate').click();assert values()['random'].isdigit();passed('Character controls work and final category is guarded')
 settings('Memorable');page.get_by_role('slider',name='Words').fill('8');page.get_by_label('Separator',exact=True).select_option('_');page.get_by_role('checkbox',name='Add a number').check();page.get_by_role('checkbox',name='Add a symbol').check();page.get_by_role('button',name='Apply & generate').click();assert len(values()['memorable'].split('_'))>=10;close();passed('Memorable word count, separator, number and symbol work')
 for width in [320,375,768,1280]:
  page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  for mode in modes:assert page.get_by_test_id('password-'+mode).evaluate('e=>e.scrollWidth<=e.clientWidth+1'),(mode,width)
 passed('Maximum outputs stay contained at 320,375,768,1280')
 page.set_viewport_size({'width':375,'height':812});page.screenshot(path=str(out/'v2-long-mobile.png'),full_page=True,animations='disabled')
 before=values()
 for name in ['Classic DMG','Amber terminal','Cyan matrix','Purple haze','Orange sunset','SNES','Red alert','Blue steel','Monochrome']:
  page.get_by_role('button',name=name,exact=True).click();assert values()==before
 page.get_by_role('button',name='SNES',exact=True).click();passed('Nine whole-page palettes preserve generated values')
 page.evaluate("Object.defineProperty(navigator.clipboard,'writeText',{value:async()=>{throw new DOMException('Blocked','NotAllowedError')},configurable:true})")
 page.get_by_role('button',name='Copy Random password').click();expect(page.get_by_role('alert')).to_contain_text('Clipboard blocked');page.get_by_role('button',name='Select password text').click();assert page.evaluate('getSelection().toString()')==values()['random'];passed('Clipboard denial has nearby feedback and exact manual-selection recovery')
 page.screenshot(path=str(out/'v2-copy-recovery.png'),full_page=True,animations='disabled')
 settings('Random')
 for _ in range(14):page.keyboard.press('Tab');assert page.evaluate("document.activeElement.closest('dialog')!==null || document.activeElement===document.body")
 page.keyboard.press('Escape');expect(page.get_by_role('dialog')).not_to_be_visible();expect(page.get_by_role('button',name='Settings',exact=True)).to_be_focused();passed('Settings modal traps keyboard focus, closes with Escape and restores focus')
 page.get_by_role('button',name='About Keymaker').click();expect(page.get_by_role('dialog')).to_contain_text('Passwords aren’t saved');page.keyboard.press('Escape');passed('About details remain disclosed')
 assert page.locator('.cube-pause').count()==0;assert page.locator('.cube').evaluate('e=>getComputedStyle(e).animationPlayState')=='running'
 page.emulate_media(reduced_motion='reduce');assert page.locator('.cube').evaluate('e=>getComputedStyle(e).animationName')=='none';passed('Cube spins automatically without playback buttons and respects reduced motion')
 c.set_offline(True);prior=values()['random'];page.get_by_role('button',name='Generate Random password').click();assert prior!=values()['random'];c.set_offline(False);passed('Generation works offline after loading')
 page.get_by_role('button',name='Switch to dark mode').click();page.get_by_role('link',name='Studio theme').click();expect(page.locator('.instrument')).to_be_visible();assert page.locator('.dream-shell').count()==0
 page.get_by_role('button',name='Switch to obsidian finish').click();expect(page.get_by_role('button',name='Switch to titanium finish')).to_be_visible()
 page.get_by_role('link',name='Dream theme').click();expect(page.get_by_role('button',name='Switch to light mode')).to_be_visible();assert page.locator('.instrument').count()==0;passed('Both pages navigate correctly and preserve independent preferences without stylesheet leakage')
 keys=page.evaluate('Object.keys(localStorage)');assert sorted(keys)==['keymaker.dream.mode','keymaker.dream.palette','keymaker.finish','keymaker.palette'];passed('Only each page’s color preferences are stored')
 page.goto('http://127.0.0.1:4349/dream/missing');expect(page.get_by_role('link',name='Back to Keymaker')).to_be_visible();passed('Unknown Dream path offers a return link')
 blocked=b.new_context();blocked.add_init_script("Storage.prototype.getItem=()=>{throw new Error('blocked')};Storage.prototype.setItem=()=>{throw new Error('blocked')}");bp=blocked.new_page();bp.goto('http://127.0.0.1:4349/dream');expect(bp.get_by_test_id('password-random')).not_to_have_text('—');passed('Blocked storage does not break generation')
 un=b.new_context();un.add_init_script("Object.defineProperty(globalThis,'crypto',{value:undefined})");up=un.new_page();up.goto('http://127.0.0.1:4349/dream');expect(up.get_by_role('alert')).to_contain_text('Password generation is unavailable');expect(up.get_by_role('button',name='Copy Random password')).to_be_disabled();passed('Unavailable randomness shows an error and disables copy')
 assert not errors,errors;assert not external,external;passed('No page exceptions or third-party runtime requests')
 result={'passed':checks,'errors':errors,'external_requests':external};(out/'browser-qa.json').write_text(json.dumps(result,indent=2));b.close()
