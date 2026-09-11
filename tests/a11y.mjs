import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
const context=await browser.newContext({viewport:{width:1280,height:800}});
const page=await context.newPage();
const results=[];
for(const dark of [false,true]){
 await page.goto('http://127.0.0.1:4349'+(dark?'/obsidian':''));await page.waitForLoadState('networkidle');
 for(const width of [1280,375]){
  await page.setViewportSize({width,height:900});
  if(width===375) await page.getByRole('button',{name:'Fine tune',exact:true}).click();
  await page.addStyleTag({content:'*{transition:none!important;animation:none!important}'});
  const r=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  results.push({dark,width,violations:r.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>({id:v.id,nodes:v.nodes.length}))});
 }
}
fs.mkdirSync(new URL('../artifacts/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../artifacts/axe.json',import.meta.url),JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));await browser.close();
