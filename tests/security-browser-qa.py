from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import json,re,os
results=[]
with sync_playwright() as p:
 b=p.chromium.launch();page=b.new_page();page.set_default_timeout(3000)
 for route in ['/', '/dream', '/horizon', '/phosphor']:
  page.goto(os.environ.get('BASE_URL','http://127.0.0.1:4349')+route);page.wait_for_load_state('networkidle')
  page.evaluate("Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:()=>new Promise(resolve=>{window.finishCopy=resolve})})")
  before=page.get_by_test_id('password-random').inner_text();page.get_by_role('button',name='Copy Random password',exact=True).click()
  page.get_by_role('button',name=re.compile(r'^(Regenerate|Generate) Random password$')).focus();page.keyboard.press('Enter');expect(page.get_by_test_id('password-random')).not_to_have_text(before)
  page.evaluate('window.finishCopy()');page.wait_for_timeout(50)
  passed='previous value' in ' '.join(page.locator('[role=status]').all_text_contents()).lower() and page.get_by_role('button',name='Copy Random password',exact=True).inner_text().lower()=='copy'
  results.append({'route':route,'copyRace':passed});print(route,'copy race',passed)
 for route in ['/', '/dream', '/horizon', '/phosphor']:
  page.goto(os.environ.get('BASE_URL','http://127.0.0.1:4349')+route);page.wait_for_load_state('networkidle')
  page.evaluate("window.copyQueue=[];Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:value=>new Promise(resolve=>{window.copyQueue.push(()=>{window.testClipboard=value;resolve()})})})")
  before=page.get_by_test_id('password-random').inner_text();page.get_by_role('button',name='Copy Random password',exact=True).click()
  page.get_by_role('button',name=re.compile(r'^(Regenerate|Generate) Random password$')).focus();page.keyboard.press('Enter');expect(page.get_by_test_id('password-random')).not_to_have_text(before)
  # Another mode can be copied while the older write is unresolved, in every theme.
  page.get_by_role('button',name=re.compile(r'^Copy .* password$')).first.click()
  page.evaluate('window.copyQueue[1]()');page.wait_for_timeout(50)
  page.evaluate('window.copyQueue[0]()');page.wait_for_timeout(50)
  passed=all(t.lower()=='copy' for t in page.get_by_role('button',name=re.compile(r'^Copy .* password$')).all_text_contents())
  results.append({'route':route,'copyRace':passed,'case':'reverse completion'});print(route,'reverse completion',passed)
 out=Path('artifacts/security');out.mkdir(parents=True,exist_ok=True);(out/'copy-race.json').write_text(json.dumps(results,indent=2));b.close()
 assert all(r['copyRace'] for r in results)
