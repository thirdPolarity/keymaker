from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import json
out=Path(__file__).resolve().parents[1]/'artifacts'
out.mkdir(exist_ok=True)
checks=[];errors=[];external=[]
def passed(s): checks.append(s);print('PASS',s,flush=True)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 context=browser.new_context(viewport={'width':1280,'height':800},permissions=['clipboard-read','clipboard-write'])
 page=context.new_page();page.set_default_timeout(6000)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:external.append(r.url) if not r.url.startswith(('http://127.0.0.1:4349','data:','blob:')) else None)
 page.goto('http://127.0.0.1:4349');page.wait_for_load_state('networkidle');page.evaluate('document.fonts.ready')
 def values(): return {m:page.get_by_test_id('password-'+m).inner_text() for m in ['grouped','random','memorable']}
 original=values();assert all(original.values());passed('Three real passwords on first render')
 for mode in ['Grouped','Random','Memorable']:
  expected=page.get_by_test_id('password-'+mode.lower()).inner_text()
  page.get_by_role('button',name=f'Copy {mode} password',exact=True).click()
  assert page.evaluate('navigator.clipboard.readText()')==expected
  expect(page.get_by_role('status').last).to_have_text(mode+' password copied.')
 passed('All three copy actions copy the exact displayed string')
 page.screenshot(path=str(out/'final-copied.png'),full_page=True,animations='disabled')
 page.get_by_role('button',name='Regenerate Random password',exact=True).click()
 after=values();assert after['random']!=original['random'];assert after['grouped']==original['grouped'];assert after['memorable']==original['memorable'];passed('Per-mode regeneration leaves other outputs intact')
 page.get_by_role('button',name='Generate all',exact=True).click();assert all(values()[m]!=after[m] for m in after);passed('Generate all refreshes every output')
 # Pending settings are kept independently.
 page.get_by_role('button',name='Random',exact=True).click();page.get_by_role('slider',name='Length').fill('32')
 page.get_by_role('button',name='Grouped',exact=True).click();page.get_by_role('slider',name='Length').fill('24')
 page.get_by_role('button',name='Apply & generate',exact=True).click();assert len(values()['grouped'].replace('-',''))==24
 page.get_by_role('button',name='Random',exact=True).click();expect(page.get_by_role('button',name='Apply & generate',exact=True)).to_be_visible()
 page.get_by_role('button',name='Apply & generate',exact=True).click();assert len(values()['random'])==32;passed('Independent pending settings and explicit apply')
 page.get_by_role('slider',name='Length').fill('64');page.get_by_role('button',name='Apply & generate',exact=True).click();assert len(values()['random'])==64
 page.screenshot(path=str(out/'final-long-desktop.png'),full_page=True,animations='disabled')
 for label in ['Uppercase','Lowercase','Symbols']:page.get_by_role('checkbox',name=label,exact=True).uncheck()
 expect(page.get_by_role('checkbox',name='Numbers',exact=True)).to_be_disabled()
 page.get_by_role('button',name='Apply & generate',exact=True).click();assert values()['random'].isdigit();passed('Character toggles respected; last selection cannot be removed')
 page.get_by_role('button',name='Memorable',exact=True).click();page.get_by_role('slider',name='Words').fill('8')
 page.get_by_label('Separator',exact=True).select_option('_');page.get_by_role('checkbox',name='Add a number',exact=True).check();page.get_by_role('checkbox',name='Add a symbol',exact=True).check()
 page.get_by_role('button',name='Apply & generate',exact=True).click();assert len(values()['memorable'].split('_'))>=10;passed('Memorable count, separator, number and symbol controls')
 before=values()
 for name in ['Classic DMG','Cyan matrix','Purple haze','Orange sunset','SNES','Red alert','Blue steel','Monochrome','Amber terminal']:
  page.get_by_role('button',name=name,exact=True).click();assert values()==before
 passed('Nine palettes change the display without changing passwords')
 keys=page.evaluate('Object.keys(localStorage)');assert sorted(keys)==['keymaker.finish','keymaker.palette'];passed('Only finish and display preferences are stored')
 page.evaluate("Object.defineProperty(navigator.clipboard,'writeText',{value:async()=>{throw new DOMException('Blocked','NotAllowedError')},configurable:true})")
 page.get_by_role('button',name='Copy Random password',exact=True).click();expect(page.get_by_role('alert')).to_contain_text('Select the password text')
 assert page.locator('.copy-button.copied').count()==0
 page.screenshot(path=str(out/'final-clipboard-denied.png'),full_page=True,animations='disabled');passed('Clipboard denial has truthful feedback and manual-copy recovery')
 page.get_by_role('button',name='Dismiss message').click()
 page.get_by_role('button',name='About Keymaker').click();expect(page.get_by_role('dialog')).to_be_visible()
 for _ in range(9): page.keyboard.press('Tab');assert page.evaluate("document.activeElement.closest('dialog') !== null || document.activeElement === document.body")
 page.keyboard.press('Escape');expect(page.get_by_role('dialog')).not_to_be_visible();passed('Privacy dialog keyboard focus is contained, Escape closes it')
 page.get_by_role('button',name='Generate all',exact=True).focus();page.screenshot(path=str(out/'final-keyboard-focus.png'),full_page=True,animations='disabled')
 page.reload();page.wait_for_load_state('networkidle');page.set_viewport_size({'width':375,'height':812})
 page.get_by_role('button',name='Switch to obsidian finish').click();page.screenshot(path=str(out/'final-mobile-dark.png'),full_page=True,animations='disabled')
 page.get_by_role('button',name='Fine tune',exact=True).click();page.get_by_role('button',name='Random',exact=True).click();page.get_by_role('slider',name='Length').fill('64');page.get_by_role('button',name='Apply & generate').click()
 page.screenshot(path=str(out/'final-mobile-settings-long.png'),full_page=True,animations='disabled')
 targets=page.locator('button:visible, summary:visible, .toggle-row:visible').evaluate_all('(els)=>els.map(e=>({name:e.getAttribute("aria-label")||e.textContent.trim(),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})).filter(e=>e.width<43.9||e.height<43.9)')
 (out/'final-small-targets.json').write_text(json.dumps(targets,indent=2));print('SMALL TARGETS',targets,flush=True)
 for width in [320,375,768,1280]:
  page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
 passed('Long outputs and expanded controls have no overflow at 320, 375, 768, 1280')
 page.set_viewport_size({'width':375,'height':812});page.locator('.mobile-palette summary').click();page.screenshot(path=str(out/'final-mobile-palette.png'),full_page=True,animations='disabled');page.get_by_role('button',name='SNES',exact=True).click();assert not page.locator('.mobile-palette').get_attribute('open');passed('Mobile display picker opens, selects, and closes')
 page.emulate_media(reduced_motion='reduce');assert page.get_by_test_id('password-random').evaluate('e=>getComputedStyle(e).animationName')=='none';passed('Reduced motion disables display animation')
 # With no network after loading, generation still works.
 context.set_offline(True);before=values();page.get_by_role('button',name='Generate all').click();assert all(values()[m]!=before[m] for m in before);context.set_offline(False);passed('Generation works offline once loaded')
 page.goto('http://127.0.0.1:4349/obsidian');expect(page.get_by_role('button',name='Switch to titanium finish')).to_be_visible();passed('Existing /obsidian route opens the dark finish')
 page.goto('http://127.0.0.1:4349/missing');expect(page.get_by_role('link',name='Back to Keymaker')).to_be_visible();passed('Unknown route has a working return path')
 blocked=browser.new_context();blocked.add_init_script("Storage.prototype.getItem=()=>{throw new Error('blocked')};Storage.prototype.setItem=()=>{throw new Error('blocked')}")
 b=blocked.new_page();b.goto('http://127.0.0.1:4349');expect(b.get_by_test_id('password-random')).not_to_have_text('—');b.get_by_role('button',name='Generate all').click();passed('Blocked browser storage does not break generation')
 unavailable=browser.new_context();unavailable.add_init_script("Object.defineProperty(globalThis,'crypto',{value:undefined})")
 u=unavailable.new_page();u.goto('http://127.0.0.1:4349');expect(u.get_by_role('alert')).to_contain_text('Password generation is unavailable');expect(u.get_by_role('button',name='Copy Random password')).to_be_disabled();passed('Unavailable Web Crypto shows an error and disables copy')
 assert not errors,errors;assert not external,external;passed('No page exceptions or third-party runtime requests')
 result={'passed':checks,'errors':errors,'external_requests':external,'small_targets':targets}
 (out/'browser-qa.json').write_text(json.dumps(result,indent=2));(out/'rendered-states.txt').write_text(page.locator('body').inner_text()+'\n'+b.locator('body').inner_text()+'\n'+u.locator('body').inner_text())
 browser.close()
