from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import json, os
out=Path(__file__).resolve().parent.parent/'artifacts/dream-continuous-cube';out.mkdir(parents=True,exist_ok=True)
checks=[]
with sync_playwright() as p:
 engine=p.webkit if os.environ.get('WEBKIT') else p.chromium
 args={'headless':True}
 if os.environ.get('PLAYWRIGHT_WEBKIT_EXECUTABLE'):args['executable_path']=os.environ['PLAYWRIGHT_WEBKIT_EXECUTABLE']
 b=engine.launch(**args);page=b.new_page(viewport={'width':900,'height':700});page.set_default_timeout(3000)
 page.goto('http://127.0.0.1:4349/dream');page.wait_for_load_state('networkidle')
 handle=page.get_by_role('button',name='Rotate cube',exact=True)
 expect(handle).to_be_visible()
 def pose():return page.locator('.cube-orientation').evaluate('e=>getComputedStyle(e).transform')
 before=pose();handle.scroll_into_view_if_needed();rect=handle.bounding_box();x=rect['x']+rect['width']/2;y=rect['y']+rect['height']/2
 page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+75,y-35,steps=8);page.mouse.up()
 assert pose()!=before;assert page.locator('.cube-pause,.cube-reset,.cube-hint').count()==0;assert page.locator('.interactive-cube button').count()==1;checks.append('Drag rotates the standalone cube without caption or extra buttons')
 held=pose();before_time=page.locator('.cube').evaluate('e=>e.getAnimations()[0].currentTime');page.wait_for_timeout(150);assert pose()==held;assert page.locator('.cube').evaluate('e=>e.getAnimations()[0].currentTime')>before_time+50;checks.append('Automatic rotation continues immediately after release')
 handle.focus();page.keyboard.press('ArrowLeft');assert pose()!=held;checks.append('Arrow keys rotate the cube')
 handle.focus();page.keyboard.press('Home');reset=pose();assert reset!=held
 assert handle.evaluate('e=>{const faces=[...e.querySelectorAll(".cube-face")].map(f=>f.getBoundingClientRect());const r=e.getBoundingClientRect();return Math.abs((Math.min(...faces.map(f=>f.left))+Math.max(...faces.map(f=>f.right)))/2-(r.left+r.width/2))<10}')
 handle.focus();page.keyboard.press('ArrowUp');assert pose()!=reset;page.keyboard.press('Home');assert pose()==reset;checks.append('Home restores the initial view without a visible reset control')
 assert page.locator('.cube').evaluate('e=>getComputedStyle(e).animationPlayState')=='running';checks.append('Keyboard rotation and reset keep automatic motion running')
 values=page.get_by_test_id('password-random').inner_text();page.get_by_role('button',name='Blue steel',exact=True).click();assert page.get_by_test_id('password-random').inner_text()==values;assert abs(page.get_by_test_id('password-random').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')-42)<.1;checks.append('Palette change preserves passwords and the larger42px text')
 page.emulate_media(reduced_motion='reduce');assert page.locator('.cube').evaluate('e=>getComputedStyle(e).animationName')=='none';before=pose();handle.focus();page.keyboard.press('ArrowRight');assert pose()!=before;checks.append('Reduced motion stops automatic spin and retains manual control')
 for width in [320,375,768,1280]:
  page.set_viewport_size({'width':width,'height':812});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 checks.append('Cube controls fit at320–1280px')
 if not os.environ.get('WEBKIT'):
  c=b.new_context(viewport={'width':375,'height':812},is_mobile=True,has_touch=True);mobile=c.new_page();mobile.goto('http://127.0.0.1:4349/dream');h=mobile.get_by_role('button',name='Rotate cube',exact=True);h.scroll_into_view_if_needed();r=h.bounding_box();cx=r['x']+r['width']/2;cy=r['y']+r['height']/2
  session=c.new_cdp_session(mobile);old=mobile.locator('.cube-orientation').evaluate('e=>getComputedStyle(e).transform')
  for event,points in [('touchStart',[{'x':cx,'y':cy}]),('touchMove',[{'x':cx+45,'y':cy-25}]),('touchEnd',[])]:session.send('Input.dispatchTouchEvent',{'type':event,'touchPoints':points})
  assert old!=mobile.locator('.cube-orientation').evaluate('e=>getComputedStyle(e).transform');assert mobile.locator('.cube').evaluate('e=>getComputedStyle(e).animationPlayState')=='running';checks.append('Real touchscreen drag rotates cube and release resumes automatic motion')
 (out/('cube-webkit.json' if os.environ.get('WEBKIT') else 'cube-chromium.json')).write_text(json.dumps({'passed':checks},indent=2));print(json.dumps({'passed':len(checks),'checks':checks}));b.close()
