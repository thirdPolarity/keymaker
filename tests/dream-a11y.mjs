import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
const context=await browser.newContext();
const page=await context.newPage();
const results=[];
for(const dark of [false,true]) {
 await page.goto('http://127.0.0.1:4349/dream');await page.waitForLoadState('networkidle');
 if(dark) await page.getByRole('button',{name:'Switch to dark mode'}).click();
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
fs.writeFileSync(new URL('../artifacts/dream-axe.json',import.meta.url),JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));await browser.close();
