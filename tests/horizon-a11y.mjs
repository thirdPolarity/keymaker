import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
const context=await browser.newContext();
const page=await context.newPage();
const results=[];
for(const dark of [false,true]) {
 await page.goto('http://127.0.0.1:4349/horizon');await page.waitForLoadState('networkidle');
 if(process.env.FLAT_CONTRAST) await page.addStyleTag({content:'.horizon-shell:before,.dream-content:before,.dream-content:after,.horizon-inner-frame{display:none!important}.horizon-shell .dream-content{background:var(--paper)!important;filter:none!important}.horizon-shell{background:#d2b0f5!important}'});
 if(Boolean(await page.locator('.is-dark').count())!==dark) await page.locator('.mode-button').click();
 for(const width of [1280,375]) {
  await page.setViewportSize({width,height:900});
  for(const settings of [false,true]) {
   if(settings) await page.getByRole('button',{name:'Settings',exact:true}).click();
   const r=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
   results.push({dark,width,settings,violations:r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});
   if(settings) await page.keyboard.press('Escape');
  }
 }
}
fs.mkdirSync(new URL('../artifacts/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL(process.env.FLAT_CONTRAST?'../artifacts/horizon-axe-flat.json':'../artifacts/horizon-axe.json',import.meta.url),JSON.stringify(results,null,2));
console.log(JSON.stringify(results.map(r=>({dark:r.dark,width:r.width,settings:r.settings,violations:r.violations,incomplete:r.incomplete.length})),null,2));await browser.close();
